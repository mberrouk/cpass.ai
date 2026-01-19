"""
URL configuration for TVET Dashboard API.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path("auth/login", views.login, name="login"),
    # Institution
    path("tvet/institution", views.get_current_institution, name="current-institution"),
    path("tvet/dashboard-stats", views.get_dashboard_stats, name="dashboard-stats"),
    # RPL Candidates
    path("tvet/rpl-candidates", views.get_rpl_candidates, name="rpl-candidates"),
    path(
        "tvet/rpl-candidates/<uuid:candidate_id>",
        views.get_rpl_candidate_detail,
        name="rpl-candidate-detail",
    ),
    path(
        "tvet/rpl-candidates/<uuid:candidate_id>/contact",
        views.log_candidate_contact,
        name="log-contact",
    ),
    path(
        "tvet/rpl-candidates/<uuid:candidate_id>/status",
        views.update_candidate_status,
        name="update-status",
    ),
    # Bulk Upload
    path("tvet/upload/batch", views.create_upload_batch, name="create-batch"),
    path("tvet/upload/parse-csv", views.parse_csv_file, name="parse-csv"),
    path("tvet/upload/process", views.process_bulk_upload, name="process-upload"),
    path("tvet/upload/batches", views.get_upload_batches, name="get-batches"),
    path(
        "tvet/upload/batches/<str:batch_id>",
        views.delete_upload_batch,
        name="delete-batch",
    ),
    # Analytics
    path("tvet/analytics", views.get_analytics, name="analytics"),
]
