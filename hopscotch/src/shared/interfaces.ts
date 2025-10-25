/**
 * Core interfaces for module contracts
 */

import {
  HistoryEntry,
  HistoryQuery,
  HistoryQueryResult,
  BrowserType,
  AgentMessage,
  AgentResponse,
} from './types';

/**
 * Interface for browser history collectors
 * Implement this for each browser type
 */
export interface IHistoryCollector {
  /**
   * Get the browser type this collector handles
   */
  getBrowserType(): BrowserType;

  /**
   * Check if the browser is installed and accessible
   */
  isAvailable(): Promise<boolean>;

  /**
   * Collect history entries from the browser
   * @param since - Only collect entries after this date
   */
  collectHistory(since?: Date): Promise<HistoryEntry[]>;

  /**
   * Get the last sync timestamp
   */
  getLastSyncTime(): Promise<Date | null>;
}

/**
 * Interface for the storage layer
 * Handles persistence and querying of history data
 */
export interface IStorage {
  /**
   * Initialize the storage (create tables, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Store history entries
   * @param entries - Entries to store (duplicates should be handled)
   */
  saveEntries(entries: HistoryEntry[]): Promise<void>;

  /**
   * Query history entries
   */
  query(params: HistoryQuery): Promise<HistoryQueryResult>;

  /**
   * Get a single entry by ID
   */
  getEntry(id: string): Promise<HistoryEntry | null>;

  /**
   * Delete entries older than a specified date
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Close the storage connection
   */
  close(): Promise<void>;
}

/**
 * Interface for the AI agent
 * Implement this to integrate your AI model
 */
export interface IAIAgent {
  /**
   * Initialize the AI agent (load model, connect to API, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Send a message to the agent
   */
  sendMessage(message: AgentMessage): Promise<AgentResponse>;

  /**
   * Check if the agent is ready to receive messages
   */
  isReady(): boolean;

  /**
   * Shutdown the agent gracefully
   */
  shutdown(): Promise<void>;
}

/**
 * Interface for the UI layer
 * Implement this to create custom interfaces
 */
export interface IUIController {
  /**
   * Initialize the UI
   */
  initialize(): Promise<void>;

  /**
   * Show the main window
   */
  show(): void;

  /**
   * Hide the main window
   */
  hide(): void;

  /**
   * Handle incoming data from the main process
   */
  handleData(channel: string, data: unknown): void;
}
