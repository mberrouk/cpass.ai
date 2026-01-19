"""
Management command to generate API keys for TVET institutions.

Usage:
    python manage.py generate_tvet_apikey INSTITUTION_CODE
    python manage.py generate_tvet_apikey KIAMBU001

The API key will be displayed once - store it securely!
"""

from django.core.management.base import BaseCommand, CommandError
from workers.tvet_models import TVETInstitution


class Command(BaseCommand):
    help = "Generate or regenerate API key for a TVET institution"

    def add_arguments(self, parser):
        parser.add_argument(
            "institution_code",
            type=str,
            help="The institution code to generate an API key for",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force regeneration even if an API key already exists",
        )

    def handle(self, *args, **options):
        institution_code = options["institution_code"]
        force = options["force"]

        try:
            institution = TVETInstitution.objects.get(institution_code=institution_code)
        except TVETInstitution.DoesNotExist:
            raise CommandError(
                f'Institution with code "{institution_code}" does not exist'
            )

        # Check if API key already exists
        if institution.api_key_hash and institution.is_api_active and not force:
            raise CommandError(
                f'Institution "{institution_code}" already has an active API key. '
                f"Use --force to regenerate."
            )

        raw_key = institution.generate_api_key()

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("API KEY GENERATED SUCCESSFULLY"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")
        self.stdout.write(f"Institution: {institution.institution_name}")
        self.stdout.write(f"Code: {institution.institution_code}")
        self.stdout.write("")
        self.stdout.write("")
        self.stdout.write(f"API Key: {self.style.SUCCESS(raw_key)}")
        self.stdout.write("")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
