// Popup script to display current location and friends
document.addEventListener('DOMContentLoaded', async () => {
  // Load current user location
  loadMyLocation();

  // In a real app, you'd fetch friends' locations from a server
  // loadFriendsLocations();
});

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
  div.onclick = () => openUrl(friend.url);

  const statusClass = friend.isOnline ? '' : 'offline';
  const timeAgo = getTimeAgo(friend.timestamp);

  div.innerHTML = `
    <div class="friend-header">
      <div class="friend-avatar">${friend.initials}</div>
      <div class="friend-name">${friend.name}</div>
      <span class="status-indicator ${statusClass}"></span>
      <div class="friend-timestamp">${timeAgo}</div>
    </div>
    <div class="friend-location">
      <img class="friend-favicon" src="${friend.favicon}" alt="">
      <div class="friend-url">${friend.domain} - ${friend.title}</div>
    </div>
  `;

  return div;
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
