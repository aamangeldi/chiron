# Hopscotch Makefile
# Single entry point for all development tasks

.PHONY: help setup dev install clean test check-tools frontend backend worker beat

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Default target
help:
	@echo "$(BLUE)Hopscotch Development Commands:$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Development:$(NC)"
	@echo "  make setup     - Complete setup (install all dependencies)"
	@echo "  make dev       - Start both frontend and backend servers"
	@echo "  make install   - Install dependencies only"
	@echo ""
	@echo "$(GREEN)Individual Services:$(NC)"
	@echo "  make frontend  - Start only frontend (Next.js)"
	@echo "  make backend   - Start only backend (FastAPI)"
	@echo "  make worker    - Start Celery worker"
	@echo "  make beat      - Start Celery beat scheduler"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make clean     - Clean build artifacts and cache"
	@echo "  make test      - Run tests (when implemented)"
	@echo "  make check     - Check system requirements"
	@echo ""
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  make setup && make dev"
	@echo ""

# Check system requirements
check-tools:
	@echo "$(BLUE)[INFO]$(NC) Checking system requirements..."
	@command -v node >/dev/null 2>&1 || { echo "$(RED)[ERROR]$(NC) Node.js not found. Install from https://nodejs.org/"; exit 1; }
	@command -v python3 >/dev/null 2>&1 || { echo "$(RED)[ERROR]$(NC) Python 3 not found. Install from https://python.org/"; exit 1; }
	@if command -v uv >/dev/null 2>&1; then \
		echo "$(GREEN)[SUCCESS]$(NC) uv found (recommended)"; \
	else \
		echo "$(YELLOW)[WARNING]$(NC) uv not found. Consider installing: pip install uv"; \
		if ! command -v pip3 >/dev/null 2>&1; then \
			echo "$(RED)[ERROR]$(NC) Neither uv nor pip3 found. Install one of them."; \
			exit 1; \
		fi; \
	fi
	@echo "$(GREEN)[SUCCESS]$(NC) System requirements check passed"

# Complete setup - install everything
setup: check-tools
	@echo "$(BLUE)[INFO]$(NC) Setting up Hopscotch development environment..."
	@echo "$(BLUE)[INFO]$(NC) Installing root dependencies..."
	@npm install
	@echo "$(BLUE)[INFO]$(NC) Installing concurrently for parallel development..."
	@npm install concurrently --save-dev
	@echo "$(BLUE)[INFO]$(NC) Installing frontend dependencies..."
	@cd ui && npm install
	@echo "$(BLUE)[INFO]$(NC) Installing backend dependencies..."
	@cd backend && \
	if command -v uv >/dev/null 2>&1 && [ -f "pyproject.toml" ]; then \
		echo "$(BLUE)[INFO]$(NC) Using uv sync..."; \
		uv sync || (echo "$(YELLOW)[WARNING]$(NC) uv sync failed, trying uv pip install..." && uv pip install -r requirements.txt); \
	elif command -v uv >/dev/null 2>&1; then \
		echo "$(BLUE)[INFO]$(NC) Using uv pip install..."; \
		uv pip install -r requirements.txt; \
	else \
		echo "$(BLUE)[INFO]$(NC) Using pip install..."; \
		pip3 install -r requirements.txt || pip install -r requirements.txt; \
	fi
	@if [ ! -f "backend/.env" ]; then \
		echo "$(BLUE)[INFO]$(NC) Creating environment configuration..."; \
		cp backend/env.example backend/.env; \
		echo "$(YELLOW)[WARNING]$(NC) Please edit backend/.env and add your OpenAI API key"; \
	fi
	@if command -v redis-server >/dev/null 2>&1; then \
		echo "$(GREEN)[SUCCESS]$(NC) Redis found - background workers available"; \
	else \
		echo "$(YELLOW)[WARNING]$(NC) Redis not found - install with: brew install redis"; \
	fi
	@echo "$(GREEN)[SUCCESS]$(NC) Setup complete!"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Edit backend/.env and add your OpenAI API key (optional)"
	@echo "2. Run: make dev"
	@echo ""
	@echo "$(YELLOW)Access your app:$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

# Install dependencies only (no setup)
install: check-tools
	@echo "$(BLUE)[INFO]$(NC) Installing dependencies..."
	@npm install
	@cd ui && npm install
	@cd backend && \
	if command -v uv >/dev/null 2>&1; then \
		uv pip install -r requirements.txt; \
	else \
		pip3 install -r requirements.txt || pip install -r requirements.txt; \
	fi

# Start both frontend and backend
dev:
	@echo "$(BLUE)[INFO]$(NC) Starting development servers..."
	@npx concurrently "make backend" "make frontend"

# Start individual services
frontend:
	@echo "$(BLUE)[INFO]$(NC) Starting frontend (Next.js)..."
	@cd ui && npm run dev

backend:
	@echo "$(BLUE)[INFO]$(NC) Starting backend (FastAPI)..."
	@cd backend && \
	if command -v uv >/dev/null 2>&1 && [ -d ".venv" ]; then \
		uv run python run.py; \
	elif [ -f ".venv/bin/activate" ]; then \
		source .venv/bin/activate && python run.py; \
	else \
		python run.py; \
	fi

worker:
	@echo "$(BLUE)[INFO]$(NC) Starting Celery worker..."
	@cd backend && \
	if command -v uv >/dev/null 2>&1 && [ -d ".venv" ]; then \
		uv run celery -A workers.celery_app worker --loglevel=info; \
	elif [ -f ".venv/bin/activate" ]; then \
		source .venv/bin/activate && celery -A workers.celery_app worker --loglevel=info; \
	else \
		celery -A workers.celery_app worker --loglevel=info; \
	fi

beat:
	@echo "$(BLUE)[INFO]$(NC) Starting Celery beat scheduler..."
	@cd backend && \
	if command -v uv >/dev/null 2>&1 && [ -d ".venv" ]; then \
		uv run celery -A workers.celery_app beat --loglevel=info; \
	elif [ -f ".venv/bin/activate" ]; then \
		source .venv/bin/activate && celery -A workers.celery_app beat --loglevel=info; \
	else \
		celery -A workers.celery_app beat --loglevel=info; \
	fi

# Clean build artifacts
clean:
	@echo "$(BLUE)[INFO]$(NC) Cleaning build artifacts..."
	@rm -rf backend/__pycache__ backend/app/__pycache__ backend/workers/__pycache__
	@rm -rf ui/.next ui/out
	@rm -rf node_modules/.cache
	@echo "$(GREEN)[SUCCESS]$(NC) Cleanup complete"

# Run tests (placeholder)
test:
	@echo "$(BLUE)[INFO]$(NC) Running tests..."
	@echo "$(YELLOW)[WARNING]$(NC) Tests not implemented yet"

# Alias for check-tools
check: check-tools
