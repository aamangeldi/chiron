/**
 * Shared type definitions for the Hopscotch application
 */

/**
 * Represents a single browsing history entry
 */
export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitTime: Date;
  browser: BrowserType;
  visitCount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Supported browser types
 */
export enum BrowserType {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  SAFARI = 'safari',
  EDGE = 'edge',
  UNKNOWN = 'unknown',
}

/**
 * Query parameters for filtering history
 */
export interface HistoryQuery {
  startDate?: Date;
  endDate?: Date;
  browser?: BrowserType;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Result of a history query
 */
export interface HistoryQueryResult {
  entries: HistoryEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Message sent to the AI agent
 */
export interface AgentMessage {
  id: string;
  content: string;
  context?: HistoryEntry[];
  timestamp: Date;
}

/**
 * Response from the AI agent
 */
export interface AgentResponse {
  id: string;
  messageId: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for the application
 */
export interface AppConfig {
  enabledBrowsers: BrowserType[];
  syncInterval?: number; // in minutes
  storageLocation?: string;
  aiAgentEndpoint?: string;
}
