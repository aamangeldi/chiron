const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isCollapsed = false;

const EXPANDED_HEIGHT = 600;
const COLLAPSED_HEIGHT = 50;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: EXPANDED_HEIGHT,
    x: 100,
    y: 100,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('widget.html');

  // Optional: Open DevTools for debugging
  // mainWindow.webContents.openDevTools();
}

// Handle collapse/expand toggle
ipcMain.on('toggle-collapse', () => {
  isCollapsed = !isCollapsed;
  const newHeight = isCollapsed ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;
  const currentBounds = mainWindow.getBounds();

  mainWindow.setBounds({
    x: currentBounds.x,
    y: currentBounds.y,
    width: 360,
    height: newHeight
  });
});

// Handle window close
ipcMain.on('close-window', () => {
  app.quit();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
