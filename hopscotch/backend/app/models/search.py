"""
Search navigation models for Midjourney-style 4-tile interface.
"""
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ActionType(str, Enum):
    """Types of navigation actions users can take."""
    INITIAL = "initial"
    PICK = "pick"
    VARY_SMALL = "vary_small"
    VARY_LARGE = "vary_large"
    REROLL = "reroll"


class SearchTile(BaseModel):
    """A single result tile in the 4-tile grid."""
    url: str
    title: str
    description: str
    domain: str
    image_url: Optional[str] = Field(default=None, description="Preview image URL")
    score: float = Field(ge=0.0, le=10.0, description="Overall score 0-10")
    score_breakdown: Dict[str, float] = Field(
        default_factory=dict,
        description="Individual score components: domain_boost, diversity, keyword_match"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example.com/article",
                "title": "Example Article Title",
                "description": "A brief description of the content...",
                "domain": "example.com",
                "score": 7.5,
                "score_breakdown": {
                    "domain_boost": 2.0,
                    "diversity": 1.0,
                    "keyword_match": 1.5
                }
            }
        }


class SessionKnobs(BaseModel):
    """Tuning parameters that adjust per hop."""
    diversity: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="How spread out results should be (0=focused, 1=diverse)"
    )
    novelty: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Preference for novel vs familiar domains"
    )
    radius: float = Field(
        default=1.0,
        ge=0.1,
        le=2.0,
        description="Search radius multiplier for vary operations"
    )


class NavigationSession(BaseModel):
    """Tracks state across multiple hops in a search session."""
    session_id: str
    query: str
    hop: int = Field(default=0, ge=0)
    selections: List[SearchTile] = Field(
        default_factory=list,
        description="Tiles picked by user in order"
    )
    shown_tiles: List[SearchTile] = Field(
        default_factory=list,
        description="All tiles shown to avoid repetition"
    )
    shown_domains: set = Field(
        default_factory=set,
        description="Domains already shown to user"
    )
    knobs: SessionKnobs = Field(default_factory=SessionKnobs)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # Allow set type for shown_domains
        arbitrary_types_allowed = True


class NavigateRequest(BaseModel):
    """Request to navigate the search space."""
    query: str = Field(description="User's search query")
    action: ActionType = Field(default=ActionType.INITIAL)
    selected_index: Optional[int] = Field(
        default=None,
        ge=0,
        le=3,
        description="Index of tile user selected (0-3 for pick/vary actions)"
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Session ID for continuing navigation"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "query": "best art deco hotels",
                "action": "initial",
                "selected_index": None,
                "session_id": None
            }
        }


class NavigateResponse(BaseModel):
    """Response containing 4 navigation tiles."""
    tiles: List[SearchTile] = Field(
        min_length=4,
        max_length=4,
        description="Exactly 4 tiles for the grid"
    )
    session_id: str
    hop: int
    debug_timing: Optional[Dict[str, float]] = Field(
        default=None,
        description="Timing breakdown for performance debugging"
    )
    suggested_action: Optional[str] = Field(
        default=None,
        description="Hint for what the user might want to do next"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "tiles": [
                    {
                        "url": "https://example1.com",
                        "title": "Tile 1",
                        "description": "Description...",
                        "domain": "example1.com",
                        "score": 8.0,
                        "score_breakdown": {}
                    }
                    # ... 3 more tiles
                ],
                "session_id": "abc123",
                "hop": 1,
                "debug_timing": {
                    "web_search": 1.2,
                    "history_query": 0.3,
                    "scoring": 0.1,
                    "llm_selection": 2.5
                }
            }
        }


class Candidate(BaseModel):
    """Internal model for candidate results before final selection."""
    url: str
    title: str
    content: str  # Longer content for scoring
    image_url: Optional[str] = None  # Image from search result
    score: float = 0.0
    score_breakdown: Dict[str, float] = Field(default_factory=dict)

    def to_tile(self, description: str = None) -> SearchTile:
        """Convert to a SearchTile for display."""
        from urllib.parse import urlparse
        domain = urlparse(self.url).netloc

        # Use first 200 chars of content as description if not provided
        if description is None:
            description = self.content[:200] + "..." if len(self.content) > 200 else self.content

        return SearchTile(
            url=self.url,
            title=self.title,
            description=description,
            domain=domain,
            image_url=self.image_url,
            score=self.score,
            score_breakdown=self.score_breakdown
        )
