"""
Storage Service
Enhanced SQLite storage with pandas integration for better performance
"""

import sqlite3
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import pandas as pd
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.sqlite import insert

from app.models.history import HistoryEntry, HistoryQuery, HistoryQueryResult, BrowserType
from app.core.config import settings

Base = declarative_base()


class HistoryRecord(Base):
    """SQLAlchemy model for history entries"""
    __tablename__ = "history"
    
    id = Column(String, primary_key=True)
    url = Column(String, nullable=False)
    title = Column(String)
    visit_time = Column(DateTime, nullable=False)
    browser = Column(String, nullable=False)
    visit_count = Column(Integer, default=1)
    metadata_json = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.now)
    
    # Indexes for better query performance
    __table_args__ = (
        Index('idx_visit_time', 'visit_time'),
        Index('idx_browser', 'browser'),
        Index('idx_url', 'url'),
    )


class HistoryStorage:
    """Enhanced storage service with SQLAlchemy and pandas integration"""
    
    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or settings.DATABASE_URL
        self.engine = create_engine(self.db_url, echo=False)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self._session: Optional[Session] = None
    
    async def initialize(self):
        """Initialize the storage (create tables, etc.)"""
        # Create all tables
        Base.metadata.create_all(bind=self.engine)
        print(f"[Storage] Initialized database at {self.db_url}")
    
    def get_session(self) -> Session:
        """Get database session"""
        if not self._session:
            self._session = self.SessionLocal()
        return self._session
    
    async def save_entries(self, entries: List[HistoryEntry]) -> None:
        """Store history entries with efficient bulk operations"""
        if not entries:
            return
        
        session = self.get_session()
        
        try:
            # Convert to database records
            records = []
            for entry in entries:
                record = HistoryRecord(
                    id=entry.id,
                    url=entry.url,
                    title=entry.title,
                    visit_time=entry.visit_time,
                    browser=entry.browser.value,
                    visit_count=entry.visit_count,
                    metadata_json=json.dumps(entry.metadata) if entry.metadata else None
                )
                records.append(record)
            
            # Use bulk upsert for efficiency
            stmt = insert(HistoryRecord).values([
                {
                    'id': r.id,
                    'url': r.url,
                    'title': r.title,
                    'visit_time': r.visit_time,
                    'browser': r.browser,
                    'visit_count': r.visit_count,
                    'metadata_json': r.metadata_json
                } for r in records
            ])
            
            # Handle conflicts by updating
            stmt = stmt.on_conflict_do_update(
                index_elements=['id'],
                set_=dict(
                    url=stmt.excluded.url,
                    title=stmt.excluded.title,
                    visit_time=stmt.excluded.visit_time,
                    browser=stmt.excluded.browser,
                    visit_count=stmt.excluded.visit_count,
                    metadata_json=stmt.excluded.metadata_json
                )
            )
            
            session.execute(stmt)
            session.commit()
            print(f"[Storage] Saved {len(entries)} entries")
            
        except Exception as e:
            session.rollback()
            print(f"[Storage] Error saving entries: {e}")
            raise
        finally:
            session.close()
    
    async def query(self, params: HistoryQuery) -> HistoryQueryResult:
        """Query history entries with pandas for efficient processing"""
        session = self.get_session()
        
        try:
            # Build query
            query = session.query(HistoryRecord)
            
            # Apply filters
            if params.start_date:
                query = query.filter(HistoryRecord.visit_time >= params.start_date)
            
            if params.end_date:
                query = query.filter(HistoryRecord.visit_time <= params.end_date)
            
            if params.browser:
                query = query.filter(HistoryRecord.browser == params.browser.value)
            
            if params.search_term:
                search_pattern = f"%{params.search_term}%"
                query = query.filter(
                    (HistoryRecord.url.like(search_pattern)) |
                    (HistoryRecord.title.like(search_pattern))
                )
            
            # Get total count
            total = query.count()
            
            # Apply pagination and ordering
            entries_query = query.order_by(HistoryRecord.visit_time.desc())
            entries_query = entries_query.offset(params.offset).limit(params.limit)
            
            # Execute query
            records = entries_query.all()
            
            # Convert to HistoryEntry objects
            entries = []
            for record in records:
                entry = HistoryEntry(
                    id=record.id,
                    url=record.url,
                    title=record.title,
                    visit_time=record.visit_time,
                    browser=BrowserType(record.browser),
                    visit_count=record.visit_count,
                    metadata=json.loads(record.metadata_json) if record.metadata_json else None
                )
                entries.append(entry)
            
            return HistoryQueryResult(
                entries=entries,
                total=total,
                has_more=params.offset + params.limit < total,
                query=params
            )
            
        except Exception as e:
            print(f"[Storage] Error querying: {e}")
            raise
        finally:
            session.close()
    
    async def get_entry(self, entry_id: str) -> Optional[HistoryEntry]:
        """Get a single entry by ID"""
        session = self.get_session()
        
        try:
            record = session.query(HistoryRecord).filter(HistoryRecord.id == entry_id).first()
            
            if not record:
                return None
            
            return HistoryEntry(
                id=record.id,
                url=record.url,
                title=record.title,
                visit_time=record.visit_time,
                browser=BrowserType(record.browser),
                visit_count=record.visit_count,
                metadata=json.loads(record.metadata_json) if record.metadata_json else None
            )
            
        except Exception as e:
            print(f"[Storage] Error getting entry: {e}")
            raise
        finally:
            session.close()
    
    async def delete_older_than(self, date: datetime) -> int:
        """Delete entries older than specified date"""
        session = self.get_session()
        
        try:
            result = session.query(HistoryRecord).filter(HistoryRecord.visit_time < date).delete()
            session.commit()
            print(f"[Storage] Deleted {result} old entries")
            return result
            
        except Exception as e:
            session.rollback()
            print(f"[Storage] Error deleting old entries: {e}")
            raise
        finally:
            session.close()
    
    async def get_analytics(self) -> Dict[str, Any]:
        """Get analytics data using pandas for efficient aggregation"""
        try:
            # Use pandas for efficient data analysis
            df = pd.read_sql_query(
                "SELECT * FROM history ORDER BY visit_time DESC LIMIT 10000",
                self.engine
            )
            
            if df.empty:
                return {"total_entries": 0}
            
            # Convert visit_time to datetime
            df['visit_time'] = pd.to_datetime(df['visit_time'])
            
            # Calculate analytics
            analytics = {
                "total_entries": len(df),
                "unique_domains": df['url'].apply(self._extract_domain).nunique(),
                "most_visited_domains": df['url'].apply(self._extract_domain).value_counts().head(10).to_dict(),
                "browser_distribution": df['browser'].value_counts().to_dict(),
                "entries_last_7_days": len(df[df['visit_time'] >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - pd.Timedelta(days=7)]),
                "entries_last_30_days": len(df[df['visit_time'] >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - pd.Timedelta(days=30)]),
            }
            
            return analytics
            
        except Exception as e:
            print(f"[Storage] Error getting analytics: {e}")
            return {"error": str(e)}
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return ""
    
    async def close(self):
        """Close the storage connection"""
        if self._session:
            self._session.close()
        print("[Storage] Database connection closed")
