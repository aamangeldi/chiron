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


@router.post("/chat", response_model=AgentResponse)
async def chat_with_agent(
    message: AgentMessage,
    ai_agent: AIAgent = Depends(get_ai_agent)
):
    """Send a message to the AI agent"""
    try:
        if not ai_agent.is_ready():
            raise HTTPException(status_code=503, detail="AI agent not ready")
        
        response = await ai_agent.send_message(message)
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")


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
    message: str,
    context: Optional[Dict[str, Any]] = None,
    ai_agent: AIAgent = Depends(get_ai_agent)
):
    """Send a message with browsing history context"""
    try:
        if not ai_agent.is_ready():
            raise HTTPException(status_code=503, detail="AI agent not ready")
        
        agent_message = AgentMessage(
            content=message,
            context=context or {}
        )
        
        response = await ai_agent.send_message(agent_message)
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")


@router.get("/suggestions", response_model=dict)
async def get_browsing_suggestions(
    context: Optional[Dict[str, Any]] = None,
    ai_agent: AIAgent = Depends(get_ai_agent)
):
    """Get AI-powered browsing suggestions based on history"""
    try:
        if not ai_agent.is_ready():
            raise HTTPException(status_code=503, detail="AI agent not ready")
        
        # Create a message asking for suggestions
        message = AgentMessage(
            content="Based on my browsing history, what suggestions do you have for me? Please provide actionable insights and recommendations.",
            context=context or {}
        )
        
        response = await ai_agent.send_message(message)
        
        return {
            "suggestions": response.content,
            "confidence": response.confidence,
            "sources": response.sources,
            "metadata": response.metadata
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting suggestions: {str(e)}")
