"""
URLs for work management app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, JobCategoryViewSet, JobViewSet

router = DefaultRouter()
router.register(r"categories", JobCategoryViewSet, basename="category")
router.register(r"jobs", JobViewSet, basename="job")
router.register(r"", TaskViewSet, basename="task")

urlpatterns = [
    path("", include(router.urls)),
]
