// Popup script to display current location and friends
const SUPABASE_URL = 'https://rlhajpxbevywdurchyxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ih8X9Pid8TBDBngnbx48rw_90hstEfL';

// Custom storage adapter using Chrome storage API
const chromeStorageAdapter = {
  getItem: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },
  setItem: async (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  }
};

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    // Redirect to auth page if not logged in
    window.location.href = 'auth.html';
    return;
  }

  // Display user email
  document.getElementById('user-email').textContent = user.email;

  // Setup logout button
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'auth.html';
  });

  // Setup add friend button
  document.getElementById('add-friend-btn').addEventListener('click', async () => {
    await addFriend();
  });

  // Setup enter key for add friend input
  document.getElementById('friend-email-input').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      await addFriend();
    }
  });

  // Load current user location
  loadMyLocation();

  // Load friend requests
  await loadFriendRequests();

  // Add click listeners to all friend items
  setupFriendClickHandlers();

  // Load real friends' locations from Supabase
  await loadFriendsLocations();

  // Poll for friends' location updates every 5 seconds
  setInterval(async () => {
    await loadFriendsLocations();
  }, 5000);
});

function setupFriendClickHandlers() {
  const friendItems = document.querySelectorAll('.friend-item');
  friendItems.forEach(item => {
    const url = item.getAttribute('data-url');
    if (url) {
      item.addEventListener('click', () => openUrl(url));
      item.style.cursor = 'pointer';
    }
  });
}

async function loadMyLocation() {
  try {
    const result = await chrome.storage.local.get('myLocation');
    const location = result.myLocation;

    if (location) {
      document.getElementById('my-domain').textContent = location.domain || 'Unknown';
      document.getElementById('my-title').textContent = location.title || '-';

      const favicon = document.getElementById('my-favicon');
      if (location.favicon) {
        favicon.src = location.favicon;
        favicon.style.display = 'block';
      } else {
        favicon.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error loading location:', error);
    document.getElementById('my-domain').textContent = 'No active page';
    document.getElementById('my-title').textContent = '-';
  }
}

// Function to open a URL when clicking on a friend
function openUrl(url) {
  chrome.tabs.create({ url: url });
}

// Fetch friends' locations from Supabase
async function loadFriendsLocations() {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      console.log('User not authenticated. Cannot load friends.');
      return;
    }

    // Get user's friendships
    const { data: friendships, error: friendshipsError } = await supabaseClient
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id);

    if (friendshipsError) {
      console.error('Error fetching friendships:', friendshipsError);
      return;
    }

    if (!friendships || friendships.length === 0) {
      console.log('No friends found.');
      renderNoFriends();
      return;
    }

    // Get friend IDs
    const friendIds = friendships.map(f => f.friend_id);

    // Get friends' current locations
    const { data: locations, error: locationsError } = await supabaseClient
      .from('user_locations')
      .select('*')
      .in('user_id', friendIds);

    if (locationsError) {
      console.error('Error fetching friend locations:', locationsError);
      return;
    }

    // Transform locations into friend objects with emails
    const friends = [];

    for (const loc of locations) {
      // Get email for each friend
      const { data: email } = await supabaseClient.rpc('get_user_email_by_id', {
        user_id: loc.user_id
      });

      let domain;
      try {
        const url = new URL(loc.url);
        domain = url.hostname;
      } catch (e) {
        domain = loc.url;
      }

      friends.push({
        name: email || loc.user_id.substring(0, 8),
        avatar: `https://i.pravatar.cc/150?u=${loc.user_id}`,
        url: loc.url,
        domain: domain,
        title: domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        timestamp: new Date(loc.last_updated).getTime(),
        isOnline: true,
        browsingHistory: []
      });
    }

    // Render friends
    renderFriends(friends);
  } catch (err) {
    console.error('Failed to load friends locations:', err);
  }
}

function renderNoFriends() {
  const container = document.getElementById('friends-list');
  container.innerHTML = `
    <div class="section-label">👥 Friends Online</div>
    <div style="padding: 20px; text-align: center; font-size: 6px; color: #666; text-shadow: 1px 1px 0px #000;">
      No friends added yet. Add friends in Supabase to see their browsing locations!
    </div>
  `;
}

