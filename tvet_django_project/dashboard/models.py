"""
TVET Dashboard Models.
"""

import uuid
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.utils import timezone


class InstitutionManager(models.Manager):
    def get_by_code(self, code):
        return self.get(institution_code=code)


class Institution(models.Model):
    """
    TVET Institution configuration.
    Stores the API key for CPASS integration.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution_code = models.CharField(max_length=50, unique=True)
    institution_name = models.CharField(max_length=255)
    institution_type = models.CharField(max_length=100, default="TVET")
    location = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)

    # CPASS API integration
    cpass_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="API key for CPASS integration (format: tvet_CODE_token)",
    )
    cpass_api_active = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = InstitutionManager()

    class Meta:
        db_table = "institutions"
        verbose_name = "Institution"
        verbose_name_plural = "Institutions"

    def __str__(self):
        return f"{self.institution_name} ({self.institution_code})"


class StaffUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class StaffUser(AbstractBaseUser, PermissionsMixin):
    """
    Staff users for TVET institutions.
    Each user belongs to one institution.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name="staff_users"
    )
    role = models.CharField(max_length=50, default="staff")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StaffUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        db_table = "staff_users"
        verbose_name = "Staff User"
        verbose_name_plural = "Staff Users"

    def __str__(self):
        return f"{self.full_name} ({self.email})"


class UploadBatch(models.Model):
    """
    Tracks bulk upload batches.
    Workers are sent to CPASS API, but batch metadata is stored locally.
    """

    UPLOAD_MODE_CHOICES = [
        ("demo", "Demo"),
        ("production", "Production"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_id = models.CharField(max_length=100, unique=True)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name="upload_batches"
    )
    source_file_name = models.CharField(max_length=255)
    upload_mode = models.CharField(
        max_length=20, choices=UPLOAD_MODE_CHOICES, default="demo"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    worker_count = models.IntegerField(default=0)
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)

    # Store worker ids returned from CPASS
    worker_ids = models.JSONField(default=list, blank=True)
    errors = models.JSONField(default=list, blank=True)

    uploaded_by = models.ForeignKey(
        StaffUser, on_delete=models.SET_NULL, null=True, related_name="uploads"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "upload_batches"
        verbose_name = "Upload Batch"
        verbose_name_plural = "Upload Batches"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.batch_id} - {self.source_file_name}"


class CandidateNote(models.Model):
    """
    Notes/comments on candidates (workers).
    Worker data is in CPASS, but notes are local to this dashboard.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name="candidate_notes"
    )
    worker_id = models.UUIDField(db_index=True, help_text="Worker ID from CPASS")

    note = models.TextField()
    created_by = models.ForeignKey(
        StaffUser, on_delete=models.SET_NULL, null=True, related_name="notes"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "candidate_notes"
        verbose_name = "Candidate Note"
        verbose_name_plural = "Candidate Notes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Note for {self.worker_id}"


class ContactLog(models.Model):
    """
    Log of contact attempts with candidates.
    """

    CONTACT_METHOD_CHOICES = [
        ("sms", "SMS"),
        ("whatsapp", "WhatsApp"),
        ("telegram", "Telegram"),
        ("email", "Email"),
        ("phone", "Phone Call"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name="contact_logs"
    )
    worker_id = models.UUIDField(db_index=True, help_text="Worker ID from CPASS")

    contact_method = models.CharField(max_length=20, choices=CONTACT_METHOD_CHOICES)
    notes = models.TextField(blank=True, null=True)

    contacted_by = models.ForeignKey(
        StaffUser, on_delete=models.SET_NULL, null=True, related_name="contacts"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "contact_logs"
        verbose_name = "Contact Log"
        verbose_name_plural = "Contact Logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.contact_method} to {self.worker_id}"


class CandidateAssessment(models.Model):
    """
    Local assessment status tracking.
    """

    ASSESSMENT_STATUS_CHOICES = [
        ("identified", "Identified"),
        ("contacted", "Contacted"),
        ("scheduled", "Scheduled"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("certified", "Certified"),
        ("dropped", "Dropped"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name="assessments"
    )
    worker_id = models.UUIDField(
        db_index=True, unique=True, help_text="Worker ID from CPASS"
    )

    assessment_status = models.CharField(
        max_length=20, choices=ASSESSMENT_STATUS_CHOICES, default="identified"
    )
    certification_match = models.IntegerField(
        default=0, help_text="Calculated match percentage for certification"
    )

    # Cache some worker data for quick access (synced from CPASS)
    worker_name = models.CharField(max_length=255, blank=True)
    worker_phone = models.CharField(max_length=20, blank=True)
    worker_tier = models.CharField(max_length=20, blank=True)

    batch = models.ForeignKey(
        UploadBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assessments",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "candidate_assessments"
        verbose_name = "Candidate Assessment"
        verbose_name_plural = "Candidate Assessments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.worker_name} - {self.assessment_status}"
