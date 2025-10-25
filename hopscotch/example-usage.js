/**
 * Complete example showing how browsing history flows to the AI agent
 * Run with: node example-usage.js
 */

const { ArcCollector } = require('./dist/history-collector/arc-collector');
const { SQLiteStorage } = require('./dist/storage/sqlite-storage');
const { StubAIAgent } = require('./dist/ai-agent/stub-agent');
const { randomUUID } = require('crypto');

async function example() {
  console.log('=== Hopscotch Example Usage ===\n');

  // Step 1: Collect browsing history from Arc
  console.log('Step 1: Collecting browsing history from Arc...\n');
  const collector = new ArcCollector();

  const isAvailable = await collector.isAvailable();
  if (!isAvailable) {
    console.log('Arc browser not found. Exiting.');
    return;
  }

  // Collect last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const entries = await collector.collectHistory(since);
  console.log(`✓ Collected ${entries.length} history entries\n`);

  // Step 2: Store in database
  console.log('Step 2: Storing history in database...\n');
  const storage = new SQLiteStorage('/tmp/hopscotch-example.db');
  await storage.initialize();
  await storage.saveEntries(entries);
  console.log(`✓ Saved ${entries.length} entries to database\n`);

  // Step 3: Query recent history for AI context
  console.log('Step 3: Querying recent history for AI context...\n');
  const queryResult = await storage.query({
    limit: 20, // Last 20 entries
  });
  console.log(`✓ Retrieved ${queryResult.entries.length} entries for AI context\n`);

  // Step 4: Send to AI agent with history context
  console.log('Step 4: Sending message to AI agent with history context...\n');
  const aiAgent = new StubAIAgent();
  await aiAgent.initialize();

  const message = {
    id: randomUUID(),
    content: 'What have I been researching lately?',
    context: queryResult.entries, // Include browsing history as context
    timestamp: new Date(),
  };

  const response = await aiAgent.sendMessage(message);

  console.log('=== AI Agent Response ===\n');
  console.log(response.content);
  console.log('\n======================\n');

  // Cleanup
  await aiAgent.shutdown();
  await storage.close();

  console.log('\n✓ Example complete!');
  console.log('\nNext steps:');
  console.log('1. Implement your AI agent in src/ai-agent/');
  console.log('2. Build your UI in src/ui/');
  console.log('3. Run the full app with: npm start');
}

example().catch(console.error);
