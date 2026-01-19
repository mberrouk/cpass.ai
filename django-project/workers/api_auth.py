"""
API Key Authentication for CPASS Public API.
External applications authenticate using API keys passed in the X-API-Key header.
"""

import hashlib
from rest_framework import authentication, exceptions
from .tvet_models import TVETInstitution


class APIKeyAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for external API consumers.
    """

    # TODO: This is a basic implementation, used for tvet institutions only.
    # In future, consider more robust API key management.

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
