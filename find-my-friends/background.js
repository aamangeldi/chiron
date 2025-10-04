// Background script to track current tab and sync location
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

function updateCurrentLocation(tab) {
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

  // Store current location
  chrome.storage.local.set({ myLocation: location });

  // In a real app, you would send this to a server/backend
  // syncLocationToServer(location);
}

// Simulate syncing to server (placeholder)
function syncLocationToServer(location) {
  // This would be your API call to sync location with friends
  console.log('Syncing location:', location);
}

// Initialize on startup
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    updateCurrentLocation(tabs[0]);
  }
});
