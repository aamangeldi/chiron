const { ipcRenderer } = require('electron');

// Click on pill to return to normal mode
document.querySelector('.pill-content').addEventListener('click', () => {
  ipcRenderer.send('switch-to-normal-mode');
});
