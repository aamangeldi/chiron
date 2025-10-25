"""
Celery background tasks
"""

from celery import current_task
from datetime import datetime, timedelta
from typing import List

from workers.celery_app import celery_app
from app.services.history_collector import HistoryCollectorManager, BrowserType
from app.services.storage import HistoryStorage
from app.core.config import settings


@celery_app.task(bind=True)
def sync_browser_history(self, browsers: List[str] = None):
    """
    Background task to sync browser history
    
    Args:
        browsers: List of browser types to sync (defaults to Chrome)
    """
    try:
        # Update task state
        self.update_state(
            state="PROGRESS",
            meta={"status": "Initializing sync", "progress": 0}
        )
        
        # Initialize services
        collector_manager = HistoryCollectorManager()
        storage = HistoryStorage()
        
        # Convert string browser types to enum
        if not browsers:
            browser_types = [BrowserType.CHROME]
        else:
            browser_types = [BrowserType(browser) for browser in browsers]
        
        self.update_state(
            state="PROGRESS",
            meta={"status": "Collecting history", "progress": 25}
        )
        
        # Collect history
        entries = collector_manager.collect_from(browser_types)
        
        self.update_state(
            state="PROGRESS",
            meta={"status": "Saving to database", "progress": 75}
        )
        
        # Save to storage
        if entries:
            storage.save_entries(entries)
        
        # Complete
        self.update_state(
            state="SUCCESS",
            meta={
                "status": "Sync completed",
                "progress": 100,
                "entries_synced": len(entries),
                "browsers": [b.value for b in browser_types]
            }
        )
        
        return {
            "status": "success",
            "entries_synced": len(entries),
            "browsers": [b.value for b in browser_types],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        # Update task state with error
        self.update_state(
            state="FAILURE",
            meta={
                "status": "Sync failed",
                "error": str(e),
                "progress": 0
            }
        )
        
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@celery_app.task
def cleanup_old_history(days: int = 90):
    """
    Background task to clean up old history entries
    
    Args:
        days: Delete entries older than this many days
    """
    try:
        storage = HistoryStorage()
        
        # Calculate cutoff date
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Delete old entries
        deleted_count = storage.delete_older_than(cutoff_date)
        
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "cutoff_days": days,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@celery_app.task
def generate_analytics():
    """
    Background task to generate and cache analytics
    """
    try:
        storage = HistoryStorage()
        
        # Generate analytics
        analytics = storage.get_analytics()
        
        # In a real implementation, you might cache this in Redis
        # or store it in a separate analytics table
        
        return {
            "status": "success",
            "analytics": analytics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
