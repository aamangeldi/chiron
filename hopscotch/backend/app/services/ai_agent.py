"""
AI Agent Service
Enhanced AI agent with OpenAI integration and browsing history context
"""

import json
from typing import List, Dict, Optional, Any
from datetime import datetime
from openai import AsyncOpenAI
import pandas as pd

from app.models.ai import AgentMessage, AgentResponse
from app.models.history import HistoryEntry
from app.core.config import settings


class AIAgent:
    """Enhanced AI agent with browsing history context and analytics"""

    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        self.ready = False
        self.model = settings.AI_MODEL
        self.max_context_entries = 50  # Limit context size

    async def initialize(self):
        """Initialize the AI agent"""
        print("[AIAgent] Initializing AI agent...")

        if not settings.OPENAI_API_KEY:
            print("[AIAgent] Warning: No OpenAI API key provided, using stub mode")
            self.ready = True
            return

        try:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            
            # Test the connection
            await self._test_connection()
            
            self.ready = True
            print(f"[AIAgent] AI agent ready with model: {self.model}")
            
        except Exception as e:
            print(f"[AIAgent] Error initializing: {e}")
            self.ready = True  # Fall back to stub mode
    
    async def send_message(self, message: AgentMessage) -> AgentResponse:
        """Send message to AI agent with browsing history context"""
        if not self.ready:
            raise Exception("Agent not initialized")
        
        print(f"[AIAgent] Processing message: {message.content[:100]}...")
        
        try:
            if self.client and settings.OPENAI_API_KEY:
                return await self._process_with_openai(message)
            else:
                return await self._process_stub(message)
                
        except Exception as e:
            print(f"[AIAgent] Error processing message: {e}")
            return AgentResponse(
                content=f"I encountered an error processing your request: {str(e)}",
                confidence=0.0,
                metadata={"error": str(e)}
            )
    
    async def _process_with_openai(self, message: AgentMessage) -> AgentResponse:
        """Process message using OpenAI API"""
        # Prepare context from browsing history
        context = await self._prepare_context(message.context)
        
        # Build system prompt
        system_prompt = self._build_system_prompt(context)
        
        # Prepare messages for OpenAI
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message.content}
        ]
        
        # Call OpenAI API
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        return AgentResponse(
            content=content,
            confidence=0.9,  # OpenAI doesn't provide confidence scores
            sources=self._extract_sources(content, context),
            metadata={
                "model": self.model,
                "context_entries": len(context.get("recent_history", [])),
                "tokens_used": response.usage.total_tokens if response.usage else None
            }
        )
    
    async def _process_stub(self, message: AgentMessage) -> AgentResponse:
        """Process message in stub mode (no AI)"""
        context = message.context or {}
        history_entries = context.get("recent_history", [])
        
        # Simple rule-based responses
        content = "I'm currently in stub mode. Here's what I can tell you about your browsing history:\n\n"
        
        if history_entries:
            content += f"• You have {len(history_entries)} recent browsing entries\n"
            
            # Analyze domains
            domains = {}
            for entry in history_entries:
                if isinstance(entry, dict) and "metadata" in entry:
                    domain = entry["metadata"].get("domain", "unknown")
                    domains[domain] = domains.get(domain, 0) + 1
            
            if domains:
                top_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)[:3]
                content += f"• Your most visited domains: {', '.join([d[0] for d in top_domains])}\n"
        else:
            content += "• No recent browsing history available\n"
        
        content += "\nTo get AI-powered insights, please configure your OpenAI API key."
        
        return AgentResponse(
            content=content,
            confidence=0.5,
            metadata={
                "mode": "stub",
                "context_entries": len(history_entries)
            }
        )
    
    async def _prepare_context(self, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Prepare context for AI processing"""
        if not context:
            return {}
        
        recent_history = context.get("recent_history", [])
        
        # Limit context size
        if len(recent_history) > self.max_context_entries:
            recent_history = recent_history[:self.max_context_entries]
        
        # Convert to more AI-friendly format
        processed_history = []
        for entry in recent_history:
            if isinstance(entry, dict):
                processed_entry = {
                    "url": entry.get("url", ""),
                    "title": entry.get("title", ""),
                    "visit_time": entry.get("visit_time", ""),
                    "domain": entry.get("metadata", {}).get("domain", "") if entry.get("metadata") else ""
                }
                processed_history.append(processed_entry)
        
        return {
            "recent_history": processed_history,
            "analytics": context.get("analytics", {}),
            "user_preferences": context.get("user_preferences", {})
        }
    
    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Build system prompt with browsing history context"""
        prompt = """You are Hopscotch, an AI assistant that helps users understand and interact with their browsing history. You have access to their recent browsing data and can provide insights, answer questions, and make suggestions based on their web activity.

Guidelines:
- Be helpful and insightful about their browsing patterns
- Respect privacy and don't share specific URLs unless relevant
- Provide actionable insights and suggestions
- Be conversational and friendly
- Focus on patterns, trends, and useful information

"""
        
        recent_history = context.get("recent_history", [])
        if recent_history:
            prompt += f"Recent browsing history ({len(recent_history)} entries):\n"
            for entry in recent_history[:10]:  # Show first 10 entries
                prompt += f"- {entry.get('title', 'Untitled')} ({entry.get('domain', 'unknown domain')})\n"
            
            if len(recent_history) > 10:
                prompt += f"... and {len(recent_history) - 10} more entries\n"
        
        analytics = context.get("analytics", {})
        if analytics:
            prompt += f"\nAnalytics:\n"
            if "most_visited_domains" in analytics:
                prompt += f"- Most visited domains: {list(analytics['most_visited_domains'].keys())[:5]}\n"
            if "browser_distribution" in analytics:
                prompt += f"- Browser usage: {analytics['browser_distribution']}\n"
        
        return prompt
    
    def _extract_sources(self, content: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract sources from AI response and context"""
        sources = []
        
        # Add relevant history entries as sources
        recent_history = context.get("recent_history", [])
        for entry in recent_history[:5]:  # Top 5 most relevant
            if entry.get("url"):
                sources.append({
                    "type": "browsing_history",
                    "url": entry["url"],
                    "title": entry.get("title", ""),
                    "domain": entry.get("domain", "")
                })
        
        return sources
    
    async def _test_connection(self):
        """Test OpenAI API connection"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            print("[AIAgent] OpenAI connection test successful")
        except Exception as e:
            print(f"[AIAgent] OpenAI connection test failed: {e}")
            raise
    
    def is_ready(self) -> bool:
        """Check if agent is ready"""
        return self.ready
    
    async def shutdown(self):
        """Shutdown the AI agent"""
        print("[AIAgent] Shutting down AI agent...")
        self.ready = False
        print("[AIAgent] AI agent shutdown complete")
