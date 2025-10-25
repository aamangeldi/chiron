# Hopscotch

An AI-powered desktop application that collects your browsing history and enables intelligent interactions through a chat interface.

## Current Features

- **Arc Browser History Collection**: Automatic extraction of browsing history from Arc browser
- **AI Agent**: OpenAI GPT-5 mini integration with browsing history context and web search capabilities
- **Web Search**: Real-time web search using Tavily API for current information
- **Chat Interface**: Minimal chat window to interact with the AI about your browsing activity and current events
- **SQLite Storage**: Local persistence with full-text search and date filtering

## Getting Started

### Prerequisites

- Node.js 18+
- Arc browser (for history collection)
- OpenAI API key
- Tavily API key (for web search)

### Installation

```bash
# Install dependencies
npm install

# Rebuild native modules for Electron
npx electron-rebuild

# Create .env file with your API keys following .env.example
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
3. **Chat Interface**: Ask questions about your browsing activity or current events
4. **AI Context**: Agent receives last 6 hours of history (max 200 entries) for context
5. **Web Search**: For current information, the AI automatically searches the web using Tavily

## Architecture

```
src/
├── shared/              # Common types and interfaces
├── history-collector/   # Arc browser history extraction
├── storage/            # SQLite persistence layer
├── ai-agent/           # OpenAI GPT-5 mini integration with web search
├── ui/                 # Electron chat window
└── main/               # Main process orchestration
```

## Configuration

Edit `src/main/index.ts` to customize:

- `syncInterval`: History sync frequency (default: 30 minutes)
- Context window: 6 hours, max 200 entries (in `setupIPCHandlers`)

Database location: `~/.hopscotch/history.db`

## Web Search Features

The AI agent can automatically search the web for current information using Tavily:

- **Weather queries**: "What's the weather in Cambridge, MA?"
- **News and current events**: "Latest news about AI"
- **Stock prices**: "What's the current price of AAPL?"
- **General knowledge**: Any question requiring up-to-date information

The agent will automatically use the `web_search` tool when it detects queries that need current information, providing both direct answers and detailed search results.

## API Keys Setup

1. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com)
2. **Tavily API Key**: Get from [tavily.com](https://tavily.com) (free tier available)

## License

MIT
