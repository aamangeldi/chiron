"""
History Collection Services
Migrated from TypeScript to Python with enhanced functionality
"""

import sqlite3
import shutil
import tempfile
import os
import platform
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime
import pandas as pd
from abc import ABC, abstractmethod

from app.models.history import HistoryEntry, BrowserType


class IHistoryCollector(ABC):
    """Interface for browser history collectors"""
    
    @abstractmethod
    def get_browser_type(self) -> BrowserType:
        """Get the browser type this collector handles"""
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the browser is installed and accessible"""
        pass
    
    @abstractmethod
    async def collect_history(self, since: Optional[datetime] = None) -> List[HistoryEntry]:
        """Collect history entries from the browser"""
        pass
    
    @abstractmethod
    async def get_last_sync_time(self) -> Optional[datetime]:
        """Get the last sync timestamp"""
        pass


class ChromeHistoryCollector(IHistoryCollector):
    """Chrome browser history collector with enhanced Python capabilities"""
    
    def __init__(self):
        self.last_sync_time: Optional[datetime] = None
        self.history_path = self._get_chrome_history_path()
    
    def get_browser_type(self) -> BrowserType:
        return BrowserType.CHROME
    
    async def is_available(self) -> bool:
        """Check if Chrome history file is accessible"""
        return os.path.exists(self.history_path)
    
    async def collect_history(self, since: Optional[datetime] = None) -> List[HistoryEntry]:
        """Collect Chrome history with enhanced data processing"""
        print(f"[ChromeCollector] Collecting history since {since or 'beginning'}")
        
        if not await self.is_available():
            print("[ChromeCollector] Chrome history not available")
            return []
        
        try:
            # Copy Chrome's history database to temp location (Chrome locks the file)
            with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as temp_file:
                temp_path = temp_file.name
                shutil.copy2(self.history_path, temp_path)
            
            # Query the database
            entries = await self._query_chrome_history(temp_path, since)
            
            # Clean up temp file
            os.unlink(temp_path)
            
            self.last_sync_time = datetime.now()
            print(f"[ChromeCollector] Collected {len(entries)} entries")
            return entries
            
        except Exception as e:
            print(f"[ChromeCollector] Error collecting history: {e}")
            return []
    
    async def get_last_sync_time(self) -> Optional[datetime]:
        return self.last_sync_time
    
    def _get_chrome_history_path(self) -> str:
        """Get Chrome history path based on platform"""
        system = platform.system()
        home_dir = Path.home()
        
        if system == "Darwin":  # macOS
            return str(home_dir / "Library/Application Support/Google/Chrome/Default/History")
        elif system == "Windows":
            return str(home_dir / "AppData/Local/Google/Chrome/User Data/Default/History")
        elif system == "Linux":
            return str(home_dir / ".config/google-chrome/Default/History")
        else:
            raise ValueError(f"Unsupported platform: {system}")
    
    async def _query_chrome_history(self, db_path: str, since: Optional[datetime] = None) -> List[HistoryEntry]:
        """Query Chrome history database using pandas for efficient processing"""
        try:
            # Connect to the database
            conn = sqlite3.connect(db_path)
            
            # Build query with optional date filter
            where_clause = ""
            params = []
            if since:
                where_clause = "WHERE v.visit_time >= ?"
                # Chrome stores timestamps as microseconds since Windows epoch
                chrome_timestamp = int((since.timestamp() + 11644473600) * 1000000)
                params.append(chrome_timestamp)
            
            # Query to join urls and visits tables
            query = f"""
                SELECT 
                    u.id,
                    u.url,
                    u.title,
                    v.visit_time,
                    u.visit_count,
                    u.typed_count,
                    u.last_visit_time
                FROM urls u
                JOIN visits v ON u.id = v.url
                {where_clause}
                ORDER BY v.visit_time DESC
                LIMIT 10000
            """
            
            # Use pandas for efficient data processing
            df = pd.read_sql_query(query, conn, params=params)
            conn.close()
            
            # Convert to HistoryEntry objects
            entries = []
            for _, row in df.iterrows():
                # Convert Chrome timestamp to Python datetime
                visit_time = datetime.fromtimestamp(
                    (row['visit_time'] / 1000000) - 11644473600
                )
                
                entry = HistoryEntry(
                    id=f"chrome_{row['id']}_{row['visit_time']}",
                    url=row['url'],
                    title=row['title'] or "",
                    visit_time=visit_time,
                    browser=BrowserType.CHROME,
                    visit_count=row['visit_count'] or 1,
                    metadata={
                        "typed_count": row.get('typed_count', 0),
                        "last_visit_time": row.get('last_visit_time'),
                        "domain": self._extract_domain(row['url'])
                    }
                )
                entries.append(entry)
            
            return entries
            
        except Exception as e:
            print(f"[ChromeCollector] Error querying database: {e}")
            return []
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return ""


class ArcHistoryCollector(IHistoryCollector):
    """Arc browser history collector (Chromium-based)"""

    def __init__(self):
        self.last_sync_time: Optional[datetime] = None
        self.history_path = self._get_arc_history_path()

    def get_browser_type(self) -> BrowserType:
        return BrowserType.ARC

    async def is_available(self) -> bool:
        """Check if Arc history file is accessible"""
        return os.path.exists(self.history_path)

    async def collect_history(self, since: Optional[datetime] = None) -> List[HistoryEntry]:
        """Collect Arc history with enhanced data processing"""
        print(f"[ArcCollector] Collecting history since {since or 'beginning'}")

        if not await self.is_available():
            print("[ArcCollector] Arc history not available")
            return []

        try:
            # Copy Arc's history database to temp location
            with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as temp_file:
                temp_path = temp_file.name
                shutil.copy2(self.history_path, temp_path)

            # Query the database (same structure as Chrome)
            entries = await self._query_arc_history(temp_path, since)

            # Clean up temp file
            os.unlink(temp_path)

            self.last_sync_time = datetime.now()
            print(f"[ArcCollector] Collected {len(entries)} entries")
            return entries

        except Exception as e:
            print(f"[ArcCollector] Error collecting history: {e}")
            return []

    async def get_last_sync_time(self) -> Optional[datetime]:
        return self.last_sync_time

    def _get_arc_history_path(self) -> str:
        """Get Arc history path based on platform"""
        system = platform.system()
        home_dir = Path.home()

        if system == "Darwin":  # macOS
            return str(home_dir / "Library/Application Support/Arc/User Data/Default/History")
        elif system == "Windows":
            return str(home_dir / "AppData/Local/Arc/User Data/Default/History")
        elif system == "Linux":
            return str(home_dir / ".config/arc/Default/History")
        else:
            raise ValueError(f"Unsupported platform: {system}")

    async def _query_arc_history(self, db_path: str, since: Optional[datetime] = None) -> List[HistoryEntry]:
        """Query Arc history database (same structure as Chrome)"""
        try:
            # Connect to the database
            conn = sqlite3.connect(db_path)

            # Build query with optional date filter
            where_clause = ""
            params = []
            if since:
                where_clause = "WHERE v.visit_time >= ?"
                # Arc uses the same timestamp format as Chrome
                arc_timestamp = int((since.timestamp() + 11644473600) * 1000000)
                params.append(arc_timestamp)

            # Query to join urls and visits tables
            query = f"""
                SELECT
                    u.id,
                    u.url,
                    u.title,
                    v.visit_time,
                    u.visit_count,
                    u.typed_count,
                    u.last_visit_time
                FROM urls u
                JOIN visits v ON u.id = v.url
                {where_clause}
                ORDER BY v.visit_time DESC
                LIMIT 10000
            """

            # Use pandas for efficient data processing
            df = pd.read_sql_query(query, conn, params=params)
            conn.close()

            # Convert to HistoryEntry objects
            entries = []
            for _, row in df.iterrows():
                # Convert Arc timestamp to Python datetime
                visit_time = datetime.fromtimestamp(
                    (row['visit_time'] / 1000000) - 11644473600
                )

                entry = HistoryEntry(
                    id=f"arc_{row['id']}_{row['visit_time']}",
                    url=row['url'],
                    title=row['title'] or "",
                    visit_time=visit_time,
                    browser=BrowserType.ARC,
                    visit_count=row['visit_count'] or 1,
                    metadata={
                        "typed_count": row.get('typed_count', 0),
                        "last_visit_time": row.get('last_visit_time'),
                        "domain": self._extract_domain(row['url'])
                    }
                )
                entries.append(entry)

            return entries

        except Exception as e:
            print(f"[ArcCollector] Error querying database: {e}")
            return []

    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return ""


class HistoryCollectorManager:
    """Manager for coordinating multiple browser collectors"""
    
    def __init__(self):
        self.collectors: Dict[BrowserType, IHistoryCollector] = {}
    
    async def initialize(self):
        """Initialize the collector manager"""
        # Register Arc collector
        arc_collector = ArcHistoryCollector()
        self.register_collector(arc_collector)

        # Register Chrome collector
        chrome_collector = ChromeHistoryCollector()
        self.register_collector(chrome_collector)

        # TODO: Add other browser collectors (Firefox, Safari, Edge)
        print("[Manager] History collector manager initialized")
    
    def register_collector(self, collector: IHistoryCollector):
        """Register a browser collector"""
        self.collectors[collector.get_browser_type()] = collector
        print(f"[Manager] Registered {collector.get_browser_type()} collector")
    
    def get_collectors(self) -> List[IHistoryCollector]:
        """Get all registered collectors"""
        return list(self.collectors.values())
    
    def get_collector(self, browser_type: BrowserType) -> Optional[IHistoryCollector]:
        """Get a specific collector by browser type"""
        return self.collectors.get(browser_type)
    
    async def collect_from_all(self, since: Optional[datetime] = None) -> List[HistoryEntry]:
        """Collect history from all available browsers"""
        all_entries = []
        
        for browser_type, collector in self.collectors.items():
            if not await collector.is_available():
                print(f"[Manager] Skipping {browser_type}: not available")
                continue
            
            try:
                entries = await collector.collect_history(since)
                all_entries.extend(entries)
                print(f"[Manager] Collected {len(entries)} entries from {browser_type}")
            except Exception as e:
                print(f"[Manager] Error collecting from {browser_type}: {e}")
        
        return all_entries
    
    async def collect_from(self, browser_types: List[BrowserType], since: Optional[datetime] = None) -> List[HistoryEntry]:
        """Collect history from specific browsers"""
        all_entries = []
        
        for browser_type in browser_types:
            collector = self.collectors.get(browser_type)
            if not collector:
                print(f"[Manager] No collector registered for {browser_type}")
                continue
            
            if not await collector.is_available():
                print(f"[Manager] Skipping {browser_type}: not available")
                continue
            
            try:
                entries = await collector.collect_history(since)
                all_entries.extend(entries)
                print(f"[Manager] Collected {len(entries)} entries from {browser_type}")
            except Exception as e:
                print(f"[Manager] Error collecting from {browser_type}: {e}")
        
        return all_entries
