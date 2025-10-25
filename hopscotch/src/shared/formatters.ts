/**
 * Formatting utilities for converting history data to text formats
 * suitable for AI agent consumption
 */

import { HistoryEntry } from './types';

/**
 * Format history entries as readable text for AI prompts
 * No RAG, just organized text that can be inserted into prompts
 */
export function formatHistoryForPrompt(entries: HistoryEntry[]): string {
  if (entries.length === 0) {
    return 'No browsing history available.';
  }

  const lines: string[] = [];
  lines.push('=== BROWSING HISTORY ===');
  lines.push(`Total entries: ${entries.length}`);
  lines.push('');

  // Group by date for better organization
  const groupedByDate = groupEntriesByDate(entries);

  for (const [date, dateEntries] of groupedByDate) {
    lines.push(`## ${date}`);
    lines.push('');

    for (const entry of dateEntries) {
      const time = entry.visitTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      lines.push(`[${time}] ${entry.title || 'Untitled'}`);
      lines.push(`  URL: ${entry.url}`);

      if (entry.visitCount && entry.visitCount > 1) {
        lines.push(`  Visits: ${entry.visitCount}`);
      }

      lines.push('');
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format history entries as a compact summary
 * Useful for shorter context windows
 */
export function formatHistorySummary(entries: HistoryEntry[]): string {
  if (entries.length === 0) {
    return 'No browsing history available.';
  }

  const lines: string[] = [];
  lines.push(`Recently visited ${entries.length} pages:`);
  lines.push('');

  for (const entry of entries.slice(0, 50)) {
    // Limit to 50 most recent
    const time = entry.visitTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const date = entry.visitTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    lines.push(`- [${date} ${time}] ${entry.title || 'Untitled'} - ${entry.url}`);
  }

  if (entries.length > 50) {
    lines.push('');
    lines.push(`... and ${entries.length - 50} more entries`);
  }

  return lines.join('\n');
}

/**
 * Format history as a timeline (chronological order)
 */
export function formatHistoryTimeline(entries: HistoryEntry[]): string {
  if (entries.length === 0) {
    return 'No browsing history available.';
  }

  // Sort by visit time (most recent first)
  const sorted = [...entries].sort(
    (a, b) => b.visitTime.getTime() - a.visitTime.getTime()
  );

  const lines: string[] = [];
  lines.push('=== BROWSING TIMELINE ===');
  lines.push('');

  for (const entry of sorted) {
    const datetime = entry.visitTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    lines.push(`${datetime} → ${entry.title || 'Untitled'}`);
    lines.push(`  ${entry.url}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format history grouped by domain
 * Useful for understanding which sites the user visits most
 */
export function formatHistoryByDomain(entries: HistoryEntry[]): string {
  if (entries.length === 0) {
    return 'No browsing history available.';
  }

  // Group by domain
  const domainMap = new Map<string, HistoryEntry[]>();

  for (const entry of entries) {
    try {
      const url = new URL(entry.url);
      const domain = url.hostname;

      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }
      domainMap.get(domain)!.push(entry);
    } catch (error) {
      // Invalid URL, skip
      continue;
    }
  }

  // Sort domains by number of visits
  const sortedDomains = Array.from(domainMap.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  const lines: string[] = [];
  lines.push('=== BROWSING HISTORY BY DOMAIN ===');
  lines.push('');

  for (const [domain, domainEntries] of sortedDomains) {
    lines.push(`## ${domain} (${domainEntries.length} visits)`);
    lines.push('');

    // Show most recent 5 from this domain
    const recent = domainEntries.slice(0, 5);
    for (const entry of recent) {
      const time = entry.visitTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      lines.push(`  [${time}] ${entry.title || 'Untitled'}`);
    }

    if (domainEntries.length > 5) {
      lines.push(`  ... and ${domainEntries.length - 5} more`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Helper to group entries by date
 */
function groupEntriesByDate(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const grouped = new Map<string, HistoryEntry[]>();

  for (const entry of entries) {
    const date = entry.visitTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(entry);
  }

  return grouped;
}

/**
 * Format for JSON export (if needed for debugging or other tools)
 */
export function formatHistoryAsJSON(entries: HistoryEntry[]): string {
  return JSON.stringify(
    entries.map((entry) => ({
      url: entry.url,
      title: entry.title,
      visitTime: entry.visitTime.toISOString(),
      browser: entry.browser,
      visitCount: entry.visitCount,
    })),
    null,
    2
  );
}
