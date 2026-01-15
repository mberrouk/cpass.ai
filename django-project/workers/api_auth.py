"""
API Key Authentication for CPASS Public API.

TVET institutions and other external applications authenticate
using API keys passed in the X-API-Key header.

API Key Format: tvet_INSTITUTIONCODE_randomtoken
Example: tvet_KIAMBU001_a1b2c3d4e5f6...
"""

import hashlib
from rest_framework import authentication, exceptions
from .models import TVETInstitution


class APIKeyAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for external API consumers.
    """

    def authenticate(self, request):
        api_key = request.META.get("HTTP_X_API_KEY")

        if not api_key:
            return None
        try:
            parts = api_key.split("_", 2)
            if len(parts) != 3 or parts[0] != "tvet":
                raise exceptions.AuthenticationFailed("Invalid API key format")

            institution_code = parts[1]
        except Exception:
            raise exceptions.AuthenticationFailed("Invalid API key format")


        try:
            institution = TVETInstitution.objects.get(
                institution_code=institution_code, is_api_active=True
            )
        except TVETInstitution.DoesNotExist:
            raise exceptions.AuthenticationFailed(
                "Invalid API key or institution not found"
            )


        if not institution.verify_api_key(api_key):
            raise exceptions.AuthenticationFailed("Invalid API key")

        return (None, institution)

    def authenticate_header(self, request):

        return "API-Key"


class IsAPIAuthenticated:

    def has_permission(self, request, view):
        return request.auth is not None and isinstance(request.auth, TVETInstitution)
