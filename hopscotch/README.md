# Hopscotch

An AI-powered desktop application that collects your browsing history and enables intelligent interactions through a chat interface.

## Current Features

- **Arc Browser History Collection**: Automatic extraction of browsing history from Arc browser
- **AI Agent**: OpenAI GPT-5 mini integration with browsing history context
- **Chat Interface**: Minimal chat window to interact with the AI about your browsing activity
- **SQLite Storage**: Local persistence with full-text search and date filtering

## Getting Started

### Prerequisites

- Node.js 18+
- Arc browser (for history collection)
- OpenAI API key

### Installation

```bash
# Install dependencies
npm install

# Rebuild native modules for Electron
npx electron-rebuild

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your-key-here" > .env
```

### Running the App

```bash
# Build and start
npm start

# Or for development (auto-rebuild on changes)
npm run watch
# In another terminal:
npm run dev
```

## How It Works

1. **On Startup**: App collects last 7 days of browsing history from Arc
2. **Periodic Sync**: History is synced every 30 minutes
3. **Chat Interface**: Ask questions about your browsing activity
4. **AI Context**: Agent receives last 6 hours of history (max 200 entries) for context

## Architecture

```
src/
├── shared/              # Common types and interfaces
├── history-collector/   # Arc browser history extraction
├── storage/            # SQLite persistence layer
├── ai-agent/           # OpenAI GPT-5 mini integration
├── ui/                 # Electron chat window
└── main/               # Main process orchestration
```

## Configuration

Edit `src/main/index.ts` to customize:

- `syncInterval`: History sync frequency (default: 30 minutes)
- Context window: 6 hours, max 200 entries (in `setupIPCHandlers`)

Database location: `~/.hopscotch/history.db`

## License

MIT
