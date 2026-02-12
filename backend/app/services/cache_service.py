"""
Simple caching service to improve performance
"""
import time
import hashlib
from typing import Any, Optional
from functools import wraps
import json

class SimpleCache:
    """Thread-safe simple cache with TTL support."""
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default
        self.cache = {}
        self.default_ttl = default_ttl
    
    def _is_expired(self, entry: dict) -> bool:
        """Check if cache entry is expired."""
        return time.time() > entry['expires']
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key in self.cache:
            entry = self.cache[key]
            if not self._is_expired(entry):
                return entry['value']
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with optional TTL."""
        if ttl is None:
            ttl = self.default_ttl
        
        self.cache[key] = {
            'value': value,
            'expires': time.time() + ttl
        }
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
    
    def cleanup_expired(self) -> None:
        """Remove expired entries."""
        now = time.time()
        expired_keys = [
            key for key, entry in self.cache.items() 
            if now > entry['expires']
        ]
        for key in expired_keys:
            del self.cache[key]

# Global cache instance
cache = SimpleCache()

def cache_result(ttl: int = 300, key_prefix: str = ""):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key_data = {
                'func': func.__name__,
                'args': args,
                'kwargs': kwargs
            }
            key_hash = hashlib.md5(
                json.dumps(key_data, sort_keys=True, default=str).encode()
            ).hexdigest()
            cache_key = f"{key_prefix}:{key_hash}" if key_prefix else key_hash
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator