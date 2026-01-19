from django.contrib import admin
from .models import Institution, StaffUser, UploadBatch, CandidateNote, ContactLog, CandidateAssessment


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ['institution_name', 'institution_code', 'location', 'cpass_api_active']
    search_fields = ['institution_name', 'institution_code']
    list_filter = ['cpass_api_active', 'institution_type']


@admin.register(StaffUser)
class StaffUserAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'institution', 'role', 'is_active']
    search_fields = ['email', 'full_name']
    list_filter = ['role', 'is_active', 'institution']


@admin.register(UploadBatch)
class UploadBatchAdmin(admin.ModelAdmin):
    list_display = ['batch_id', 'institution', 'source_file_name', 'worker_count', 'status', 'created_at']
    search_fields = ['batch_id', 'source_file_name']
    list_filter = ['status', 'upload_mode', 'institution']


@admin.register(CandidateAssessment)
class CandidateAssessmentAdmin(admin.ModelAdmin):
    list_display = ['worker_name', 'institution', 'assessment_status', 'certification_match', 'worker_tier']
    search_fields = ['worker_name', 'worker_phone']
    list_filter = ['assessment_status', 'worker_tier', 'institution']


@admin.register(ContactLog)
class ContactLogAdmin(admin.ModelAdmin):
    list_display = ['worker_id', 'contact_method', 'contacted_by', 'created_at']
    list_filter = ['contact_method', 'institution']


@admin.register(CandidateNote)
class CandidateNoteAdmin(admin.ModelAdmin):
    list_display = ['worker_id', 'created_by', 'created_at']
    list_filter = ['institution']
