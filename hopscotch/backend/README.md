# Hopscotch Backend

AI-powered browsing history assistant backend built with FastAPI and Python.

## Features

- **Browser History Collection**: Extract browsing history from Arc and Chrome browsers
- **AI-Powered Insights**: OpenAI integration for intelligent browsing analysis
- **Auto-Sync on Startup**: Automatic history synchronization when backend starts
- **RESTful API**: FastAPI with automatic OpenAPI documentation
- **Data Analytics**: Pandas-powered browsing pattern analysis

## Quick Start

### 1. Install Dependencies

```bash
cd backend
uv sync
```

Note: This project uses [uv](https://github.com/astral-sh/uv) for dependency management. Install it with `pip install uv`.

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your settings
```

### 3. Start the Backend

```bash
# Development server (recommended)
uv run python run.py

# Or with uvicorn directly
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Browser history will be automatically synced on startup.

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Configuration

Key environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key for AI features
- `TAVILY_API_KEY`: Your Tavily API key for web search (optional)
- `DATABASE_URL`: Database connection string (default: SQLite)
- `ALLOWED_ORIGINS`: CORS origins (comma-separated)

## Architecture

```
backend/
├── app/
│   ├── api/           # FastAPI route handlers
│   ├── core/          # Configuration and core utilities
│   ├── models/        # Pydantic models
│   ├── services/      # Business logic services
│   └── main.py        # FastAPI application
├── pyproject.toml     # Python dependencies and project config
└── uv.lock            # Locked dependency versions
```

## Services

### History Collector
- Extracts browsing history from Arc and Chrome browsers
- Platform-specific path detection (macOS, Windows, Linux)
- Efficient data processing with pandas
- Auto-sync on backend startup

### Storage Service
- SQLAlchemy-based database operations
- Batch operations for performance (handles 10,000+ entries)
- Analytics and querying capabilities

### AI Agent
- OpenAI GPT-4 integration
- Synchronous client with async wrapper for FastAPI
- Browsing history context for intelligent insights
- Real-time AI-powered suggestions

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
isort .
```

### Type Checking
```bash
mypy .
```
