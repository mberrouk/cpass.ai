"""
URL configuration for cpass_backend project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include("workers.urls")),
    path("api/tasks/", include("work_management.urls")),
    path("api/", include("cpass_integration.urls")),
    path(
        "",
        TemplateView.as_view(
            template_name="index.html", extra_context={"cpass_url": settings.CPASS_URL}
        ),
        name="webapp",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
