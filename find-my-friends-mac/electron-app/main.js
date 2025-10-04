const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const BrowserTracker = require('./browserTracker');

let mainWindow;
let pillWindow;
let browserTracker;
let isPillMode = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a2332'
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('blur', () => {
    if (!isPillMode) {
      switchToPillMode();
    }
  });

  // Initialize browser tracker
  browserTracker = new BrowserTracker();

  // Update current site every 5 seconds
  setInterval(async () => {
    try {
      const currentTab = await browserTracker.getCurrentTab();
      if (currentTab && mainWindow) {
        mainWindow.webContents.send('current-site-update', currentTab);
      }
    } catch (err) {
      console.error('Error tracking browser:', err);
    }
  }, 5000);
}

function createPillWindow() {
  pillWindow = new BrowserWindow({
    width: 80,
    height: 130,
    x: 20,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  pillWindow.loadFile('pill.html');
  pillWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  pillWindow.setAlwaysOnTop(true, 'floating', 1);

  pillWindow.on('closed', () => {
    pillWindow = null;
  });
}

function switchToPillMode() {
  if (isPillMode) return;

  isPillMode = true;

  if (!pillWindow) {
    createPillWindow();
  } else {
    pillWindow.show();
  }

  if (mainWindow) {
    mainWindow.hide();
  }
}

function switchToNormalMode() {
  if (!isPillMode) return;

  isPillMode = false;

  if (pillWindow) {
    pillWindow.hide();
  }

  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

// IPC handlers
ipcMain.handle('get-current-site', async () => {
  if (browserTracker) {
    return await browserTracker.getCurrentTab();
  }
  return null;
});

ipcMain.handle('get-browsing-summary', async () => {
  if (browserTracker) {
    return await browserTracker.getBrowsingSummary();
  }
  return { categories: [], topSites: [] };
});

ipcMain.handle('get-browser-history', async (event, limit = 50) => {
  if (browserTracker) {
    return await browserTracker.getChromeHistory(limit);
  }
  return [];
});

ipcMain.on('switch-to-normal-mode', () => {
  switchToNormalMode();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
