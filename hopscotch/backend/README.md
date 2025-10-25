# Hopscotch Backend

AI-powered browsing history assistant backend built with FastAPI and Python.

## Features

- **Browser History Collection**: Extract browsing history from Chrome (and other browsers)
- **AI-Powered Insights**: OpenAI integration for intelligent browsing analysis
- **Background Sync**: Celery-based periodic history synchronization
- **RESTful API**: FastAPI with automatic OpenAPI documentation
- **Data Analytics**: Pandas-powered browsing pattern analysis

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your settings
```

### 3. Start the Backend

```bash
# Development server
python run.py

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start Background Workers (Optional)

```bash
# Start Celery worker
celery -A workers.celery_app worker --loglevel=info

# Start Celery beat (for periodic tasks)
celery -A workers.celery_app beat --loglevel=info
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Configuration

Key environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key for AI features
- `DATABASE_URL`: Database connection string (default: SQLite)
- `REDIS_URL`: Redis connection for Celery (default: localhost:6379)
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
├── workers/           # Celery background tasks
└── requirements.txt   # Python dependencies
```

## Services

### History Collector
- Extracts browsing history from Chrome
- Platform-specific path detection
- Efficient data processing with pandas

### Storage Service
- SQLAlchemy-based database operations
- Bulk operations for performance
- Analytics and querying capabilities

### AI Agent
- OpenAI GPT-4 integration
- Browsing history context
- Intelligent insights and suggestions

### Background Sync
- Celery-based periodic synchronization
- Configurable sync intervals
- Error handling and retry logic

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