function renderFriends(friends) {
  const container = document.getElementById('friends-list');
  container.innerHTML = '<div class="section-label">👥 Friends Online</div>';

  if (friends.length === 0) {
    renderNoFriends();
    return;
  }

  friends.forEach(friend => {
    const friendItem = createFriendElement(friend);
    container.appendChild(friendItem);
  });
}

function createFriendElement(friend) {
  const div = document.createElement('div');
  div.className = 'friend-item';
  div.setAttribute('data-url', friend.url);
  div.style.cursor = 'pointer';
  div.addEventListener('click', () => openUrl(friend.url));

  const statusClass = friend.isOnline ? '' : 'offline';
  const timeAgo = getTimeAgo(friend.timestamp);
  const heatmapCells = generateHeatmapCells(friend.browsingHistory || []);

  div.innerHTML = `
    <div class="friend-header">
      <img class="friend-avatar" src="${friend.avatar}" alt="${friend.name}">
      <div class="friend-name">${friend.name}</div>
      <span class="status-indicator ${statusClass}"></span>
      <div class="friend-timestamp">${timeAgo}</div>
    </div>
    <div class="friend-location">
      <img class="friend-favicon" src="${friend.favicon}" alt="">
      <div class="friend-url">${friend.domain} - ${friend.title}</div>
    </div>
    <div class="browsing-heatmap">
      <div class="heatmap-label">Browsing today</div>
      <div class="category-heatmap">
        ${heatmapCells}
      </div>
    </div>
  `;

  return div;
}

function generateHeatmapCells(browsingHistory) {
  // Category mapping based on domain patterns
  const categoryMap = {
    'youtube.com': 'Video',
    'netflix.com': 'Video',
    'twitch.tv': 'Video',
    'github.com': 'Coding',
    'stackoverflow.com': 'Coding',
    'gitlab.com': 'Coding',
    'twitter.com': 'Social',
    'facebook.com': 'Social',
    'instagram.com': 'Social',
    'reddit.com': 'Social',
    'nytimes.com': 'News',
    'cnn.com': 'News',
    'bbc.com': 'News',
    'notion.so': 'Productivity',
    'google.com/docs': 'Productivity',
    'slack.com': 'Productivity',
    'amazon.com': 'Shopping',
    'gmail.com': 'Email',
  };

  const categoryIcons = {
    'Video': '📺',
    'Coding': '💻',
    'Social': '💬',
    'News': '📰',
    'Productivity': '📝',
    'Shopping': '🛍️',
    'Email': '📧',
    'Gaming': '🎮',
    'Sports': '⚽',
    'Docs': '📚',
  };

  // Count visits per category
  const categoryCounts = {};

  browsingHistory.forEach(item => {
    const category = getCategoryFromUrl(item.url || item.domain, categoryMap);
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });

  // Sort by count and create tags
  const tags = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5 categories
    .map(([category, count]) => {
      let level = 1;
      if (count > 3) level = 2;
      if (count > 8) level = 3;
      if (count > 15) level = 4;

      const icon = categoryIcons[category] || '🌐';
      return `<div class="category-tag level-${level}">${icon} ${category}</div>`;
    });

  return tags.join('');
}

