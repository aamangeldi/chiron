/**
 * Main Process Entry Point
 * Orchestrates all modules and manages the application lifecycle
 */

// Load environment variables from .env file
import 'dotenv/config';

import { app, ipcMain } from 'electron';
import { HistoryCollectorManager, ArcCollector } from '../history-collector';
import { SQLiteStorage } from '../storage';
import { OpenAIAgent } from '../ai-agent';
import { ChatController } from '../ui';
import { AppConfig, BrowserType, AgentMessage } from '../shared';
import { randomUUID } from 'crypto';

class HopscotchApp {
  private collectorManager: HistoryCollectorManager;
  private storage: SQLiteStorage;
  private aiAgent: OpenAIAgent;
  private uiController: ChatController;

  private config: AppConfig = {
    enabledBrowsers: [BrowserType.ARC],
    syncInterval: 30, // 30 minutes
  };

  constructor() {
    this.collectorManager = new HistoryCollectorManager();
    this.storage = new SQLiteStorage();
    this.aiAgent = new OpenAIAgent();
    this.uiController = new ChatController();
  }

  async initialize(): Promise<void> {
    console.log('[App] Initializing Hopscotch...');

    // Initialize storage
    await this.storage.initialize();

    // Register browser collectors
    const arcCollector = new ArcCollector();
    this.collectorManager.registerCollector(arcCollector);

    // Initialize AI agent
    try {
      await this.aiAgent.initialize();
    } catch (error) {
      console.error('[App] Failed to initialize AI agent:', error);
      throw error;
    }

    // Initialize UI
    await this.uiController.initialize();

    // Set up IPC handlers
    this.setupIPCHandlers();

    console.log('[App] Initialization complete');
  }

  private setupIPCHandlers(): void {
    // Handle chat messages
    ipcMain.on('chat-message', async (event, content: string) => {
      console.log('[App] Received chat message:', content);

      try {
        // Query recent browsing history for context (last 6 hours, max 200 entries)
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const historyResult = await this.storage.query({
          startDate: sixHoursAgo,
          limit: 200, // Reduced to fit in context window with reasoning model
        });

        // Create agent message with history context
        const message: AgentMessage = {
          id: randomUUID(),
          content: content,
          context: historyResult.entries,
          timestamp: new Date(),
        };

        // Get response from AI agent
        const response = await this.aiAgent.sendMessage(message);

        // Send response back to UI
        this.uiController.handleData('chat-response', response.content);
      } catch (error) {
        console.error('[App] Error processing chat message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.uiController.handleData('chat-error', errorMessage);
      }
    });
  }

  async collectHistory(): Promise<void> {
    console.log('[App] Starting history collection...');

    try {
      // Notify UI
      this.uiController.handleData('status-update', 'Collecting browsing history...');

      // Get last sync time from storage
      // For now, collect last 7 days
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Collect from enabled browsers
      const entries = await this.collectorManager.collectFrom(
        this.config.enabledBrowsers,
        since
      );

      // Save to storage
      await this.storage.saveEntries(entries);

      console.log(`[App] Collected ${entries.length} history entries`);

      // Notify UI
      this.uiController.handleData(
        'status-update',
        `✓ Loaded ${entries.length} browsing history entries. Ready to chat!`
      );
    } catch (error) {
      console.error('[App] Error collecting history:', error);
      this.uiController.handleData(
        'status-update',
        'Error loading browsing history. Please try restarting the app.'
      );
    }
  }

  async startPeriodicSync(): Promise<void> {
    // Initial collection
    await this.collectHistory();

    if (!this.config.syncInterval) {
      console.log('[App] Periodic sync disabled');
      return;
    }

    const intervalMs = this.config.syncInterval * 60 * 1000;
    console.log(`[App] Starting periodic sync every ${this.config.syncInterval} minutes`);

    // Set up interval
    setInterval(async () => {
      await this.collectHistory();
    }, intervalMs);
  }

  async shutdown(): Promise<void> {
    console.log('[App] Shutting down...');

    await this.aiAgent.shutdown();
    await this.storage.close();

    console.log('[App] Shutdown complete');
  }

  showUI(): void {
    this.uiController.show();
  }
}

// Electron app lifecycle
let hopscotch: HopscotchApp | null = null;

app.on('ready', async () => {
  console.log('[Electron] App ready');

  try {
    hopscotch = new HopscotchApp();
    await hopscotch.initialize();
    hopscotch.showUI();
    await hopscotch.startPeriodicSync();
  } catch (error) {
    console.error('[Electron] Failed to initialize app:', error);

    // Show error dialog if possible
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Initialization Error',
      `Failed to start Hopscotch:\n\n${error instanceof Error ? error.message : error}\n\n` +
      'Please make sure OPENAI_API_KEY is set in your environment variables.'
    );

    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (hopscotch) {
    await hopscotch.shutdown();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (hopscotch) {
    hopscotch.showUI();
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[App] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[App] Unhandled rejection:', reason);
});
