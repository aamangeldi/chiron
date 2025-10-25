# Hopscotch

AI-powered browsing history assistant that helps you understand and interact with your web browsing patterns.

## Architecture

Hopscotch is now a modern web application with:

- **Frontend**: Next.js 13+ with React and Tailwind CSS
- **Backend**: Python FastAPI with SQLAlchemy
- **AI Integration**: OpenAI GPT-4 for intelligent insights
- **Background Processing**: Celery with Redis for periodic sync
- **Database**: SQLite (easily upgradeable to PostgreSQL)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- uv (recommended) or pip for Python dependency management
  - Install uv: `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Redis (optional, for background tasks)

### Single Command Setup & Start

```bash
# Complete setup and start development servers
make setup && make dev
```

### Individual Commands

```bash
# Setup everything (install dependencies, create config)
make setup

# Start both frontend and backend
make dev

# Start individual services
make frontend   # Next.js on http://localhost:3000
make backend    # FastAPI on http://localhost:8000
make worker     # Celery worker
make beat       # Celery beat scheduler

# Utilities
make clean      # Clean build artifacts
make help       # Show all available commands
```

### Alternative: Using npm scripts

```bash
# All npm scripts delegate to make commands
npm run setup   # Same as: make setup
npm run dev     # Same as: make dev
npm run help    # Same as: make help
```

## Project Structure

```
hopscotch/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration
│   │   ├── models/         # Pydantic models
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI app
│   ├── workers/            # Celery background tasks
│   └── requirements.txt    # Python dependencies
├── ui/                     # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/               # Utilities
└── package.json           # Root package.json
```

## Features

### 🔍 Browser History Collection
- Automatic Chrome history extraction
- Platform-specific path detection
- Efficient data processing with pandas

### 🤖 AI-Powered Insights
- OpenAI GPT-4 integration
- Browsing pattern analysis
- Intelligent suggestions and recommendations

### 📊 Analytics Dashboard
- Browsing statistics and trends
- Domain analysis and categorization
- Time-based pattern recognition

### 🔄 Background Sync
- Periodic history synchronization
- Celery-based task queue
- Error handling and retry logic

### 🌐 Modern Web Interface
- Next.js 13+ with App Router
- Responsive design with Tailwind CSS
- Real-time updates and interactions

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Backend Development
```bash
cd backend
python run.py                    # Start FastAPI server
celery -A workers.celery_app worker --loglevel=info  # Start worker
```

### Frontend Development
```bash
cd ui
npm run dev                     # Start Next.js dev server
npm run build                   # Build for production
```

### Database Management
```bash
# The SQLite database is automatically created
# For PostgreSQL, update DATABASE_URL in backend/.env
```

## Migration from Electron

This project has been migrated from an Electron desktop app to a modern web application:

- ✅ Removed Electron dependencies
- ✅ Migrated TypeScript services to Python
- ✅ Enhanced with FastAPI and modern Python libraries
- ✅ Added Celery for background processing
- ✅ Improved AI integration with OpenAI
- ✅ Better data processing with pandas

## Deployment

### Backend (FastAPI)
- Deploy to any Python hosting (Railway, Render, Heroku)
- Set environment variables
- Run Celery workers separately

### Frontend (Next.js)
- Deploy to Vercel, Netlify, or any static hosting
- Update API endpoints in production

### Database
- SQLite for development
- PostgreSQL for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.