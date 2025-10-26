"""
Search Navigator Service
Implements Midjourney-style 4-tile navigation with coarse-to-fine discovery.
"""
import asyncio
import json
import time
import uuid
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

import aiohttp
from openai import OpenAI

try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

from app.models.search import (
    ActionType,
    Candidate,
    NavigateRequest,
    NavigateResponse,
    NavigationSession,
    SearchTile,
    SessionKnobs,
)
from app.models.history import HistoryEntry
from app.core.config import settings


# Session storage (in-memory for MVP, move to Redis later)
_sessions: Dict[str, NavigationSession] = {}
_session_ttl = timedelta(minutes=30)

# Hop schedule for diversity and novelty knobs
HOP_SCHEDULES = {
    "diversity": [0.7, 0.6, 0.5, 0.4],  # Decreases over hops
    "novelty": [0.6, 0.5, 0.35, 0.25],   # Decreases over hops
}

# Action multipliers for knobs
ACTION_KNOB_ADJUSTMENTS = {
    ActionType.INITIAL: {"diversity": 1.0, "novelty": 1.0, "radius": 1.0},
    ActionType.PICK: {"diversity": 0.8, "novelty": 0.8, "radius": 0.7},
    ActionType.VARY_SMALL: {"diversity": 0.5, "novelty": 0.5, "radius": 0.5},
    ActionType.VARY_LARGE: {"diversity": 1.2, "novelty": 1.3, "radius": 1.8},
    ActionType.REROLL: {"diversity": 1.0, "novelty": 1.1, "radius": 1.0},
}


