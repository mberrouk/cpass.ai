"""
URL routes for CPASS integration APIs.
"""

from django.urls import path
from . import views, telegram_views

urlpatterns = [
    path("cpass/onboarding/", views.cpass_onboarding, name="cpass_onboarding"),
    path(
        "cpass/user/<int:telegram_id>/",
        views.get_user_by_telegram_id,
        name="cpass_get_user",
    ),
    path(
        "cpass/profile/<int:telegram_id>/",
        views.get_worker_profile,
        name="cpass_worker_profile",
    ),
    path(
        "cpass/skills/<int:telegram_id>/",
        views.save_worker_skills,
        name="cpass_save_skills",
    ),
    # Telegram Mini App endpoints
    path(
        "telegram/validate-webapp/",
        telegram_views.validate_webapp_data,
        name="telegram_validate_webapp",
    ),
    path("telegram/auth/", telegram_views.telegram_auth, name="telegram_auth"),
    path(
        "telegram/signup-status/",
        telegram_views.signup_status,
        name="telegram_signup_status",
    ),
    path(
        "telegram/generate-token/",
        telegram_views.generate_token,
        name="telegram_generate_token",
    ),
    path(
        "telegram/worker-profile/",
        telegram_views.get_or_create_worker_profile,
        name="telegram_worker_profile",
    ),
]
