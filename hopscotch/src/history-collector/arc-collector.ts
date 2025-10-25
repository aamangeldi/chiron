/**
 * Arc Browser History Collector
 *
 * Arc is Chromium-based, so it uses a similar SQLite database structure
 */

import { IHistoryCollector } from '../shared/interfaces';
import { BrowserType, HistoryEntry } from '../shared/types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export class ArcCollector implements IHistoryCollector {
  private lastSyncTime: Date | null = null;

  getBrowserType(): BrowserType {
    return BrowserType.ARC;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const historyPath = this.getHistoryPath();
      return fs.existsSync(historyPath);
    } catch (error) {
      return false;
    }
  }

  async collectHistory(since?: Date): Promise<HistoryEntry[]> {
    console.log(`[ArcCollector] Collecting history since ${since || 'beginning'}`);

    const historyPath = this.getHistoryPath();
    if (!fs.existsSync(historyPath)) {
      throw new Error('Arc history file not found');
    }

    // Copy database to temp location (Arc locks the file when running)
    const tempDbPath = path.join(os.tmpdir(), `arc_history_${Date.now()}.db`);
    try {
      fs.copyFileSync(historyPath, tempDbPath);

      const entries = this.extractHistoryFromDb(tempDbPath, since);

      this.lastSyncTime = new Date();

      // Clean up temp file
      fs.unlinkSync(tempDbPath);

      console.log(`[ArcCollector] Collected ${entries.length} entries`);
      return entries;
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
      throw error;
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    return this.lastSyncTime;
  }

  /**
   * Get the path to Arc's history database
   * Currently supports macOS only (Arc is Mac-first)
   */
  private getHistoryPath(): string {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case 'darwin': // macOS
        // Arc stores data in Default profile by default
        return path.join(homeDir, 'Library/Application Support/Arc/User Data/Default/History');
      case 'win32': // Windows (when Arc supports it)
        return path.join(homeDir, 'AppData/Local/Arc/User Data/Default/History');
      case 'linux':
        return path.join(homeDir, '.config/Arc/Default/History');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Extract history entries from the SQLite database
   */
  private extractHistoryFromDb(dbPath: string, since?: Date): HistoryEntry[] {
    const db = new Database(dbPath, { readonly: true });
    const entries: HistoryEntry[] = [];

    try {
      // Chrome timestamp format: microseconds since 1601-01-01
      // We need to convert "since" date to this format
      let sinceTimestamp = 0;
      if (since) {
        // Chrome/Arc epoch is Jan 1, 1601
        // JavaScript epoch is Jan 1, 1970
        // Difference: 11644473600 seconds
        const chromeEpochStart = new Date('1601-01-01T00:00:00Z').getTime();
        const jsEpochStart = new Date('1970-01-01T00:00:00Z').getTime();
        const epochDiff = jsEpochStart - chromeEpochStart;
        sinceTimestamp = (since.getTime() + epochDiff) * 1000; // Convert to microseconds
      }

      // Query to join urls and visits tables
      const query = `
        SELECT
          urls.id as url_id,
          urls.url,
          urls.title,
          visits.visit_time,
          urls.visit_count
        FROM urls
        JOIN visits ON urls.id = visits.url
        WHERE visits.visit_time > ?
        ORDER BY visits.visit_time DESC
      `;

      const stmt = db.prepare(query);
      const rows = stmt.all(sinceTimestamp) as Array<{
        url_id: number;
        url: string;
        title: string;
        visit_time: number;
        visit_count: number;
      }>;

      for (const row of rows) {
        // Convert Chrome timestamp to JavaScript Date
        const visitTime = this.chromeTimestampToDate(row.visit_time);

        entries.push({
          id: `arc-${row.url_id}-${row.visit_time}`,
          url: row.url,
          title: row.title || '',
          visitTime: visitTime,
          browser: BrowserType.ARC,
          visitCount: row.visit_count,
        });
      }
    } finally {
      db.close();
    }

    return entries;
  }

  /**
   * Convert Chrome timestamp (microseconds since 1601-01-01) to JavaScript Date
   */
  private chromeTimestampToDate(chromeTimestamp: number): Date {
    // Chrome epoch: January 1, 1601
    // JavaScript epoch: January 1, 1970
    // Difference: 11644473600 seconds = 11644473600000 milliseconds

    const microseconds = chromeTimestamp;
    const milliseconds = microseconds / 1000;

    // Chrome epoch is 11644473600000 milliseconds before Unix epoch
    const unixMilliseconds = milliseconds - 11644473600000;

    return new Date(unixMilliseconds);
  }
}