class SearchNavigator:
    """Handles search navigation with 4-tile discovery."""

    def __init__(self, openai_client: OpenAI = None, tavily_client = None, history_storage = None):
        """Initialize search navigator with dependencies."""
        self.openai_client = openai_client
        self.tavily_client = tavily_client
        self.history_storage = history_storage
        self.model = settings.AI_MODEL

    async def navigate(
        self, request: NavigateRequest, user_history: Optional[List[HistoryEntry]] = None
    ) -> NavigateResponse:
        """
        Main navigation method. Returns 4 diverse tiles based on action type.

        Performance target: <10 seconds total
        """
        timing = {}
        start_time = time.time()

        # Get or create session
        session = await self._get_or_create_session(request)

        # Adjust knobs based on action type
        self._adjust_knobs(session, request.action)

        # Generate candidates (parallel: web search + history query)
        candidates_start = time.time()
        candidates = await self._generate_candidates(request, session, user_history)
        timing["candidate_generation"] = time.time() - candidates_start

        if not candidates:
            # Fallback: return empty tiles with helpful message
            return self._create_empty_response(session, timing, "No results found. Try a different query.")

        # Rule-based scoring to filter to top 10
        scoring_start = time.time()
        top_candidates = await self._score_and_filter(candidates, request, session, user_history)
        timing["scoring"] = time.time() - scoring_start

        # LLM selection of 4 diverse tiles
        selection_start = time.time()
        selected_tiles = await self._llm_select_diverse(
            top_candidates, request, session
        )
        timing["llm_selection"] = time.time() - selection_start

        # Update session state
        session.hop += 1
        session.shown_tiles.extend(selected_tiles)
        session.shown_domains.update(tile.domain for tile in selected_tiles)
        session.last_updated = datetime.utcnow()

        # If user picked a tile, add to selections
        if request.action == ActionType.PICK and request.selected_index is not None:
            if session.hop > 1 and session.shown_tiles:
                # Find the tile that was picked from the previous hop's tiles
                prev_tiles = session.shown_tiles[-(len(selected_tiles) + 4):-len(selected_tiles)]
                if 0 <= request.selected_index < len(prev_tiles):
                    session.selections.append(prev_tiles[request.selected_index])

        timing["total"] = time.time() - start_time

        return NavigateResponse(
            tiles=selected_tiles,
            session_id=session.session_id,
            hop=session.hop,
            debug_timing=timing,
            suggested_action=self._suggest_next_action(session)
        )

    async def _generate_candidates(
        self, request: NavigateRequest, session: NavigationSession, user_history: Optional[List[HistoryEntry]]
    ) -> List[Candidate]:
        """
        Generate candidate results using web search + history boost.
        Runs web search and history query in parallel.
        Target: 1-2 seconds.
        """
        # Build search query based on action type
        search_query = self._build_search_query(request, session)

        # Parallel execution: web search + history domain extraction
        results = await asyncio.gather(
            self._web_search(search_query, max_results=30),
            self._get_history_domains(user_history),
            return_exceptions=True
        )

        web_results = results[0] if not isinstance(results[0], Exception) else []
        history_domains = results[1] if not isinstance(results[1], Exception) else set()

        # Convert web results to candidates
        candidates = []
        images_found = 0

        # Debug: Print first result to see structure
        if web_results:
            print(f"[SearchNavigator] Sample result keys: {web_results[0].keys()}")
            print(f"[SearchNavigator] Sample result: {web_results[0]}")

        for result in web_results:
            try:
                # Extract image URL if available (try multiple fields Tavily might use)
                image_url = (
                    result.get("image") or
                    result.get("image_url") or
                    result.get("thumbnail") or
                    result.get("img")
                )

                if image_url:
                    images_found += 1
                    print(f"[SearchNavigator] Found image for {result.get('title', 'Unknown')[:40]}: {image_url[:60]}")

                candidates.append(
                    Candidate(
                        url=result.get("url", ""),
                        title=result.get("title", "Untitled"),
                        content=result.get("content", ""),
                        image_url=image_url,
                        score=0.0,
                        score_breakdown={}
                    )
                )
            except Exception as e:
                print(f"[SearchNavigator] Error parsing result: {e}")
                continue

        print(f"[SearchNavigator] Generated {len(candidates)} candidates, {images_found} with images")

        # Fetch images for candidates without them (async, in parallel)
        if images_found < len(candidates):
            print(f"[SearchNavigator] Fetching images for {len(candidates) - images_found} candidates without images...")
            candidates = await self._enrich_with_images(candidates)

        return candidates

    async def _enrich_with_images(self, candidates: List[Candidate]) -> List[Candidate]:
        """Fetch Open Graph images for candidates that don't have images."""
        tasks = []
        indices_to_fetch = []

        for i, candidate in enumerate(candidates):
            if not candidate.image_url and candidate.url:
                tasks.append(self._extract_og_image(candidate.url))
                indices_to_fetch.append(i)

        if not tasks:
            return candidates

        # Fetch all images in parallel
        images = await asyncio.gather(*tasks, return_exceptions=True)

        # Update candidates with fetched images
        enriched_count = 0
        for idx, image_url in zip(indices_to_fetch, images):
            if isinstance(image_url, str) and image_url:
                candidates[idx].image_url = image_url
                enriched_count += 1

        print(f"[SearchNavigator] Enriched {enriched_count} candidates with fetched images")
        return candidates

    async def _extract_og_image(self, url: str, timeout: int = 3) -> Optional[str]:
        """Extract Open Graph image from a URL."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    timeout=aiohttp.ClientTimeout(total=timeout),
                    headers={
                        'User-Agent': 'Mozilla/5.0 (compatible; HopscotchBot/1.0)'
                    }
                ) as response:
                    if response.status != 200:
                        return None

                    html = await response.text()

                    # Extract og:image meta tag
                    og_image_match = re.search(
                        r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
                        html,
                        re.IGNORECASE
                    )
                    if og_image_match:
                        return og_image_match.group(1)

                    # Try reverse order (content before property)
                    og_image_match = re.search(
                        r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:image["\']',
                        html,
                        re.IGNORECASE
                    )
                    if og_image_match:
                        return og_image_match.group(1)

                    # Fallback: twitter:image
                    twitter_image_match = re.search(
                        r'<meta\s+(?:name|property)=["\']twitter:image["\']\s+content=["\']([^"\']+)["\']',
                        html,
                        re.IGNORECASE
                    )
                    if twitter_image_match:
                        return twitter_image_match.group(1)

                    return None

        except asyncio.TimeoutError:
            print(f"[SearchNavigator] Timeout fetching image for {url[:50]}")
            return None
        except Exception as e:
            print(f"[SearchNavigator] Error extracting image from {url[:50]}: {e}")
            return None

    def _build_search_query(self, request: NavigateRequest, session: NavigationSession) -> str:
        """Build search query based on action type and context."""
        base_query = request.query

        # Detect if this is a product/shopping query
        is_product_query = self._is_product_query(base_query)

        if request.action == ActionType.INITIAL:
            # For product queries, add shopping modifiers to bias toward products
            if is_product_query:
                # Add "shop" or "buy" to prioritize shopping results
                return f"{base_query} shop buy"
            return base_query

        # Get the previously selected tile if applicable
        selected_tile = None
        if request.selected_index is not None and session.shown_tiles:
            # Get tiles from previous hop (last 4 tiles shown)
            prev_tiles = session.shown_tiles[-4:] if len(session.shown_tiles) >= 4 else session.shown_tiles
            if 0 <= request.selected_index < len(prev_tiles):
                selected_tile = prev_tiles[request.selected_index]

        if request.action == ActionType.PICK and selected_tile:
            # Narrow search around selected tile's topic
            query = f"{base_query} similar to {selected_tile.domain}"
            if is_product_query:
                query += " buy"
            return query

        elif request.action == ActionType.VARY_SMALL and selected_tile:
            # Very focused search on similar content
            domain = selected_tile.domain
            if is_product_query:
                return f"{base_query} shop site:{domain}"
            return f"site:{domain} OR related:{base_query}"

        elif request.action == ActionType.VARY_LARGE and selected_tile:
            # Broader search for alternatives
            query = f"{base_query} alternatives different from {selected_tile.domain}"
            if is_product_query:
                query += " shop"
            return query

        elif request.action == ActionType.REROLL:
            # Same breadth, but exclude shown domains
            excluded = " ".join([f"-site:{domain}" for domain in list(session.shown_domains)[:5]])
            query = f"{base_query} {excluded}"
            if is_product_query:
                query += " buy shop"
            return query

        return base_query

    def _is_product_query(self, query: str) -> bool:
        """Detect if query is looking for products/items to buy."""
        product_keywords = [
            'dress', 'shirt', 'shoes', 'pants', 'jacket', 'coat', 'bag', 'watch',
            'phone', 'laptop', 'camera', 'headphones', 'furniture', 'chair', 'table',
            'hotel', 'restaurant', 'car', 'bike', 'buy', 'shop', 'purchase', 'looking for'
        ]
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in product_keywords)

    async def _web_search(self, query: str, max_results: int = 30) -> List[Dict]:
        """Perform web search using Tavily."""
        if not self.tavily_client:
            print("[SearchNavigator] Tavily client not available, returning empty results")
            return []

        try:
            print(f"[SearchNavigator] Searching web for: {query}")
            # Run sync Tavily call in thread pool
            # Include images in search results
            search_result = await asyncio.to_thread(
                self.tavily_client.search,
                query=query,
                max_results=max_results,
                include_images=True  # Request images from Tavily
            )
            results = search_result.get("results", [])
            print(f"[SearchNavigator] Found {len(results)} web results")
            return results
        except Exception as e:
            print(f"[SearchNavigator] Web search error: {e}")
            return []

    async def _get_history_domains(self, user_history: Optional[List[HistoryEntry]]) -> set:
        """Extract domains from user's browsing history for boosting."""
        if not user_history:
            return set()

        domains = set()
        for entry in user_history:
            try:
                if isinstance(entry, dict):
                    metadata = entry.get("metadata", {})
                    if isinstance(metadata, dict):
                        domain = metadata.get("domain", "")
                    else:
                        # Parse from URL if metadata is not a dict
                        url = entry.get("url", "")
                        domain = urlparse(url).netloc if url else ""
                elif hasattr(entry, "metadata") and isinstance(entry.metadata, dict):
                    domain = entry.metadata.get("domain", "")
                elif hasattr(entry, "url"):
                    domain = urlparse(entry.url).netloc
                else:
                    domain = ""

                if domain:
                    domains.add(domain)
            except Exception as e:
                print(f"[SearchNavigator] Error extracting domain: {e}")
                continue

        print(f"[SearchNavigator] Extracted {len(domains)} unique domains from history")
        return domains

    async def _score_and_filter(
        self,
        candidates: List[Candidate],
        request: NavigateRequest,
        session: NavigationSession,
        user_history: Optional[List[HistoryEntry]],
        top_k: int = 10
    ) -> List[Candidate]:
        """
        Score candidates using rule-based scoring and filter to top K.
        Target: <0.1 seconds.
        """
        # Get history domains for boosting
        history_domains = await self._get_history_domains(user_history)

        # Detect if product query
        is_product_query = self._is_product_query(request.query)

        # Score each candidate
        for candidate in candidates:
            domain = urlparse(candidate.url).netloc
            score_parts = {}

            # Domain boost: +2 if in history
            if domain in history_domains:
                score_parts["domain_boost"] = 2.0
            else:
                score_parts["domain_boost"] = 0.0

            # Diversity boost: +1 if not shown yet
            if domain not in session.shown_domains:
                score_parts["diversity"] = 1.0
            else:
                score_parts["diversity"] = -1.0  # Penalize repeats

            # Keyword match: +0.5 per query word in title
            query_words = request.query.lower().split()
            title_lower = candidate.title.lower()
            keyword_matches = sum(1 for word in query_words if word in title_lower)
            score_parts["keyword_match"] = keyword_matches * 0.5

            # Product page detection for product queries
            if is_product_query:
                product_score = self._calculate_product_score(candidate.url, candidate.title, candidate.content)
                score_parts["product_relevance"] = product_score

            # Calculate total score
            candidate.score = sum(score_parts.values())
            candidate.score_breakdown = score_parts

        # Sort by score and take top K
        candidates.sort(key=lambda c: c.score, reverse=True)
        top_candidates = candidates[:top_k]

        # Debug logging for product queries
        if is_product_query:
            print(f"[SearchNavigator] Product query detected. Top candidates:")
            for i, cand in enumerate(top_candidates[:5]):
                domain = urlparse(cand.url).netloc
                print(f"  {i+1}. [{domain}] score={cand.score:.1f} {cand.score_breakdown}")

        print(f"[SearchNavigator] Filtered to top {len(top_candidates)} candidates")
        return top_candidates

    def _calculate_product_score(self, url: str, title: str, content: str) -> float:
        """
        Calculate how likely this is an actual product/item page vs discussion.
        Returns score from -5.0 (definitely discussion) to +3.0 (definitely product).
        """
        score = 0.0
        url_lower = url.lower()
        title_lower = title.lower()
        content_lower = content.lower()
        combined = f"{url_lower} {title_lower} {content_lower}"

        # URL structure patterns for product pages (+2.0)
        product_url_patterns = [
            '/product/', '/p/', '/item/', '/dp/', '/pd/',
            '/products/', '/shop/', '/buy/', '/store/',
            '-p-', '_p_', '/i/', '/listing/'
        ]
        if any(pattern in url_lower for pattern in product_url_patterns):
            score += 2.0

        # Commercial indicators in content (+1.5)
        commercial_indicators = [
            '$', '€', '£', '¥', 'price', 'buy', 'purchase',
            'add to cart', 'add to bag', 'in stock', 'out of stock',
            'free shipping', 'delivery', 'size', 'color', 'colour'
        ]
        commercial_count = sum(1 for indicator in commercial_indicators if indicator in combined)
        score += min(1.5, commercial_count * 0.3)

        # Discussion/social patterns (-5.0)
        discussion_patterns = [
            'reddit.com', 'quora.com', 'stackexchange', 'stackoverflow',
            '/comments/', '/discussion/', '/forum/', '/thread/',
            'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
            'youtube.com', 'vimeo.com', 'pinterest.com',
            'wikipedia.org', 'wikihow.com', 'imdb.com',
            '/r/', '/u/', 'subreddit', 'upvote', 'comment',
            'tv series', 'full cast', 'crew', 'episode'
        ]
        if any(pattern in combined for pattern in discussion_patterns):
            score -= 5.0

        # Blog/article patterns (-2.0)
        blog_patterns = [
            '/blog/', '/article/', '/post/', '/news/',
            'how to', 'tips for', 'guide to', 'ways to',
            'best of', 'top 10', 'listicle'
        ]
        if any(pattern in combined for pattern in blog_patterns):
            score -= 2.0

        # Domain structure hints
        # Shopping domains often have "shop", "store", "buy" in them (+1.0)
        domain = urlparse(url).netloc
        if any(word in domain for word in ['shop', 'store', 'buy', 'boutique', 'market', 'mall']):
            score += 1.0

        return score

    async def _llm_select_diverse(
        self,
        candidates: List[Candidate],
        request: NavigateRequest,
        session: NavigationSession
    ) -> List[SearchTile]:
        """
        Use LLM to select 4 diverse results from top candidates.
        Target: 2-3 seconds.
        """
        if not self.openai_client:
            print("[SearchNavigator] OpenAI client not available, using fallback selection")
            return self._fallback_select(candidates)

        # Build prompt for LLM
        prompt = self._build_selection_prompt(candidates, request, session)

        try:
            # Call OpenAI to select 4 indices
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a search result curator. Select 4 diverse, high-quality results."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )

            content = response.choices[0].message.content
            print(f"[SearchNavigator] LLM selection response: {content}")

            # Parse indices from response
            indices = self._parse_indices(content, len(candidates))

            # Convert selected candidates to tiles
            selected_tiles = []
            for idx in indices[:4]:  # Ensure exactly 4
                if 0 <= idx < len(candidates):
                    tile = candidates[idx].to_tile()
                    selected_tiles.append(tile)

            # Pad with fallback if needed
            while len(selected_tiles) < 4:
                idx = len(selected_tiles)
                if idx < len(candidates):
                    selected_tiles.append(candidates[idx].to_tile())
                else:
                    # No more candidates, create placeholder
                    selected_tiles.append(self._create_placeholder_tile(request.query))

            print(f"[SearchNavigator] Selected {len(selected_tiles)} tiles")
            return selected_tiles[:4]

        except Exception as e:
            print(f"[SearchNavigator] LLM selection error: {e}, using fallback")
            return self._fallback_select(candidates)

    def _build_selection_prompt(
        self, candidates: List[Candidate], request: NavigateRequest, session: NavigationSession
    ) -> str:
        """Build prompt for LLM to select diverse results."""
        is_product_query = self._is_product_query(request.query)

        candidates_text = ""
        for i, cand in enumerate(candidates):
            domain = urlparse(cand.url).netloc
            # Include URL structure to help LLM identify product pages
            url_snippet = cand.url.split('/')[-2:] if '/' in cand.url else []
            url_hint = '/'.join(url_snippet) if url_snippet else domain
            candidates_text += f"{i}. [{domain}/{url_hint}] {cand.title}\n   {cand.content[:120]}...\n\n"

        hop_context = f"This is hop {session.hop}. "
        if session.hop == 0:
            hop_context += "Provide broad, diverse starting points."
        elif session.hop == 1:
            hop_context += "Narrow down while maintaining some variety."
        elif session.hop >= 2:
            hop_context += "Focus on high-quality, specific results."

        diversity_level = session.knobs.diversity
        diversity_hint = "very diverse" if diversity_level > 0.6 else "somewhat diverse" if diversity_level > 0.4 else "focused"

        # Add product-specific instructions if needed
        product_instruction = ""
        if is_product_query:
            product_instruction = """
IMPORTANT: User is looking for actual items/products to consider, NOT discussion forums, reviews, or how-to articles.
Prioritize results that are actual product pages (URLs with /product/, /p/, /item/, prices mentioned, shopping sites).
AVOID results from Reddit, Quora, forums, blogs, Wikipedia, YouTube, TikTok, or informational articles."""

        return f"""Query: "{request.query}"
{hop_context}
Diversity preference: {diversity_hint}{product_instruction}

Candidates:
{candidates_text}

Select exactly 4 indices (0-{len(candidates)-1}) that are {diversity_hint} and cover different aspects/domains.
Respond with ONLY a JSON array of 4 integers, like: [0, 2, 5, 7]"""

    def _parse_indices(self, llm_response: str, max_index: int) -> List[int]:
        """Parse indices from LLM response."""
        try:
            # Try to find JSON array in response
            import re
            match = re.search(r'\[[\d,\s]+\]', llm_response)
            if match:
                indices = json.loads(match.group())
                # Validate indices
                valid_indices = [i for i in indices if isinstance(i, int) and 0 <= i < max_index]
                return valid_indices[:4]
        except Exception as e:
            print(f"[SearchNavigator] Error parsing indices: {e}")

        # Fallback: return first 4 indices
        return list(range(min(4, max_index)))

    def _fallback_select(self, candidates: List[Candidate]) -> List[SearchTile]:
        """Fallback selection without LLM: pick top 4 by score."""
        tiles = []
        for i in range(min(4, len(candidates))):
            tiles.append(candidates[i].to_tile())

        # Pad with placeholders if needed
        while len(tiles) < 4:
            tiles.append(self._create_placeholder_tile("search"))

        return tiles

    def _create_placeholder_tile(self, query: str) -> SearchTile:
        """Create a placeholder tile when not enough results."""
        return SearchTile(
            url="",
            title="No more results",
            description=f"Try refining your search for '{query}'",
            domain="",
            image_url=None,
            score=0.0,
            score_breakdown={}
        )

    async def _get_or_create_session(self, request: NavigateRequest) -> NavigationSession:
        """Get existing session or create new one."""
        global _sessions

        # Clean up expired sessions
        now = datetime.utcnow()
        expired = [
            sid for sid, sess in _sessions.items()
            if now - sess.last_updated > _session_ttl
        ]
        for sid in expired:
            del _sessions[sid]

        # Get or create session
        if request.session_id and request.session_id in _sessions:
            session = _sessions[request.session_id]
            print(f"[SearchNavigator] Continuing session {session.session_id}, hop {session.hop}")
            return session
        else:
            session_id = str(uuid.uuid4())
            session = NavigationSession(
                session_id=session_id,
                query=request.query,
                hop=0,
                selections=[],
                shown_tiles=[],
                shown_domains=set(),
                knobs=SessionKnobs()
            )
            _sessions[session_id] = session
            print(f"[SearchNavigator] Created new session {session_id}")
            return session

    def _adjust_knobs(self, session: NavigationSession, action: ActionType):
        """Adjust session knobs based on hop and action."""
        # Get base values from hop schedule
        hop_idx = min(session.hop, len(HOP_SCHEDULES["diversity"]) - 1)
        base_diversity = HOP_SCHEDULES["diversity"][hop_idx]
        base_novelty = HOP_SCHEDULES["novelty"][hop_idx]

        # Apply action multipliers
        adjustments = ACTION_KNOB_ADJUSTMENTS.get(action, {"diversity": 1.0, "novelty": 1.0, "radius": 1.0})

        session.knobs.diversity = min(1.0, base_diversity * adjustments["diversity"])
        session.knobs.novelty = min(1.0, base_novelty * adjustments["novelty"])
        session.knobs.radius = adjustments["radius"]

        print(f"[SearchNavigator] Knobs adjusted for {action.value}: diversity={session.knobs.diversity:.2f}, novelty={session.knobs.novelty:.2f}, radius={session.knobs.radius:.2f}")

    def _suggest_next_action(self, session: NavigationSession) -> str:
        """Suggest what the user might want to do next."""
        if session.hop == 0:
            return "Click a tile to explore that direction, or try Vary Large for alternatives."
        elif session.hop == 1:
            return "Use Vary Small for similar results, or Vary Large for different angles."
        elif session.hop >= 2:
            return "You're getting close! Pick a tile to refine, or Reroll for fresh options."
        return "Keep exploring!"

    def _create_empty_response(
        self, session: NavigationSession, timing: Dict, message: str
    ) -> NavigateResponse:
        """Create response with no results."""
        empty_tiles = [self._create_placeholder_tile(session.query) for _ in range(4)]
        return NavigateResponse(
            tiles=empty_tiles,
            session_id=session.session_id,
            hop=session.hop,
            debug_timing=timing,
            suggested_action=message
        )
