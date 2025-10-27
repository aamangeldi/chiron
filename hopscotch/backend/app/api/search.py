"""
Search Navigation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional

from app.models.search import NavigateRequest, NavigateResponse
from app.models.history import HistoryEntry
from app.services.search_navigator import SearchNavigator
from app.services.storage import HistoryStorage
from app.services.ai_agent import AIAgent

router = APIRouter(prefix="/api/search", tags=["search"])


async def get_search_navigator(request: Request) -> SearchNavigator:
    """Dependency to get SearchNavigator instance with dependencies injected."""
    # Get dependencies from app state
    ai_agent: AIAgent = request.app.state.ai_agent
    history_storage: HistoryStorage = request.app.state.storage

    if not ai_agent or not ai_agent.is_ready():
        raise HTTPException(status_code=503, detail="AI agent not ready")

    # Create SearchNavigator with AI agent's clients
    navigator = SearchNavigator(
        openai_client=ai_agent.client,
        tavily_client=ai_agent.tavily_client,
        history_storage=history_storage
    )

    return navigator


async def get_user_history(history_storage: Optional[HistoryStorage] = None, limit: int = 100) -> list:
    """Get user's recent browsing history for context."""
    if not history_storage:
        return []

    try:
        # Get recent history (last 24 hours, up to limit entries)
        from datetime import datetime, timedelta
        from sqlalchemy import select, desc

        since = datetime.utcnow() - timedelta(hours=24)

        # Query using the storage service
        results = await history_storage.query_history(
            start_date=since,
            limit=limit
        )

        # Convert to list of dicts for compatibility
        history_list = []
        for entry in results:
            if isinstance(entry, dict):
                history_list.append(entry)
            elif hasattr(entry, '__dict__'):
                history_list.append({
                    "url": entry.url,
                    "title": entry.title,
                    "visit_time": entry.visit_time.isoformat() if hasattr(entry.visit_time, 'isoformat') else str(entry.visit_time),
                    "metadata": entry.metadata if isinstance(entry.metadata, dict) else {}
                })

        return history_list

    except Exception as e:
        print(f"[SearchAPI] Error fetching user history: {e}")
        return []


@router.post("/navigate", response_model=NavigateResponse)
async def navigate(
    request: NavigateRequest,
    navigator: SearchNavigator = Depends(get_search_navigator)
) -> NavigateResponse:
    """
    Main navigation endpoint. Handles all action types:
    - initial: Start a new search
    - pick: User selected a tile to explore
    - vary_small: Show similar results to selected tile
    - vary_large: Show alternative results with high variance
    - reroll: Re-sample with same breadth, different results

    Returns 4 diverse tiles for the navigation grid.
    Target response time: <10 seconds
    """
    print(f"[SearchAPI] Navigate request: action={request.action}, query={request.query}")

    try:
        # Get user's browsing history for context
        user_history = await get_user_history(navigator.history_storage, limit=100)
        print(f"[SearchAPI] Loaded {len(user_history)} history entries")

        # Execute navigation
        response = await navigator.navigate(request, user_history=user_history)

        print(f"[SearchAPI] Navigation complete: hop={response.hop}, tiles={len(response.tiles)}, timing={response.debug_timing}")

        return response

    except Exception as e:
        print(f"[SearchAPI] Navigation error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Navigation failed: {str(e)}"
        )


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get current session state (for debugging)."""
    from app.services.search_navigator import _sessions

    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = _sessions[session_id]

    # Convert to JSON-serializable format
    return {
        "session_id": session.session_id,
        "query": session.query,
        "hop": session.hop,
        "num_selections": len(session.selections),
        "num_shown_tiles": len(session.shown_tiles),
        "shown_domains": list(session.shown_domains),
        "knobs": {
            "diversity": session.knobs.diversity,
            "novelty": session.knobs.novelty,
            "radius": session.knobs.radius
        },
        "created_at": session.created_at.isoformat(),
        "last_updated": session.last_updated.isoformat()
    }
