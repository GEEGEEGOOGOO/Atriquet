import json
import hashlib
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CacheManager:
    """In-memory cache manager for user analyses (can be extended to Redis)."""
    
    def __init__(self, ttl_minutes: int = 60):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def _generate_key(self, user_id: str, occasion: str, style: str) -> str:
        """Generate cache key from user_id and preferences."""
        data = f"{user_id}:{occasion}:{style}"
        return hashlib.md5(data.encode()).hexdigest()
    
    def get_cached_analysis(
        self,
        user_id: str,
        occasion: str,
        style: str
    ) -> Optional[Dict[str, Any]]:
        """Retrieve cached analysis if available and not expired."""
        try:
            cache_key = self._generate_key(user_id, occasion, style)
            
            if cache_key not in self._cache:
                logger.debug(f"Cache miss for key: {cache_key}")
                return None
            
            cached_data = self._cache[cache_key]
            cached_time = datetime.fromisoformat(cached_data["timestamp"])
            
            # Check if expired
            if datetime.now() - cached_time > self.ttl:
                logger.info(f"Cache expired for key: {cache_key}")
                del self._cache[cache_key]
                return None
            
            logger.info(f"Cache hit for key: {cache_key}")
            return cached_data["data"]
            
        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None
    
    def cache_analysis(
        self,
        user_id: str,
        occasion: str,
        style: str,
        data: Any
    ) -> bool:
        """Store analysis result in cache."""
        try:
            cache_key = self._generate_key(user_id, occasion, style)
            
            self._cache[cache_key] = {
                "data": data,
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"Cached data for key: {cache_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error caching data: {str(e)}")
            return False
    
    def clear_user_cache(self, user_id: str) -> bool:
        """Clear all cached data for a specific user."""
        try:
            keys_to_delete = [
                key for key in self._cache.keys()
                if key.startswith(hashlib.md5(user_id.encode()).hexdigest()[:8])
            ]
            
            for key in keys_to_delete:
                del self._cache[key]
            
            logger.info(f"Cleared {len(keys_to_delete)} cache entries for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing user cache: {str(e)}")
            return False
    
    def clear_all(self) -> bool:
        """Clear entire cache."""
        try:
            self._cache.clear()
            logger.info("Cleared all cache")
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "total_entries": len(self._cache),
            "ttl_minutes": self.ttl.total_seconds() / 60
        }
