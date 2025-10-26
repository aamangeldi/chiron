# Hopscotch Makefile
# Single entry point for all development tasks

.PHONY: help setup dev install clean test check-tools frontend backend

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
	@command -v uv >/dev/null 2>&1 || { echo "$(RED)[ERROR]$(NC) uv not found. Install with: pip install uv"; exit 1; }
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
	@cd backend && uv sync
	@if [ ! -f "backend/.env" ]; then \
		echo "$(BLUE)[INFO]$(NC) Creating environment configuration..."; \
		cp backend/env.example backend/.env; \
		echo "$(YELLOW)[WARNING]$(NC) Please edit backend/.env and add your OpenAI API key"; \
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
	@cd backend && uv sync

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
	@cd backend && uv run python run.py

# Clean build artifacts
clean:
	@echo "$(BLUE)[INFO]$(NC) Cleaning build artifacts..."
	@rm -rf backend/__pycache__ backend/app/__pycache__
	@rm -rf ui/.next ui/out
	@rm -rf node_modules/.cache
	@echo "$(GREEN)[SUCCESS]$(NC) Cleanup complete"

# Run tests (placeholder)
test:
	@echo "$(BLUE)[INFO]$(NC) Running tests..."
	@echo "$(YELLOW)[WARNING]$(NC) Tests not implemented yet"

# Alias for check-tools
check: check-tools
