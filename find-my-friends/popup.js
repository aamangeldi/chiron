// Popup script to display current location and friends
document.addEventListener('DOMContentLoaded', async () => {
  // Load current user location
  loadMyLocation();

  // Add click listeners to all friend items
  setupFriendClickHandlers();

  // In a real app, you'd fetch friends' locations from a server
  // loadFriendsLocations();
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

// In a real implementation, you would fetch friends' locations from your backend
async function loadFriendsLocations() {
  // Example API call
  // const response = await fetch('https://your-api.com/friends/locations');
  // const friends = await response.json();
  // renderFriends(friends);
}

function renderFriends(friends) {
  const container = document.getElementById('friends-list');
  container.innerHTML = '<div class="section-label">👥 Friends Online</div>';

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

// Listen for location updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.myLocation) {
    loadMyLocation();
  }
});
