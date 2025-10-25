"""
History-related Pydantic models
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class BrowserType(str, Enum):
    """Supported browser types"""
    CHROME = "chrome"
    FIREFOX = "firefox"
    SAFARI = "safari"
    EDGE = "edge"
    ARC = "arc"


class HistoryEntry(BaseModel):
    """Browser history entry"""
    id: str
    url: str
    title: Optional[str] = None
    visit_time: datetime
    browser: BrowserType
    visit_count: int = 1
    metadata: Optional[Dict[str, Any]] = None


class HistoryQuery(BaseModel):
    """History query parameters"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    browser: Optional[BrowserType] = None
    search_term: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class HistoryQueryResult(BaseModel):
    """History query result"""
    entries: List[HistoryEntry]
    total: int
    has_more: bool
    query: HistoryQuery


class SyncStatus(BaseModel):
    """Sync operation status"""
    status: str  # "running", "completed", "failed"
    last_sync: Optional[datetime] = None
    entries_synced: int = 0
    error_message: Optional[str] = None
