/**
 * SQLite Storage Implementation
 *
 * Stores browsing history in a local SQLite database
 */

import { IStorage } from '../shared/interfaces';
import { HistoryEntry, HistoryQuery, HistoryQueryResult } from '../shared/types';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export class SQLiteStorage implements IStorage {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Default to user's home directory
    this.dbPath = dbPath || path.join(os.homedir(), '.hopscotch', 'history.db');
  }

  async initialize(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open database
    this.db = new Database(this.dbPath);

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT,
        visit_time INTEGER NOT NULL,
        browser TEXT NOT NULL,
        visit_count INTEGER DEFAULT 1,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_visit_time ON history(visit_time);
      CREATE INDEX IF NOT EXISTS idx_browser ON history(browser);
      CREATE INDEX IF NOT EXISTS idx_url ON history(url);
    `);

    console.log(`[Storage] Initialized at ${this.dbPath}`);
  }

  async saveEntries(entries: HistoryEntry[]): Promise<void> {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }

    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO history (id, url, title, visit_time, browser, visit_count, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((entries: HistoryEntry[]) => {
      for (const entry of entries) {
        insert.run(
          entry.id,
          entry.url,
          entry.title,
          entry.visitTime.getTime(),
          entry.browser,
          entry.visitCount || 1,
          entry.metadata ? JSON.stringify(entry.metadata) : null
        );
      }
    });

    insertMany(entries);
    console.log(`[Storage] Saved ${entries.length} entries`);
  }

  async query(params: HistoryQuery): Promise<HistoryQueryResult> {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.startDate) {
      conditions.push('visit_time >= ?');
      values.push(params.startDate.getTime());
    }

    if (params.endDate) {
      conditions.push('visit_time <= ?');
      values.push(params.endDate.getTime());
    }

    if (params.browser) {
      conditions.push('browser = ?');
      values.push(params.browser);
    }

    if (params.searchTerm) {
      conditions.push('(url LIKE ? OR title LIKE ?)');
      const searchPattern = `%${params.searchTerm}%`;
      values.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM history ${whereClause}`);
    const { total } = countStmt.get(...values) as { total: number };

    // Get entries with pagination
    const limit = params.limit || 100;
    const offset = params.offset || 0;

    const queryStmt = this.db.prepare(`
      SELECT * FROM history ${whereClause}
      ORDER BY visit_time DESC
      LIMIT ? OFFSET ?
    `);

    const rows = queryStmt.all(...values, limit, offset) as Array<{
      id: string;
      url: string;
      title: string;
      visit_time: number;
      browser: string;
      visit_count: number;
      metadata: string | null;
    }>;

    const entries: HistoryEntry[] = rows.map(row => ({
      id: row.id,
      url: row.url,
      title: row.title,
      visitTime: new Date(row.visit_time),
      browser: row.browser as any,
      visitCount: row.visit_count,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));

    return {
      entries,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getEntry(id: string): Promise<HistoryEntry | null> {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }

    const stmt = this.db.prepare('SELECT * FROM history WHERE id = ?');
    const row = stmt.get(id) as {
      id: string;
      url: string;
      title: string;
      visit_time: number;
      browser: string;
      visit_count: number;
      metadata: string | null;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      url: row.url,
      title: row.title,
      visitTime: new Date(row.visit_time),
      browser: row.browser as any,
      visitCount: row.visit_count,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    if (!this.db) {
      throw new Error('Storage not initialized');
    }

    const stmt = this.db.prepare('DELETE FROM history WHERE visit_time < ?');
    const result = stmt.run(date.getTime());
    return result.changes;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[Storage] Closed');
    }
  }
}
