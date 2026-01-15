"""
One-time authentication tokens for Telegram WebApp
"""

import secrets
import time
from typing import Optional
from django.core.cache import cache

TOKEN_EXPIRY = 300  # 5 minutes
TOKEN_PREFIX = "telegram_auth_token:"


def generate_auth_token(telegram_id: str, phone_number: Optional[str] = None) -> str:
    """
    """
    token = secrets.token_urlsafe(32)

    cache_key = f"{TOKEN_PREFIX}{token}"
    cache_data = {
        "telegram_id": telegram_id,
        "phone_number": phone_number,
        "created_at": int(time.time()),
    }

    cache.set(cache_key, cache_data, TOKEN_EXPIRY)

    return token


def validate_auth_token(token: str) -> Optional[dict]:
    """
    """
    cache_key = f"{TOKEN_PREFIX}{token}"
    cache_data = cache.get(cache_key)

    if not cache_data:
        return None

    cache.delete(cache_key)

    return cache_data


def cleanup_expired_tokens():
    """
    """
    pass
