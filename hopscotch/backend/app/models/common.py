"""
Common Pydantic models
"""

from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class BaseResponse(BaseModel):
    """Base response model"""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = datetime.now()


class ErrorResponse(BaseResponse):
    """Error response model"""
    success: bool = False
    error_code: Optional[str] = None
    details: Optional[Any] = None
