"""
AI-related Pydantic models
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AgentMessage(BaseModel):
    """Message to AI agent"""
    content: str
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None


class AgentResponse(BaseModel):
    """Response from AI agent"""
    content: str
    confidence: Optional[float] = None
    sources: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = datetime.now()


class ChatSession(BaseModel):
    """Chat session model"""
    session_id: str
    user_id: Optional[str] = None
    created_at: datetime
    last_activity: datetime
    message_count: int = 0
