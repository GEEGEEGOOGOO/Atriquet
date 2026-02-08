"""
Clothing Image Service - Fetches real clothing images from the web.
Uses duckduckgo_search library for actual image results with Bing scrape fallback.
No API keys required.
"""

import asyncio
import logging
import urllib.parse
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)


class ClothingImageService:
    """
    Fetches real clothing product images from the web using DuckDuckGo Image Search.
    No API keys required.
    """

    def __init__(self):
        self._cache: Dict[str, Optional[str]] = {}

    def _build_query(self, description: str, category: str) -> str:
        """Build a targeted search query for a clothing item with fashion-specific keywords."""
        # Remove common filler words
        filler = {"a", "an", "the", "or", "with", "for", "e.g.", "etc", "and", "of", "in", "very"}
        words = [w.strip("*-•") for w in description.split() if w.lower().strip("*-•") not in filler]
        base = " ".join(words)
        
        # Add category-specific fashion search terms
        suffix_map = {
            "top": "fashion clothing online shop product image",
            "bottom": "pants trousers fashion clothing online shop product image",
            "shoes": "footwear fashion online shop product image",
        }
        suffix = suffix_map.get(category, "fashion clothing online shop product image")
        
        # Build final query with brand/shopping focus
        query = f"{base} {suffix} buy"
        return query

    # ------------------------------------------------------------------ #
    #  Primary: duckduckgo_search library (real image results, no API key)
    # ------------------------------------------------------------------ #
    async def _search_ddg_images(self, query: str) -> Optional[str]:
        """Search DuckDuckGo Images using the duckduckgo_search library."""
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                from duckduckgo_search import DDGS

            def _sync_search():
                with DDGS() as ddgs:
                    results = list(ddgs.images(
                        keywords=query,
                        max_results=15,  # Get more results to filter better
                        safesearch="moderate",
                    ))
                    return results

            # Run synchronous library in a thread so we don't block the event loop
            results = await asyncio.to_thread(_sync_search)

            if results:
                # Prioritize images from shopping / fashion sites
                tier1_sites = ["amazon", "nordstrom", "zara", "hm.com", "uniqlo", 
                              "asos", "macys", "nike", "adidas", "forever21", "gap",
                              "oldnavy", "target", "walmart"]
                tier2_sites = ["myntra", "flipkart", "ajio", "shopify", "etsy",
                              "zalando", "boohoo", "prettylittlething", "shein"]
                
                # First try tier 1 sites
                for r in results:
                    url = r.get("image", "")
                    source = r.get("source", "").lower()
                    if any(site in url.lower() or site in source for site in tier1_sites):
                        logger.info(f"DDG tier1 image: {url[:80]}")
                        return url
                
                # Then try tier 2 sites
                for r in results:
                    url = r.get("image", "")
                    source = r.get("source", "").lower()
                    if any(site in url.lower() or site in source for site in tier2_sites):
                        logger.info(f"DDG tier2 image: {url[:80]}")
                        return url

                # Fallback to first result if it looks like a product image
                for r in results:
                    url = r.get("image", "")
                    # Filter out obvious non-product images
                    bad_indicators = ["pinterest", "youtube", "instagram", "facebook", 
                                     "twitter", "reddit", "tumblr", "blog"]
                    if url and not any(bad in url.lower() for bad in bad_indicators):
                        logger.info(f"DDG filtered image: {url[:80]}")
                        return url

        except ImportError:
            logger.warning("duckduckgo_search not installed – pip install duckduckgo_search")
        except Exception as e:
            logger.warning(f"DDG image search failed for '{query}': {e}")

        return None

    # ------------------------------------------------------------------ #
    #  Fallback: Bing image scrape (no API key)
    # ------------------------------------------------------------------ #
    async def _search_bing_scrape(self, query: str) -> Optional[str]:
        """Scrape Bing Images for a result (no API key needed) with shopping filter."""
        import httpx, re as _re
        try:
            encoded = urllib.parse.quote_plus(query)
            # Add shopping filter to Bing search
            url = f"https://www.bing.com/images/search?q={encoded}&qft=+filterui:photo-photo+filterui:imagesize-large&first=1"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    matches = _re.findall(r'murl&quot;:&quot;(https?://[^&]+?)&quot;', resp.text)
                    
                    if matches:
                        # Filter out non-shopping sites
                        bad_indicators = ["pinterest", "youtube", "instagram", "facebook", 
                                         "twitter", "reddit", "tumblr"]
                        
                        for match in matches[:10]:  # Check first 10 results
                            if not any(bad in match.lower() for bad in bad_indicators):
                                logger.info(f"Bing scrape image: {match[:80]}")
                                return match
                        
                        # If all have bad indicators, return first one anyway
                        if matches:
                            logger.info(f"Bing scrape (fallback) image: {matches[0][:80]}")
                            return matches[0]
                            
        except Exception as e:
            logger.warning(f"Bing scrape failed for '{query}': {e}")
        return None

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #
    async def search_clothing_image(
        self,
        item_description: str,
        category: str = "clothing",
    ) -> Optional[str]:
        """Search for a single clothing item image. Returns URL or None."""
        query = self._build_query(item_description, category)

        if query in self._cache:
            return self._cache[query]

        # Try DDG images first (most reliable, no key)
        url = await self._search_ddg_images(query)

        # Fallback to Bing scrape
        if not url:
            url = await self._search_bing_scrape(query)

        self._cache[query] = url
        return url

    async def get_outfit_images(
        self,
        top: str,
        bottom: str,
        shoes: str,
        accessories: List[str] = None,
    ) -> Dict[str, Optional[str]]:
        """
        Fetch images for a complete outfit concurrently.
        Returns dict: top_image_url, bottom_image_url, shoes_image_url
        """
        logger.info(f"Fetching outfit images – top='{top[:40]}', bottom='{bottom[:40]}', shoes='{shoes[:40]}'")

        tasks = [
            self.search_clothing_image(top, "top"),
            self.search_clothing_image(bottom, "bottom"),
            self.search_clothing_image(shoes, "shoes"),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        outfit = {
            "top_image_url": results[0] if not isinstance(results[0], (Exception, type(None))) else None,
            "bottom_image_url": results[1] if not isinstance(results[1], (Exception, type(None))) else None,
            "shoes_image_url": results[2] if not isinstance(results[2], (Exception, type(None))) else None,
        }

        for key, val in outfit.items():
            if val:
                logger.info(f"  ✓ {key}: {val[:60]}...")
            else:
                logger.warning(f"  ✗ {key}: no image found")

        return outfit
