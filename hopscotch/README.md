# Hopscotch

An AI-powered desktop application that collects your browsing history and enables novel interactions through an intelligent agent.

## Project Status

**Current Phase:** Scaffolding / Early Development

This is the initial scaffolding with modular architecture designed for parallel development. See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed development roadmap.

## Architecture

The project is organized into independent modules:

```
src/
├── shared/           # Common types and interfaces
│   ├── types.ts      # Data models (HistoryEntry, etc.)
│   └── interfaces.ts # Module contracts (IHistoryCollector, IAIAgent, etc.)
├── history-collector/  # Browser history extraction
│   ├── chrome-collector.ts
│   ├── firefox-collector.ts (TODO)
│   ├── safari-collector.ts (TODO)
│   ├── edge-collector.ts (TODO)
│   └── manager.ts
├── storage/          # Data persistence layer
│   └── sqlite-storage.ts
├── ai-agent/         # AI interaction (STUB - needs implementation)
│   └── stub-agent.ts
├── ui/               # User interface (STUB - needs implementation)
│   └── stub-controller.ts
└── main/             # Main process orchestration
    └── index.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge
- Electron familiarity (helpful)

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the application
npm start
```

### Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# In another terminal
npm run dev
```

## Module Overview

### 1. Shared (`src/shared/`)

Defines all common types and interfaces. **Start here** to understand the data models and contracts.

Key files:
- `types.ts` - Data models (HistoryEntry, BrowserType, etc.)
- `interfaces.ts` - Module contracts (IHistoryCollector, IStorage, IAIAgent, IUIController)

### 2. History Collector (`src/history-collector/`)

Extracts browsing history from various browsers.

**Status:** Partially implemented (Chrome stub only)

**TODO:**
- Implement Chrome history extraction (see `chrome-collector.ts:23`)
- Add Firefox collector
- Add Safari collector (macOS)
- Add Edge collector

**Interface:** `IHistoryCollector`

Each collector must implement:
- `getBrowserType()` - Return the browser type
- `isAvailable()` - Check if browser is installed
- `collectHistory(since?)` - Extract history entries
- `getLastSyncTime()` - Get last sync timestamp

### 3. Storage (`src/storage/`)

Handles persistence and querying of browsing history.

**Status:** Fully implemented (SQLite)

**Features:**
- SQLite database (~/.hopscotch/history.db by default)
- Full-text search on URLs and titles
- Date range filtering
- Browser type filtering
- Pagination support

**Interface:** `IStorage`

### 4. AI Agent (`src/ai-agent/`)

AI-powered interaction with browsing history.

**Status:** STUB - Needs implementation

**TODO FOR TEAMMATE:**
This is where your AI agent lives. Implement the `IAIAgent` interface with your chosen AI backend:

Options:
- OpenAI API (GPT-4, GPT-3.5)
- Anthropic Claude API
- Local LLM (Ollama, llama.cpp, etc.)
- Custom model

**Interface:** `IAIAgent`

Must implement:
- `initialize()` - Set up AI backend
- `sendMessage(message)` - Process user messages with history context
- `isReady()` - Check if agent is ready
- `shutdown()` - Clean up resources

See `src/ai-agent/stub-agent.ts` for detailed TODOs.

### 5. UI (`src/ui/`)

User interface layer.

**Status:** STUB - Needs implementation

**TODO FOR TEAMMATE:**
Build the user interface. Choose your framework:

Options:
- React + TypeScript
- Vue + TypeScript
- Svelte
- Vanilla HTML/CSS/JS

**Interface:** `IUIController`

Must implement:
- `initialize()` - Set up UI windows/views
- `show()` - Display main window
- `hide()` - Hide main window
- `handleData(channel, data)` - Receive updates from main process

See `src/ui/stub-controller.ts` for detailed TODOs.

### 6. Main (`src/main/`)

Electron main process that orchestrates all modules.

**Status:** Basic implementation complete

**Features:**
- Initializes all modules
- Coordinates periodic history sync
- Manages app lifecycle
- Handles IPC between modules

## Parallel Development Guide

### For History Collection Work

1. Focus on `src/history-collector/`
2. Implement collectors for each browser
3. Test with `src/storage/` (already working)
4. No dependencies on AI or UI modules

### For AI Agent Work

1. Focus on `src/ai-agent/`
2. Replace `StubAIAgent` with your implementation
3. Use `src/shared/types.ts` for data models
4. Test independently - the interface is well-defined
5. Can develop completely in parallel

### For UI Work

1. Focus on `src/ui/`
2. Replace `StubUIController` with your implementation
3. Use `src/shared/types.ts` for data models
4. Can mock data initially for UI development
5. Integrate with real storage later

## Data Flow

```
Browser DBs → History Collectors → Storage (SQLite) → UI Display
                                      ↓           ↑
                                  AI Agent ← → User Chat
```

1. **Collection**: History collectors extract data from browser databases
2. **Storage**: Entries are stored in SQLite with full-text search
3. **Query**: UI queries storage for display/search
4. **AI Context**: When user chats, relevant history is sent to AI agent
5. **Response**: AI agent responds with insights/suggestions

## Testing

```bash
# Run tests (once implemented)
npm test
```

Currently no tests - add them as you implement features!

## Configuration

Default configuration in `src/main/index.ts:18`:

```typescript
{
  enabledBrowsers: [BrowserType.CHROME],
  syncInterval: 30, // minutes
}
```

TODO: Make this user-configurable through settings UI.

## Database Schema

SQLite tables (in `~/.hopscotch/history.db`):

```sql
CREATE TABLE history (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  visit_time INTEGER NOT NULL,
  browser TEXT NOT NULL,
  visit_count INTEGER DEFAULT 1,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

## Roadmap

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the full staged development plan.

**Next Steps:**
1. Decide on AI backend (OpenAI, Claude, local, etc.)
2. Decide on UI framework (React, Vue, Svelte, etc.)
3. Implement browser history collectors
4. Implement AI agent in parallel
5. Implement UI in parallel
6. Integration and testing

## Contributing

This is an internal project for now. Coordinate with your teammate on:
- AI agent implementation approach
- UI framework choice
- Feature priorities

## License

MIT

## Questions?

Check the implementation plan or ask your teammate!
