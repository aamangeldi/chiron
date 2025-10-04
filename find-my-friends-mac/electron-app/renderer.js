const { ipcRenderer } = require('electron');

// Friends data
let friends = [];

// Category icon mapping
const categoryIcons = {
  'Gaming': '🎮',
  'Video': '📹',
  'Social': '💬',
  'News': '📰',
  'Coding': '💻',
  'Docs': '📄',
  'Shopping': '🛒',
  'Other': '🌐'
};

// Activity icon mapping based on site
const activityIcons = {
  'youtube.com': '📺',
  'github.com': '💻',
  'reddit.com': '🌐',
  'twitter.com': '🐦',
  'facebook.com': '👥',
  'notion.com': '📝',
  'stackoverflow.com': '💻',
  'linkedin.com': '💼'
};

// Format timestamp
function formatTimestamp(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // difference in seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Load mock friends data (fallback)
function loadMockFriends() {
  friends = [
    {
      id: '1',
      name: 'Alex M.',
      avatar: '🎮',
      currentSite: 'youtube.com',
      currentActivity: 'Watching RL tutorials',
      timestamp: new Date(Date.now() - 2 * 60000),
      categories: ['Gaming', 'Video', 'Social', 'News'],
      online: true
    },
    {
      id: '2',
      name: 'Sarah L.',
      avatar: '👩',
      currentSite: 'github.com',
      currentActivity: 'Anthropic Claude repo',
      timestamp: new Date(Date.now() - 5 * 60000),
      categories: ['Coding', 'Docs', 'Social', 'Shopping'],
      online: true
    },
    {
      id: '3',
      name: 'James K.',
      avatar: '👨',
      currentSite: 'reddit.com',
      currentActivity: 'Browsing r/programming',
      timestamp: new Date(Date.now() - 12 * 60000),
      categories: ['Social', 'News', 'Gaming'],
      online: true
    }
  ];
}

// Render friends list
function renderFriends() {
  const friendsList = document.getElementById('friendsList');
  friendsList.innerHTML = '';

  if (friends.length === 0) {
    friendsList.innerHTML = '<div style="color: #7799aa; padding: 20px; text-align: center;">No friends online</div>';
    return;
  }

  friends.forEach(friend => {
    const friendCard = createFriendCard(friend);
    friendsList.appendChild(friendCard);
  });
}

// Create friend card element
function createFriendCard(friend) {
  const card = document.createElement('div');
  card.className = 'friend-card';

  const icon = activityIcons[friend.currentSite] || '🌐';
  const timestamp = friend.timestamp instanceof Date ? formatTimestamp(friend.timestamp) : friend.timestamp;

  card.innerHTML = `
    <div class="friend-header">
      <div class="friend-info">
        <div class="friend-avatar">${friend.avatar}</div>
        <div class="friend-name">${friend.name}</div>
        <div class="online-status"></div>
      </div>
      <div class="timestamp">${timestamp}</div>
    </div>

    <div class="current-activity">
      <span class="activity-icon">${icon}</span>
      <span class="activity-text">${friend.currentSite} - ${friend.currentActivity}</span>
    </div>

    <div class="browsing-today">
      <div class="browsing-label">Browsing today</div>
      <div class="category-tags">
        ${friend.categories.map(cat => `
          <div class="category-tag ${cat.toLowerCase()}">
            ${categoryIcons[cat] || ''} ${cat}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Add click handler to open friend's website
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => {
    const url = friend.currentSite.startsWith('http')
      ? friend.currentSite
      : `https://${friend.currentSite}`;
    require('electron').shell.openExternal(url);
  });

  return card;
}

// Update current user site
function updateCurrentSite(siteData) {
  const urlElement = document.querySelector('.site-url');
  const nameElement = document.querySelector('.site-name');

  if (siteData && urlElement && nameElement) {
    urlElement.textContent = siteData.url || siteData.domain;
    nameElement.textContent = siteData.domain || siteData.title;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Load mock friends initially
  loadMockFriends();
  renderFriends();

  // Try to get current site
  try {
    const currentSite = await ipcRenderer.invoke('get-current-site');
    if (currentSite) {
      updateCurrentSite(currentSite);
    }
  } catch (err) {
    console.log('Could not load current site');
  }

  // Listen for current site updates
  ipcRenderer.on('current-site-update', (event, siteData) => {
    updateCurrentSite(siteData);
  });

  // Update timestamps periodically
  setInterval(() => {
    renderFriends();
  }, 30000); // Update every 30 seconds
});