function getCategoryFromUrl(url, categoryMap) {
  if (!url) return null;

  for (const [domain, category] of Object.entries(categoryMap)) {
    if (url.includes(domain)) {
      return category;
    }
  }

  return null;
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Add friend by email
async function addFriend() {
  const emailInput = document.getElementById('friend-email-input');
  const addButton = document.getElementById('add-friend-btn');
  const email = emailInput.value.trim();

  if (!email) {
    alert('Please enter an email address');
    return;
  }

  try {
    addButton.disabled = true;
    addButton.textContent = '...';

    const { data: { user } } = await supabaseClient.auth.getUser();

    // Check if trying to add yourself
    if (email === user.email) {
      alert('You cannot add yourself as a friend');
      return;
    }

    // Look up user by email using Supabase auth admin
    // Since we can't use admin API from client, we'll need to use a different approach
    // We'll create a helper function that queries by email via RPC or edge function
    // For now, let's assume we have the user_id somehow

    // Simple approach: create a public function or use edge function
    // For MVP, we'll show an error and require user_id directly

    // Better approach: Use Supabase RPC function
    const { data: userData, error: userError } = await supabaseClient.rpc('get_user_id_by_email', {
      user_email: email
    });

    if (userError || !userData) {
      alert('User not found with that email');
      console.error('Error finding user:', userError);
      return;
    }

    const friendId = userData;

    // Check if already friends
    const { data: existingFriendship } = await supabaseClient
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .single();

    if (existingFriendship) {
      alert('You are already friends with this user');
      return;
    }

    // Check if request already exists
    const { data: existingRequest } = await supabaseClient
      .from('friend_requests')
      .select('*')
      .eq('from_user_id', user.id)
      .eq('to_user_id', friendId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      alert('Friend request already sent');
      return;
    }

    // Create friend request
    const { error: requestError } = await supabaseClient
      .from('friend_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: friendId,
        status: 'pending'
      });

    if (requestError) {
      alert('Error sending friend request');
      console.error('Error creating friend request:', requestError);
      return;
    }

    alert('Friend request sent!');
    emailInput.value = '';
  } catch (err) {
    console.error('Error adding friend:', err);
    alert('An error occurred while sending friend request');
  } finally {
    addButton.disabled = false;
    addButton.textContent = 'Add';
  }
}

// Load friend requests
async function loadFriendRequests() {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Get pending requests sent to current user
    const { data: requests, error } = await supabaseClient
      .from('friend_requests')
      .select('*, from_user_id')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error loading friend requests:', error);
      return;
    }

    if (!requests || requests.length === 0) {
      document.getElementById('friend-requests-section').style.display = 'none';
      return;
    }

    // We need to get user emails for the requests
    // This will require an RPC function or edge function
    // For now, show user IDs
    document.getElementById('friend-requests-section').style.display = 'block';
    await renderFriendRequests(requests);
  } catch (err) {
    console.error('Error loading friend requests:', err);
  }
}

// Render friend requests
async function renderFriendRequests(requests) {
  const container = document.getElementById('friend-requests-list');
  container.innerHTML = '';

  for (const request of requests) {
    // Get email for the user who sent the request
    const { data: email, error } = await supabaseClient.rpc('get_user_email_by_id', {
      user_id: request.from_user_id
    });

    const displayEmail = email || request.from_user_id;

    const requestItem = document.createElement('div');
    requestItem.className = 'request-item';
    requestItem.innerHTML = `
      <div class="request-email">${displayEmail}</div>
      <div class="request-buttons">
        <button class="accept-btn" data-request-id="${request.id}" data-from-user="${request.from_user_id}">Accept</button>
        <button class="reject-btn" data-request-id="${request.id}">Reject</button>
      </div>
    `;
    container.appendChild(requestItem);
  }

  // Setup accept/reject handlers
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', () => acceptFriendRequest(btn.dataset.requestId, btn.dataset.fromUser));
  });

  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', () => rejectFriendRequest(btn.dataset.requestId));
  });
}

// Accept friend request
async function acceptFriendRequest(requestId, fromUserId) {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Update request status
    const { error: updateError } = await supabaseClient
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating friend request:', updateError);
      alert('Error accepting friend request');
      return;
    }

    // Create bidirectional friendship
    const { error: friendship1Error } = await supabaseClient
      .from('friendships')
      .insert({ user_id: user.id, friend_id: fromUserId });

    const { error: friendship2Error } = await supabaseClient
      .from('friendships')
      .insert({ user_id: fromUserId, friend_id: user.id });

    if (friendship1Error || friendship2Error) {
      console.error('Error creating friendship:', friendship1Error || friendship2Error);
      alert('Error creating friendship');
      return;
    }

    // Reload requests and friends
    await loadFriendRequests();
    await loadFriendsLocations();
  } catch (err) {
    console.error('Error accepting friend request:', err);
    alert('An error occurred while accepting friend request');
  }
}

// Reject friend request
async function rejectFriendRequest(requestId) {
  try {
    const { error } = await supabaseClient
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting friend request:', error);
      alert('Error rejecting friend request');
      return;
    }

    // Reload requests
    await loadFriendRequests();
  } catch (err) {
    console.error('Error rejecting friend request:', err);
    alert('An error occurred while rejecting friend request');
  }
}

// Listen for location updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.myLocation) {
    loadMyLocation();
  }
});
