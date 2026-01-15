"""
URL configuration matching Supabase API endpoints.
Includes Public API for external integrations (TVET institutions, partners).
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import api_views

router = DefaultRouter()
router.register(
    r"tvet-institutions", views.TVETInstitutionViewSet, basename="tvet-institution"
)
router.register(
    r"worker-profiles", views.WorkerProfileViewSet, basename="worker-profile"
)
router.register(r"worker-skills", views.WorkerSkillViewSet, basename="worker-skill")

urlpatterns = [
    # Authentication endpoints (internal CPASS users)
    path("auth/signup", views.signup, name="signup"),
    path("auth/signin", views.signin_with_password, name="signin"),
    path("auth/signin-otp", views.signin_with_otp, name="signin-otp"),
    path("auth/user", views.get_user, name="get-user"),
    path("auth/signout", views.signout, name="signout"),
    # TVET and Partnership login (internal staff)
    # path("auth/tvet-signin", views.tvet_signin, name="tvet-signin"),
    # path(
    #     "auth/partnership-signin", views.partnership_signin, name="partnership-signin"
    # ),
    # Telegram mini app endpoints
    path("register/", views.register_user, name="register"),
    path("workers/", views.list_workers, name="list-workers"),

    # for external applications authenticated via API Key (X-API-Key header)
    # path("public/workers/", api_views.list_affiliated_workers, name="public-workers"),
    # path(
    #     "public/workers/<uuid:worker_id>/",
    #     api_views.get_worker_detail,
    #     name="public-worker-detail",
    # ),
    # path(
    #     "public/workers/bulk/", api_views.bulk_create_workers, name="public-bulk-create"
    # ),
    # path("public/stats/", api_views.get_institution_stats, name="public-stats"),
    # path(
    #     "public/workers/<uuid:worker_id>/verify/",
    #     api_views.verify_worker_affiliation,
    #     name="public-verify-worker",
    # ),

    # REST endpoints
    path("", include(router.urls)),
]
