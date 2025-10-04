// Background script to track current tab and sync location to Supabase
importScripts('supabase.js');

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

const supabaseClient = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

let currentUrl = '';
let currentTitle = '';

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  updateCurrentLocation(tab);
});

// Track URL changes in current tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    updateCurrentLocation(tab);
  }
});

// Track when user switches windows
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    const [tab] = await chrome.tabs.query({ active: true, windowId: windowId });
    if (tab) {
      updateCurrentLocation(tab);
    }
  }
});

async function updateCurrentLocation(tab) {
  if (!tab || !tab.url) return;

  // Skip chrome:// and extension pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  currentUrl = tab.url;
  currentTitle = tab.title || 'Unknown';

  // Extract domain for cleaner display
  let domain;
  try {
    const url = new URL(tab.url);
    domain = url.hostname;
  } catch (e) {
    domain = tab.url;
  }

  const location = {
    url: currentUrl,
    title: currentTitle,
    domain: domain,
    timestamp: Date.now(),
    favicon: tab.favIconUrl || ''
  };

  // Store current location locally
  chrome.storage.local.set({ myLocation: location });

  // Sync location to Supabase
  await syncLocationToSupabase(location);
}

async function syncLocationToSupabase(location) {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      console.log('User not authenticated. Skipping sync.');
      return;
    }

    // Upsert user location to Supabase
    const { error } = await supabaseClient
      .from('user_locations')
      .upsert({
        user_id: user.id,
        url: location.url,
        last_updated: new Date().toISOString()
      });

    if (error) {
      console.error('Error syncing location to Supabase:', error);
    } else {
      console.log('Location synced to Supabase:', location.url);
    }
  } catch (err) {
    console.error('Failed to sync location:', err);
  }
}

// Initialize on startup
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    updateCurrentLocation(tabs[0]);
  }
});
