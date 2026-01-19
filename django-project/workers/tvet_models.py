"""
Institution and Authentication Models.
"""
import hashlib
import secrets
import uuid
from django.utils import timezone
from django.db import models

# TODO: Consider renaming to just Institution if needed.
class TVETInstitution(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution_code = models.CharField(max_length=50, unique=True)
    institution_name = models.CharField(max_length=255)
    institution_type = models.CharField(
        max_length=50, blank=True, null=True
    )  # TODO: This used to extend to other types
    location = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)

    # API Key authentication
    api_key_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    api_key_created_at = models.DateTimeField(blank=True, null=True)
    is_api_active = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tvet_institutions"
        verbose_name = "TVET Institution"
        verbose_name_plural = "TVET Institutions"

    def __str__(self):
        return f"{self.institution_name} ({self.institution_code})"

    def generate_api_key(self) -> str:

        random_token = secrets.token_hex(16)
        raw_key = f"tvet_{self.institution_code}_{random_token}"

        self.api_key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        self.api_key_created_at = timezone.now()
        self.is_api_active = True
        self.save(update_fields=["api_key_hash", "api_key_created_at", "is_api_active"])

        return raw_key

    def verify_api_key(self, raw_key: str) -> bool:
        if not self.api_key_hash or not self.is_api_active:
            return False
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        return key_hash == self.api_key_hash

    def revoke_api_key(self):
        self.is_api_active = False
        self.save(update_fields=["is_api_active"])
