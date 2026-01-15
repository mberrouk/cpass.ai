"""
Serializers matching Supabase API responses.
"""

from rest_framework import serializers
from .models import (
    CustomUser,
    WorkerProfile,
    WorkerSkill,
    WorkerCertification,
    WorkerDomain,
    TVETInstitution,
    TVETAuth,
)


class CustomUserSerializer(serializers.ModelSerializer):

    id = serializers.UUIDField(format="hex")

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "phone_number",
            "full_name",
            "user_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class WorkerSkillSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkerSkill
        fields = [
            "id",
            "worker_id",
            "skill_id",
            "skill_name",
            "proficiency_level",
            "proficiency_rating",
            "frequency",
            "years_experience",
            "supervision_level",
            "scale_context",
            "evidence_types",
            "reference_contact",
            "skill_verification_tier",
            "verification_source",
            "verified_by",
            "last_practiced_date",
            "credibility_score",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    worker_id = serializers.UUIDField(source="worker.id", read_only=True)


class WorkerCertificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkerCertification
        fields = [
            "id",
            "worker_id",
            "certification_name",
            "issuing_organization",
            "issue_date",
            "expiry_date",
            "certification_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    worker_id = serializers.UUIDField(source="worker.id", read_only=True)


class WorkerDomainSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkerDomain
        fields = ["id", "worker_id", "domain_name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    worker_id = serializers.UUIDField(source="worker.id", read_only=True)


class WorkerProfileSerializer(serializers.ModelSerializer):

    id = serializers.UUIDField(format="hex")
    worker_skills = WorkerSkillSerializer(many=True, read_only=True)
    certifications = WorkerCertificationSerializer(many=True, read_only=True)
    domains = WorkerDomainSerializer(many=True, read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            "id",
            "full_name",
            "email",
            "phone_number",
            "location",
            "tier",
            "overall_tier",
            "trust_score",
            "total_points",
            "total_skills",
            "bronze_skills",
            "silver_skills",
            "gold_skills",
            "platinum_skills",
            "work_status",
            "experience_duration",
            "invited_by_org",
            "invited_by_type",
            "invitation_code",
            "upload_source",
            "created_at",
            "updated_at",
            "worker_skills",
            "certifications",
            "domains",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SignupSerializer(serializers.Serializer):

    phone_number = serializers.CharField(max_length=20)
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    location = serializers.CharField(max_length=255, required=False, allow_blank=True)
    experience_duration = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )
    invited_by_org = serializers.CharField(
        max_length=255, required=False, allow_blank=True
    )
    invitation_code = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )
    skills = serializers.ListField(child=serializers.DictField(), required=False)
    telegram_id = serializers.IntegerField(required=False, allow_null=True)
    password = serializers.CharField(max_length=50)
    tvet_institution_id = serializers.UUIDField(required=False, allow_null=True)


class AuthResponseSerializer(serializers.Serializer):

    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    expires_in = serializers.IntegerField()
    token_type = serializers.CharField()
    user = CustomUserSerializer()

class TVETInstitutionSerializer(serializers.ModelSerializer):

    class Meta:
        model = TVETInstitution
        fields = [
            "id",
            "institution_code",
            "institution_name",
            "location",
            "contact_email",
            "contact_phone",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TVETAuthSerializer(serializers.ModelSerializer):

    institution = TVETInstitutionSerializer(read_only=True)

    class Meta:
        model = TVETAuth
        fields = ["id", "user_id", "institution", "role", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    user_id = serializers.UUIDField(source="user.id", read_only=True)
