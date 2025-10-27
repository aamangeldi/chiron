/**
 * Chat UI Controller
 * Manages the minimal chat window for the AI agent
 */

import { IUIController } from '../shared/interfaces';
import { BrowserWindow } from 'electron';
import * as path from 'path';

export class ChatController implements IUIController {
  private window: BrowserWindow | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    console.log('[ChatController] Initializing...');

    // Create the browser window
    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      title: 'Hopscotch',
      backgroundColor: '#f5f5f5',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false, // For simplicity in MVP
      },
    });

    // Load the HTML file
    const htmlPath = path.join(__dirname, '../ui/chat-window.html');
    await this.window.loadFile(htmlPath);

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.window.webContents.openDevTools();
    }

    this.window.on('closed', () => {
      this.window = null;
    });

    this.initialized = true;
    console.log('[ChatController] Initialized');
  }

  show(): void {
    if (!this.initialized || !this.window) {
      console.warn('[ChatController] Cannot show: not initialized');
      return;
    }

    this.window.show();
    this.window.focus();
  }

  hide(): void {
    if (!this.initialized || !this.window) {
      console.warn('[ChatController] Cannot hide: not initialized');
      return;
    }

    this.window.hide();
  }

  handleData(channel: string, data: unknown): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    console.log(`[ChatController] Sending data on channel "${channel}"`);
    this.window.webContents.send(channel, data);
  }

  getWindow(): BrowserWindow | null {
    return this.window;
  }
}
