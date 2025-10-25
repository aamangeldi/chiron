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


@router.get("/entry/{entry_id}", response_model=HistoryEntry)
async def get_history_entry(
    entry_id: str,
    storage: HistoryStorage = Depends(get_storage)
):
    """Get a specific history entry by ID"""
    try:
        entry = await storage.get_entry(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="History entry not found")
        return entry
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving entry: {str(e)}")


@router.get("/analytics", response_model=dict)
async def get_history_analytics(
    storage: HistoryStorage = Depends(get_storage)
):
    """Get analytics about browsing history"""
    try:
        analytics = await storage.get_analytics()
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")


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


@router.get("/domains", response_model=dict)
async def get_domain_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    limit: int = Query(20, ge=1, le=100, description="Number of top domains to return"),
    storage: HistoryStorage = Depends(get_storage)
):
    """Get statistics about visited domains"""
    try:
        since = datetime.now() - timedelta(days=days)
        
        query = HistoryQuery(
            start_date=since,
            limit=10000  # Get more data for analysis
        )
        
        result = await storage.query(query)
        
        # Analyze domains
        domains = {}
        for entry in result.entries:
            if entry.metadata and "domain" in entry.metadata:
                domain = entry.metadata["domain"]
                domains[domain] = domains.get(domain, 0) + 1
        
        # Sort by visit count
        sorted_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "domains": dict(sorted_domains[:limit]),
            "total_unique_domains": len(domains),
            "period_days": days
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting domain stats: {str(e)}")


@router.delete("/old", response_model=BaseResponse)
async def delete_old_history(
    days: int = Query(90, ge=1, le=365, description="Delete entries older than this many days"),
    storage: HistoryStorage = Depends(get_storage)
):
    """Delete old history entries"""
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = await storage.delete_older_than(cutoff_date)
        
        return BaseResponse(
            message=f"Deleted {deleted_count} entries older than {days} days"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting old entries: {str(e)}")
