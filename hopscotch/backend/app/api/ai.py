"""
AI API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any

from app.models.ai import AgentMessage, AgentResponse, ChatSession
from app.models.common import BaseResponse, ErrorResponse
from app.services.ai_agent import AIAgent

router = APIRouter()


def get_ai_agent() -> AIAgent:
    """Dependency to get AI agent instance"""
    # This will be injected by the main app
    from app.main import app
    return app.state.ai_agent


@router.get("/status", response_model=dict)
async def get_ai_status(
    ai_agent: AIAgent = Depends(get_ai_agent)
):
    """Get AI agent status"""
    return {
        "ready": ai_agent.is_ready(),
        "model": ai_agent.model if hasattr(ai_agent, 'model') else "unknown"
    }


@router.post("/chat/with-context", response_model=AgentResponse)
async def chat_with_history_context(
    request: Dict[str, Any],
    ai_agent: AIAgent = Depends(get_ai_agent)
):
    """Send a message with browsing history context"""
    try:
        if not ai_agent.is_ready():
            raise HTTPException(status_code=503, detail="AI agent not ready")

        message = request.get("message", "")
        context = request.get("context", {})

        agent_message = AgentMessage(
            content=message,
            context=context
        )

        response = await ai_agent.send_message(agent_message)
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")


@router.get("/trending", response_model=dict)
async def get_trending_categories(
    days: int = 7,
    limit: int = 5,
    ai_agent: AIAgent = Depends(get_ai_agent)
):
    """Get AI-powered trending categories from browsing history"""
    try:
        from app.main import app
        storage = app.state.storage

        # Get recent history for analysis
        from datetime import datetime, timedelta
        from app.models.history import HistoryQuery

        since = datetime.now() - timedelta(days=days)
        query = HistoryQuery(start_date=since, limit=1000)
        result = await storage.query(query)

        if not result.entries:
            # Return default trending if no history
            return {
                "categories": [],
                "message": "No browsing history available yet. Start browsing to see trends!"
            }

        # Prepare context for AI
        context = {
            "recent_history": [
                {
                    "url": entry.url,
                    "title": entry.title or "",
                    "visit_time": entry.visit_time.isoformat(),
                    "domain": entry.metadata.get("domain", "") if entry.metadata else ""
                }
                for entry in result.entries[:100]  # Send top 100 to AI
            ]
        }

        if ai_agent.is_ready():
            # Use AI to identify trending categories
            message = AgentMessage(
                content=f"""Analyze my browsing history from the past {days} days and identify the top {limit} trending topics or categories.

For each category, provide:
1. A short, catchy name (2-4 words max)
2. A brief description of why it's trending

Return ONLY a JSON array of objects with 'name' and 'description' fields. Example:
[{{"name": "AI Development", "description": "Researching LLMs and AI agents"}}, ...]
""",
                context=context
            )

            response = await ai_agent.send_message(message)

            # Try to parse JSON from response
            import json
            import re

            # Extract JSON from response (it might be wrapped in markdown code blocks)
            content = response.content
            json_match = re.search(r'\[.*\]', content, re.DOTALL)

            if json_match:
                try:
                    categories = json.loads(json_match.group())
                    return {
                        "categories": categories[:limit],
                        "period_days": days,
                        "source": "ai_analysis"
                    }
                except json.JSONDecodeError:
                    pass

        # Fallback: use simple domain analysis
        domains = {}
        for entry in result.entries:
            if entry.metadata and "domain" in entry.metadata:
                domain = entry.metadata["domain"]
                domains[domain] = domains.get(domain, 0) + 1

        sorted_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)

        categories = [
            {
                "name": domain.replace("www.", "").split(".")[0].title(),
                "description": f"Visited {count} times"
            }
            for domain, count in sorted_domains[:limit]
        ]

        return {
            "categories": categories,
            "period_days": days,
            "source": "domain_analysis"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting trending categories: {str(e)}")
