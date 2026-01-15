from django.db import models


class ConversationState(models.Model):
    """Track conversation state for multi-step interactions"""

    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    current_state = models.CharField(max_length=100, blank=True, null=True)
    context_data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "conversation_states"

    def __str__(self):
        return f"State for {self.telegram_id}: {self.current_state}"


class ContactVerification(models.Model):
    """Track verified phone numbers for Telegram users before full registration"""

    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    phone_number = models.CharField(max_length=20)
    telegram_username = models.CharField(max_length=255, blank=True, null=True)
    first_name = models.CharField(max_length=255, blank=True, null=True)
    verified_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contact_verifications"
        verbose_name = "Contact Verification"
        verbose_name_plural = "Contact Verifications"
        indexes = [
            models.Index(fields=["telegram_id"]),
        ]

    def __str__(self):
        return f"{self.telegram_id}: {self.phone_number}"
