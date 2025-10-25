/**
 * Quick test script for Arc collector
 * Run with: node test-arc-collector.js
 */

const { ArcCollector } = require('./dist/history-collector/arc-collector');
const { formatHistorySummary, formatHistoryByDomain } = require('./dist/shared/formatters');

async function test() {
  console.log('Testing Arc Collector...\n');

  const collector = new ArcCollector();

  // Check if Arc is available
  const isAvailable = await collector.isAvailable();
  console.log(`Arc browser available: ${isAvailable}`);

  if (!isAvailable) {
    console.log('Arc browser not found or not accessible');
    return;
  }

  // Collect history from last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  console.log(`\nCollecting history since: ${since.toLocaleString()}\n`);

  try {
    const entries = await collector.collectHistory(since);
    console.log(`\nCollected ${entries.length} entries\n`);

    if (entries.length > 0) {
      // Show first 5 entries
      console.log('=== First 5 entries ===\n');
      for (let i = 0; i < Math.min(5, entries.length); i++) {
        const entry = entries[i];
        console.log(`${i + 1}. ${entry.title}`);
        console.log(`   URL: ${entry.url}`);
        console.log(`   Time: ${entry.visitTime.toLocaleString()}`);
        console.log(`   Visits: ${entry.visitCount}`);
        console.log('');
      }

      // Test formatters
      console.log('\n=== Testing Summary Formatter ===\n');
      const summary = formatHistorySummary(entries.slice(0, 10));
      console.log(summary);

      console.log('\n\n=== Testing Domain Formatter ===\n');
      const byDomain = formatHistoryByDomain(entries.slice(0, 20));
      console.log(byDomain);
    }
  } catch (error) {
    console.error('Error collecting history:', error);
  }
}

test().catch(console.error);
