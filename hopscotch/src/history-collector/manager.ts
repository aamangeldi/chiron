/**
 * History Collector Manager
 * Coordinates multiple browser collectors
 */

import { IHistoryCollector } from '../shared/interfaces';
import { HistoryEntry, BrowserType } from '../shared/types';

export class HistoryCollectorManager {
  private collectors: Map<BrowserType, IHistoryCollector> = new Map();

  /**
   * Register a browser collector
   */
  registerCollector(collector: IHistoryCollector): void {
    this.collectors.set(collector.getBrowserType(), collector);
  }

  /**
   * Get all registered collectors
   */
  getCollectors(): IHistoryCollector[] {
    return Array.from(this.collectors.values());
  }

  /**
   * Get a specific collector by browser type
   */
  getCollector(browserType: BrowserType): IHistoryCollector | undefined {
    return this.collectors.get(browserType);
  }

  /**
   * Collect history from all available browsers
   */
  async collectFromAll(since?: Date): Promise<HistoryEntry[]> {
    const allEntries: HistoryEntry[] = [];

    for (const collector of this.collectors.values()) {
      const isAvailable = await collector.isAvailable();
      if (!isAvailable) {
        console.log(`[Manager] Skipping ${collector.getBrowserType()}: not available`);
        continue;
      }

      try {
        const entries = await collector.collectHistory(since);
        allEntries.push(...entries);
        console.log(`[Manager] Collected ${entries.length} entries from ${collector.getBrowserType()}`);
      } catch (error) {
        console.error(`[Manager] Error collecting from ${collector.getBrowserType()}:`, error);
      }
    }

    return allEntries;
  }

  /**
   * Collect history from specific browsers
   */
  async collectFrom(browserTypes: BrowserType[], since?: Date): Promise<HistoryEntry[]> {
    const allEntries: HistoryEntry[] = [];

    for (const browserType of browserTypes) {
      const collector = this.collectors.get(browserType);
      if (!collector) {
        console.warn(`[Manager] No collector registered for ${browserType}`);
        continue;
      }

      const isAvailable = await collector.isAvailable();
      if (!isAvailable) {
        console.log(`[Manager] Skipping ${browserType}: not available`);
        continue;
      }

      try {
        const entries = await collector.collectHistory(since);
        allEntries.push(...entries);
        console.log(`[Manager] Collected ${entries.length} entries from ${browserType}`);
      } catch (error) {
        console.error(`[Manager] Error collecting from ${browserType}:`, error);
      }
    }

    return allEntries;
  }
}
