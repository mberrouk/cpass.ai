"""
Utility functions for workers app.
"""

from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is not None:
        error_data = {"error": {"message": str(exc), "status": response.status_code}}
        return Response(error_data, status=response.status_code)

    return response


def is_skill_verified(skill):
    return skill.get("skill_verification_tier") in ["silver", "gold", "platinum"]
