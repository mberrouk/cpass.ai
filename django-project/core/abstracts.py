"""
Abstract models for common fields across different models.
"""

from django.db import models


class CreatedModifiedAbstract(models.Model):
    """
    Abstract model that provides created and modified timestamps.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
