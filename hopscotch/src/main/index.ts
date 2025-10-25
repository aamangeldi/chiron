/**
 * Main Process Entry Point
 * Orchestrates all modules and manages the application lifecycle
 */

import { app } from 'electron';
import { HistoryCollectorManager, ChromeCollector } from '../history-collector';
import { SQLiteStorage } from '../storage';
import { StubAIAgent } from '../ai-agent';
import { StubUIController } from '../ui';
import { AppConfig, BrowserType } from '../shared';

class HopscotchApp {
  private collectorManager: HistoryCollectorManager;
  private storage: SQLiteStorage;
  private aiAgent: StubAIAgent;
  private uiController: StubUIController;

  private config: AppConfig = {
    enabledBrowsers: [BrowserType.CHROME],
    syncInterval: 30, // 30 minutes
  };

  constructor() {
    this.collectorManager = new HistoryCollectorManager();
    this.storage = new SQLiteStorage();
    this.aiAgent = new StubAIAgent();
    this.uiController = new StubUIController();
  }

  async initialize(): Promise<void> {
    console.log('[App] Initializing Hopscotch...');

    // Initialize storage
    await this.storage.initialize();

    // Register browser collectors
    // TODO: Add more collectors (Firefox, Safari, Edge)
    const chromeCollector = new ChromeCollector();
    this.collectorManager.registerCollector(chromeCollector);

    // Initialize AI agent
    await this.aiAgent.initialize();

    // Initialize UI
    await this.uiController.initialize();

    console.log('[App] Initialization complete');
  }

  async collectHistory(): Promise<void> {
    console.log('[App] Starting history collection...');

    try {
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

      // Notify UI
      this.uiController.handleData('history-updated', {
        count: entries.length,
        timestamp: new Date(),
      });

      console.log(`[App] Collected ${entries.length} history entries`);
    } catch (error) {
      console.error('[App] Error collecting history:', error);
    }
  }

  async startPeriodicSync(): Promise<void> {
    if (!this.config.syncInterval) {
      console.log('[App] Periodic sync disabled');
      return;
    }

    const intervalMs = this.config.syncInterval * 60 * 1000;
    console.log(`[App] Starting periodic sync every ${this.config.syncInterval} minutes`);

    // Initial collection
    await this.collectHistory();

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

  hopscotch = new HopscotchApp();
  await hopscotch.initialize();
  await hopscotch.startPeriodicSync();
  hopscotch.showUI();
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
