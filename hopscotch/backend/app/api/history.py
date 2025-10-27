"""
History API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timedelta
import pandas as pd

from app.models.history import HistoryQuery, HistoryQueryResult, HistoryEntry, BrowserType, SyncStatus
from app.models.common import BaseResponse, ErrorResponse
from app.services.storage import HistoryStorage

router = APIRouter()


def get_storage() -> HistoryStorage:
    """Dependency to get storage instance"""
    # This will be injected by the main app
    from app.main import app
    return app.state.storage


@router.get("/", response_model=HistoryQueryResult)
async def get_history(
    start_date: Optional[datetime] = Query(None, description="Start date for history query"),
    end_date: Optional[datetime] = Query(None, description="End date for history query"),
    browser: Optional[BrowserType] = Query(None, description="Filter by browser type"),
    search_term: Optional[str] = Query(None, description="Search in URLs and titles"),
    limit: int = Query(100, ge=1, le=1000, description="Number of entries to return"),
    offset: int = Query(0, ge=0, description="Number of entries to skip"),
    storage: HistoryStorage = Depends(get_storage)
):
    """Get browsing history with optional filters"""
    try:
        query = HistoryQuery(
            start_date=start_date,
            end_date=end_date,
            browser=browser,
            search_term=search_term,
            limit=limit,
            offset=offset
        )
        
        result = await storage.query(query)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying history: {str(e)}")


@router.get("/recent", response_model=List[HistoryEntry])
async def get_recent_history(
    hours: int = Query(24, ge=1, le=168, description="Number of hours to look back"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of entries"),
    storage: HistoryStorage = Depends(get_storage)
):
    """Get recent browsing history"""
    try:
        since = datetime.now() - timedelta(hours=hours)
        
        query = HistoryQuery(
            start_date=since,
            limit=limit,
            offset=0
        )
        
        result = await storage.query(query)
        return result.entries
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recent history: {str(e)}")


