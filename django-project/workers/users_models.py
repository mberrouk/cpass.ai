"""
Models for worker profiles, skills, and certifications.
"""

import uuid
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models

from .tvet_models import TVETInstitution


class CustomUserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):

    # TODO: This model is going to be extended in future for different user types,
    # consider refactoring into separate models if needed.

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    user_type = models.CharField(max_length=50, default="worker")

    # Telegram integration fields
    telegram_id = models.BigIntegerField(
        unique=True, null=True, blank=True, db_index=True
    )
    telegram_username = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "auth_users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email


class WorkerProfile(models.Model):

    TIER_CHOICES = [
        ("bronze", "Bronze"),
        ("silver", "Silver"),
        ("gold", "Gold"),
        ("platinum", "Platinum"),
    ]

    WORK_STATUS_CHOICES = [
        ("available", "Available"),
        ("employed", "Employed"),
        ("inactive", "Inactive"),
    ]

    VERIFICATION_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("verified", "Verified"),
        ("rejected", "Rejected"),
        ("revoked", "Revoked"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="worker_profile",
        null=True,
        blank=True,
    )

    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20)
    location = models.CharField(max_length=255, blank=True, null=True)

    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default="bronze")
    overall_tier = models.CharField(
        max_length=20, choices=TIER_CHOICES, default="bronze"
    )
    trust_score = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    total_skills = models.IntegerField(default=0)

    bronze_skills = models.IntegerField(default=0)
    silver_skills = models.IntegerField(default=0)
    gold_skills = models.IntegerField(default=0)
    platinum_skills = models.IntegerField(default=0)

    work_status = models.CharField(
        max_length=20, choices=WORK_STATUS_CHOICES, default="available"
    )
    experience_duration = models.CharField(max_length=50, blank=True, null=True)

    invited_by_org = models.CharField(max_length=255, blank=True, null=True)
    invited_by_type = models.CharField(max_length=50, blank=True, null=True)
    invitation_code = models.CharField(max_length=50, blank=True, null=True)

    upload_source = models.CharField(max_length=50, default="self_registration")

    claimed_institution = models.ForeignKey(
        TVETInstitution,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="affiliated_workers",
        help_text="Institution the worker claims affiliation with",
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default="pending",
        help_text="Status of institution verification",
    )
    verified_at = models.DateTimeField(
        null=True, blank=True, help_text="When the institution verified this worker"
    )
    verification_notes = models.TextField(
        blank=True, null=True, help_text="Notes from verification process"
    )

    # Task tracking fields
    bio = models.TextField(blank=True, null=True)
    skills = models.TextField(help_text="Comma-separated skills", blank=True, null=True)
    reputation_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
    )
    total_tasks_completed = models.IntegerField(default=0)
    total_tasks_assigned = models.IntegerField(default=0)
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.0,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def completion_rate(self):
        if self.total_tasks_assigned == 0:
            return 0
        return round((self.total_tasks_completed / self.total_tasks_assigned) * 100, 2)

    def update_reputation(self):
        # (average_rating * 20) + (completion_rate * 10 / 100)
        rating_component = float(self.average_rating) * 20
        completion_component = self.completion_rate * 0.1
        self.reputation_score = round(rating_component + completion_component, 2)
        self.save()

    class Meta:
        db_table = "worker_profiles"
        verbose_name = "Worker Profile"
        verbose_name_plural = "Worker Profiles"
        indexes = [
            models.Index(fields=["upload_source"]),
            models.Index(fields=["phone_number"]),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.tier}"


class WorkerSkill(models.Model):
    """
    Worker skills matching Supabase worker_skills table.
    Includes proficiency ratings, verification, and evidence tracking.
    """

    PROFICIENCY_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
        ("expert", "Expert"),
    ]

    TIER_CHOICES = [
        ("bronze", "Bronze"),
        ("silver", "Silver"),
        ("gold", "Gold"),
        ("platinum", "Platinum"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    worker = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="worker_skills"
    )

    skill_id = models.UUIDField(null=True, blank=True)
    skill_name = models.CharField(max_length=255)

    proficiency_level = models.CharField(
        max_length=50, choices=PROFICIENCY_CHOICES, blank=True, null=True
    )
    proficiency_rating = models.IntegerField(default=1)

    frequency = models.CharField(max_length=50, blank=True, null=True)
    years_experience = models.IntegerField(null=True, blank=True)
    supervision_level = models.CharField(max_length=50, blank=True, null=True)

    scale_context = models.JSONField(default=list, blank=True)
    evidence_types = models.JSONField(default=list, blank=True)

    reference_contact = models.CharField(max_length=255, blank=True, null=True)

    skill_verification_tier = models.CharField(
        max_length=20, choices=TIER_CHOICES, default="bronze"
    )
    verification_source = models.CharField(max_length=50, default="self_reported")
    verified_by = models.CharField(max_length=255, blank=True, null=True)

    last_practiced_date = models.DateField(null=True, blank=True)
    credibility_score = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "worker_skills"
        verbose_name = "Worker Skill"
        verbose_name_plural = "Worker Skills"
        indexes = [
            models.Index(fields=["worker"]),
            models.Index(fields=["skill_name"]),
        ]

    def __str__(self):
        return f"{self.worker.full_name} - {self.skill_name}"


class WorkerCertification(models.Model):
    """
    Worker certifications matching Supabase worker_certifications table.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    worker = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="certifications"
    )

    certification_name = models.CharField(max_length=255)
    # TODO: Consider linking to a Certification model/table
    issuing_organization = models.CharField(max_length=255, blank=True, null=True)

    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    certification_url = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "worker_certifications"
        verbose_name = "Worker Certification"
        verbose_name_plural = "Worker Certifications"

    def __str__(self):
        return f"{self.worker.full_name} - {self.certification_name}"


class WorkerDomain(models.Model):
    """
    Worker domains matching Supabase worker_domains table.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    worker = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="domains"
    )

    domain_name = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "worker_domains"
        verbose_name = "Worker Domain"
        verbose_name_plural = "Worker Domains"

    def __str__(self):
        return f"{self.worker.full_name} - {self.domain_name}"


class TVETAuth(models.Model):
    """
    Links users to TVET institutions matching Supabase tvet_auth.
    """

    # TODO: This is a temporary model for TVET authentication, should be updated once the frontend is ready.

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="tvet_auth"
    )
    institution = models.ForeignKey(
        TVETInstitution, on_delete=models.CASCADE, related_name="auth_records"
    )
    role = models.CharField(max_length=50, default="staff")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tvet_auth"
        verbose_name = "TVET Auth"
        verbose_name_plural = "TVET Auths"
        unique_together = [["user", "institution"]]

    def __str__(self):
        return f"{self.user.email} - {self.institution.institution_code}"