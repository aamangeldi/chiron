const EventEmitter = require('events');

class FriendsSync extends EventEmitter {
  constructor() {
    super();
    this.friends = new Map();
    this.userId = null;
    this.ws = null;
    this.serverUrl = 'ws://localhost:3000'; // WebSocket server URL
  }

  // Initialize user
  setUser(userId, username) {
    this.userId = userId;
    this.username = username;
  }

  // Connect to sync server
  connect() {
    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('Connected to friends sync server');
        this.emit('connected');

        // Register user
        this.send({
          type: 'register',
          userId: this.userId,
          username: this.username
        });
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from sync server');
        this.emit('disconnected');

        // Reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000);
      };
    } catch (err) {
      console.error('Failed to connect:', err);
      // Use mock data if server is unavailable
      this.useMockData();
    }
  }

  // Handle incoming messages
  handleMessage(data) {
    switch (data.type) {
      case 'friend-update':
        this.updateFriend(data.friend);
        break;

      case 'friends-list':
        this.updateFriendsList(data.friends);
        break;

      case 'friend-offline':
        this.setFriendOffline(data.userId);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  // Update friend info
  updateFriend(friendData) {
    this.friends.set(friendData.id, {
      id: friendData.id,
      name: friendData.name,
      avatar: friendData.avatar,
      currentSite: friendData.currentSite,
      currentActivity: friendData.currentActivity,
      categories: friendData.categories,
      timestamp: new Date(friendData.timestamp),
      online: true
    });

    this.emit('friend-updated', this.friends.get(friendData.id));
  }

  // Update entire friends list
  updateFriendsList(friendsList) {
    friendsList.forEach(friend => {
      this.updateFriend(friend);
    });

    this.emit('friends-updated', Array.from(this.friends.values()));
  }

  // Set friend as offline
  setFriendOffline(userId) {
    const friend = this.friends.get(userId);
    if (friend) {
      friend.online = false;
      this.emit('friend-updated', friend);
    }
  }

  // Send message to server
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Broadcast current browsing activity
  broadcastActivity(activityData) {
    this.send({
      type: 'activity-update',
      userId: this.userId,
      currentSite: activityData.domain,
      currentActivity: activityData.title,
      categories: activityData.categories,
      timestamp: new Date().toISOString()
    });
  }

  // Add friend
  addFriend(friendId) {
    this.send({
      type: 'add-friend',
      userId: this.userId,
      friendId: friendId
    });
  }

  // Remove friend
  removeFriend(friendId) {
    this.friends.delete(friendId);
    this.send({
      type: 'remove-friend',
      userId: this.userId,
      friendId: friendId
    });

    this.emit('friends-updated', Array.from(this.friends.values()));
  }

  // Get all friends
  getFriends() {
    return Array.from(this.friends.values());
  }

  // Get online friends
  getOnlineFriends() {
    return Array.from(this.friends.values()).filter(f => f.online);
  }

  // Use mock data when server is unavailable
  useMockData() {
    const mockFriends = [
      {
        id: '1',
        name: 'Alex M.',
        avatar: '🎮',
        currentSite: 'youtube.com',
        currentActivity: 'Watching RL tutorials',
        categories: ['Gaming', 'Video', 'Social', 'News'],
        timestamp: new Date(Date.now() - 2 * 60000),
        online: true
      },
      {
        id: '2',
        name: 'Sarah L.',
        avatar: '👩',
        currentSite: 'github.com',
        currentActivity: 'Anthropic Claude repo',
        categories: ['Coding', 'Docs', 'Social', 'Shopping'],
        timestamp: new Date(Date.now() - 5 * 60000),
        online: true
      },
      {
        id: '3',
        name: 'James K.',
        avatar: '👨',
        currentSite: 'reddit.com',
        currentActivity: 'Browsing r/programming',
        categories: ['Social', 'News', 'Gaming'],
        timestamp: new Date(Date.now() - 12 * 60000),
        online: true
      }
    ];

    mockFriends.forEach(friend => {
      this.friends.set(friend.id, friend);
    });

    this.emit('friends-updated', Array.from(this.friends.values()));

    console.log('Using mock friends data (server unavailable)');
  }

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

module.exports = FriendsSync;
