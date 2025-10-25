"""
Sync API endpoints for background history collection
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Optional, List
from datetime import datetime, timedelta

from app.models.history import BrowserType, SyncStatus
from app.models.common import BaseResponse, ErrorResponse
from app.services.history_collector import HistoryCollectorManager
from app.services.storage import HistoryStorage

router = APIRouter()


def get_collector_manager() -> HistoryCollectorManager:
    """Dependency to get collector manager instance"""
    from app.main import app
    return app.state.collector_manager


def get_storage() -> HistoryStorage:
    """Dependency to get storage instance"""
    from app.main import app
    return app.state.storage


@router.post("/start", response_model=BaseResponse)
async def start_sync(
    browsers: Optional[List[BrowserType]] = None,
    background_tasks: BackgroundTasks = None,
    collector_manager: HistoryCollectorManager = Depends(get_collector_manager),
    storage: HistoryStorage = Depends(get_storage)
):
    """Start a manual history sync"""
    try:
        # Default to Chrome if no browsers specified
        if not browsers:
            browsers = [BrowserType.CHROME]
        
        # Start background sync task
        background_tasks.add_task(
            perform_sync,
            browsers,
            collector_manager,
            storage
        )
        
        return BaseResponse(
            message=f"Sync started for browsers: {', '.join([b.value for b in browsers])}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting sync: {str(e)}")


@router.post("/full-sync", response_model=BaseResponse)
async def start_full_sync(
    background_tasks: BackgroundTasks = None,
    collector_manager: HistoryCollectorManager = Depends(get_collector_manager),
    storage: HistoryStorage = Depends(get_storage)
):
    """Start a full sync from all available browsers"""
    try:
        # Get all available browsers
        available_browsers = []
        for browser_type in BrowserType:
            collector = collector_manager.get_collector(browser_type)
            if collector and await collector.is_available():
                available_browsers.append(browser_type)
        
        if not available_browsers:
            raise HTTPException(status_code=400, detail="No browsers available for sync")
        
        # Start background sync task
        background_tasks.add_task(
            perform_sync,
            available_browsers,
            collector_manager,
            storage
        )
        
        return BaseResponse(
            message=f"Full sync started for browsers: {', '.join([b.value for b in available_browsers])}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting full sync: {str(e)}")


@router.get("/status", response_model=SyncStatus)
async def get_sync_status(
    collector_manager: HistoryCollectorManager = Depends(get_collector_manager)
):
    """Get current sync status"""
    try:
        # Check last sync times for each browser
        last_syncs = {}
        for browser_type in BrowserType:
            collector = collector_manager.get_collector(browser_type)
            if collector:
                last_sync = await collector.get_last_sync_time()
                last_syncs[browser_type.value] = last_sync
        
        # Determine overall status
        if any(last_syncs.values()):
            latest_sync = max([sync for sync in last_syncs.values() if sync])
            status = "completed" if latest_sync else "never"
        else:
            status = "never"
            latest_sync = None
        
        return SyncStatus(
            status=status,
            last_sync=latest_sync,
            entries_synced=0,  # This would need to be tracked separately
            error_message=None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting sync status: {str(e)}")


@router.get("/browsers", response_model=dict)
async def get_available_browsers(
    collector_manager: HistoryCollectorManager = Depends(get_collector_manager)
):
    """Get list of available browsers for sync"""
    try:
        available_browsers = {}
        
        for browser_type in BrowserType:
            collector = collector_manager.get_collector(browser_type)
            if collector:
                is_available = await collector.is_available()
                last_sync = await collector.get_last_sync_time()
                
                available_browsers[browser_type.value] = {
                    "available": is_available,
                    "last_sync": last_sync,
                    "collector_registered": True
                }
            else:
                available_browsers[browser_type.value] = {
                    "available": False,
                    "last_sync": None,
                    "collector_registered": False
                }
        
        return {"browsers": available_browsers}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting browser status: {str(e)}")


async def perform_sync(
    browsers: List[BrowserType],
    collector_manager: HistoryCollectorManager,
    storage: HistoryStorage
):
    """Background task to perform history sync"""
    try:
        print(f"[Sync] Starting sync for browsers: {[b.value for b in browsers]}")
        
        # Collect history from specified browsers
        entries = await collector_manager.collect_from(browsers)
        
        if entries:
            # Save to storage
            await storage.save_entries(entries)
            print(f"[Sync] Successfully synced {len(entries)} entries")
        else:
            print("[Sync] No entries collected")
            
    except Exception as e:
        print(f"[Sync] Error during sync: {e}")
        # In a real implementation, you might want to store this error
        # in a database or send notifications
