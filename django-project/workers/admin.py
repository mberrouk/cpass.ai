"""
Django admin configuration for workers app.
"""

from django.contrib import admin
from .models import (
    CustomUser,
    WorkerProfile,
    WorkerSkill,
    WorkerCertification,
    WorkerDomain,
    TVETInstitution,
    TVETAuth,
)


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = [
        "email",
        "full_name",
        "phone_number",
        "user_type",
        "created_at",
        "telegram_id",
    ]
    search_fields = ["email", "full_name", "phone_number", "telegram_id"]
    list_filter = ["user_type", "is_active", "telegram_id"]
    readonly_fields = ["id", "created_at", "updated_at"]


class WorkerSkillInline(admin.TabularInline):
    model = WorkerSkill
    extra = 0
    fields = [
        "skill_name",
        "proficiency_level",
        "proficiency_rating",
        "skill_verification_tier",
    ]


class WorkerCertificationInline(admin.TabularInline):
    model = WorkerCertification
    extra = 0


class WorkerDomainInline(admin.TabularInline):
    model = WorkerDomain
    extra = 0


@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "phone_number",
        "tier",
        "trust_score",
        "total_skills",
        "upload_source",
        "email",
        "claimed_institution",
        "verification_status",
    ]
    search_fields = ["full_name", "phone_number", "email"]
    list_filter = ["tier", "work_status", "upload_source", "verification_status", "claimed_institution"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [WorkerSkillInline, WorkerCertificationInline, WorkerDomainInline]


@admin.register(WorkerSkill)
class WorkerSkillAdmin(admin.ModelAdmin):
    list_display = [
        "worker",
        "skill_name",
        "proficiency_level",
        "skill_verification_tier",
    ]
    search_fields = ["skill_name", "worker__full_name"]
    list_filter = [
        "proficiency_level",
        "skill_verification_tier",
        "verification_source",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(TVETInstitution)
class TVETInstitutionAdmin(admin.ModelAdmin):
    list_display = ["institution_code", "institution_name", "location", "is_api_active"]
    search_fields = ["institution_code", "institution_name"]
    list_filter = ["is_api_active"]
    readonly_fields = ["id", "created_at", "updated_at", "api_key_created_at"]
    fieldsets = (
        (None, {
            'fields': ('institution_code', 'institution_name', 'location', 'contact_email', 'contact_phone')
        }),
        ('API Access', {
            'fields': ('is_api_active', 'api_key_hash', 'api_key_created_at'),
            'description': 'API key management. Use generate_tvet_apikey command to generate keys.'
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TVETAuth)
class TVETAuthAdmin(admin.ModelAdmin):
    list_display = ["user", "institution", "role"]
    search_fields = ["user__email", "institution__institution_name"]
    list_filter = ["role"]
    readonly_fields = ["id", "created_at", "updated_at"]
