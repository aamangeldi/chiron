"""
FastAPI Main Application
AI-powered browsing history assistant backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

from app.api import history, ai, sync
from app.core.config import settings
from app.services.storage import HistoryStorage
from app.services.history_collector import HistoryCollectorManager
from app.services.ai_agent import AIAgent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Starting Hopscotch Backend...")

    # Initialize services
    app.state.storage = HistoryStorage()
    app.state.collector_manager = HistoryCollectorManager()
    app.state.ai_agent = AIAgent()

    await app.state.storage.initialize()
    await app.state.collector_manager.initialize()
    await app.state.ai_agent.initialize()

    print("✅ Backend services initialized")

    # Sync browser history on startup
    print("[Startup] Syncing browser history...")
    try:
        entries = await app.state.collector_manager.collect_from_all()
        if entries:
            await app.state.storage.save_entries(entries)
            print(f"[Startup] ✅ Synced {len(entries)} history entries")
        else:
            print("[Startup] ℹ️ No history entries found")
    except Exception as e:
        print(f"[Startup] ⚠️ Error syncing history: {e}")

    yield

    # Shutdown
    print("🛑 Shutting down Hopscotch Backend...")
    await app.state.ai_agent.shutdown()
    await app.state.storage.close()
    print("✅ Backend shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Hopscotch API",
    description="AI-powered browsing history assistant",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(sync.router, prefix="/api/sync", tags=["sync"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Hopscotch API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "storage": "connected",
            "collector_manager": "ready"
        }
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
