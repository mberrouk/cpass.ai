"""
Management command to seed demo institutions and workers for testing.

Usage:
    python manage.py seed_demo_institutions
    python manage.py seed_demo_institutions --with-workers
    python manage.py seed_demo_institutions --generate-keys --output-keys

This creates demo TVET institutions with API keys for testing.
"""

import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from workers.models import TVETInstitution, WorkerProfile, WorkerSkill


DEMO_INSTITUTIONS = [
    {
        "institution_code": "KIAMBU001",
        "institution_name": "Kiambu Institute of Science and Technology",
        "institution_type": "TVET",
        "location": "Kiambu, Kenya",
        "country": "Kenya",
        "contact_person": "John Mwangi",
        "contact_email": "admin@kist.ac.ke",
        "contact_phone": "+254700000001",
    },
    {
        "institution_code": "NAKURU001",
        "institution_name": "Nakuru Technical Training Institute",
        "institution_type": "TVET",
        "location": "Nakuru, Kenya",
        "country": "Kenya",
        "contact_person": "Jane Wanjiru",
        "contact_email": "admin@nakurutti.ac.ke",
        "contact_phone": "+254700000002",
    },
    {
        "institution_code": "MOMBASA001",
        "institution_name": "Mombasa Technical University",
        "institution_type": "TVET",
        "location": "Mombasa, Kenya",
        "country": "Kenya",
        "contact_person": "Ahmed Hassan",
        "contact_email": "admin@mtu.ac.ke",
        "contact_phone": "+254700000003",
    },
]

DEMO_WORKERS = [
    {
        "full_name": "John Kamau",
        "phone_number": "+254711111111",
        "email": "john.kamau@example.com",
        "location": "Kiambu, Kenya",
        "tier": "silver",
        "skills": ["Electrical Wiring", "Motor Repair", "Solar Installation"],
    },
    {
        "full_name": "Mary Wanjiku",
        "phone_number": "+254711111112",
        "email": "mary.wanjiku@example.com",
        "location": "Kiambu, Kenya",
        "tier": "gold",
        "skills": ["Plumbing", "Pipe Fitting", "Water Tank Installation"],
    },
    {
        "full_name": "Peter Omondi",
        "phone_number": "+254711111113",
        "email": "peter.omondi@example.com",
        "location": "Kiambu, Kenya",
        "tier": "bronze",
        "skills": ["Carpentry", "Furniture Making"],
    },
    {
        "full_name": "Grace Akinyi",
        "phone_number": "+254711111114",
        "email": "grace.akinyi@example.com",
        "location": "Kiambu, Kenya",
        "tier": "platinum",
        "skills": ["Welding", "Metal Fabrication", "Steel Construction", "AutoCAD"],
    },
    {
        "full_name": "David Mwangi",
        "phone_number": "+254711111115",
        "email": "david.mwangi@example.com",
        "location": "Kiambu, Kenya",
        "tier": "silver",
        "skills": ["Masonry", "Tiling", "Concrete Work"],
    },
]


class Command(BaseCommand):
    help = "Seed demo TVET institutions and optionally workers for testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-workers",
            action="store_true",
            help="Also create demo workers affiliated with the first institution",
        )
        parser.add_argument(
            "--generate-keys",
            action="store_true",
            help="Generate API keys for all institutions (keys will be displayed)",
        )
        parser.add_argument(
            "--output-json",
            type=str,
            help="Output institution data with API keys to a JSON file",
        )

    def handle(self, *args, **options):
        with_workers = options["with_workers"]
        generate_keys = options["generate_keys"]
        output_json = options.get("output_json")

        self.stdout.write(self.style.NOTICE("Seeding demo TVET institutions..."))
        self.stdout.write("")

        created_institutions = []
        api_keys = {}

        for inst_data in DEMO_INSTITUTIONS:
            institution, created = TVETInstitution.objects.get_or_create(
                institution_code=inst_data["institution_code"], defaults=inst_data
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  Created: {institution.institution_name} ({institution.institution_code})"
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Exists: {institution.institution_name} ({institution.institution_code})"
                    )
                )

            created_institutions.append(institution)

        self.stdout.write("")

        # Generate API keys if requested
        if generate_keys or output_json:
            self.stdout.write(self.style.NOTICE("Generating API keys..."))
            self.stdout.write("")

            for institution in created_institutions:
                if not institution.api_key_hash or not institution.is_api_active:
                    raw_key = institution.generate_api_key()
                    api_keys[institution.institution_code] = raw_key
                    self.stdout.write(f"  {institution.institution_code}:")
                    self.stdout.write(f"    {self.style.SUCCESS(raw_key)}")
                    self.stdout.write("")
                else:
                    self.stdout.write(
                        f"  {institution.institution_code}: (already has active key)"
                    )
                    api_keys[institution.institution_code] = None

            self.stdout.write("")

        # Output to JSON file if requested
        if output_json:
            output_data = []
            for institution in created_institutions:
                inst_dict = {
                    "institution_code": institution.institution_code,
                    "institution_name": institution.institution_name,
                    "institution_type": institution.institution_type or "TVET",
                    "location": institution.location,
                    "country": institution.country or "",
                    "contact_person": institution.contact_person or "",
                    "contact_email": institution.contact_email,
                    "contact_phone": institution.contact_phone,
                    "api_key": api_keys.get(institution.institution_code),
                }
                output_data.append(inst_dict)

            with open(output_json, "w") as f:
                json.dump(output_data, f, indent=2)

            self.stdout.write(
                self.style.SUCCESS(f"Institution data written to: {output_json}")
            )
            self.stdout.write("")

        # Create demo workers if requested
        if with_workers:
            self.stdout.write(self.style.NOTICE("Creating demo workers..."))
            self.stdout.write("")

            # Use first institution
            institution = created_institutions[0]

            for worker_data in DEMO_WORKERS:
                skills = worker_data.pop("skills", [])

                worker, created = WorkerProfile.objects.get_or_create(
                    phone_number=worker_data["phone_number"],
                    defaults={
                        **worker_data,
                        "claimed_institution": institution,
                        "verification_status": "verified",
                        "verified_at": timezone.now(),
                        "upload_source": "demo_seed",
                    },
                )

                if created:
                    # Add skills
                    for skill_name in skills:
                        WorkerSkill.objects.get_or_create(
                            worker=worker,
                            skill_name=skill_name,
                            defaults={
                                "verification_source": "demo_seed",
                                "verified_by": institution.institution_name,
                                "skill_verification_tier": worker.tier,
                            },
                        )

                    # Update skill count
                    worker.total_skills = len(skills)
                    worker.save(update_fields=["total_skills"])

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  Created: {worker.full_name} ({worker.tier}) with {len(skills)} skills"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f"  Exists: {worker.full_name}")
                    )

            self.stdout.write("")

        self.stdout.write(self.style.SUCCESS("Demo seeding complete!"))
        self.stdout.write("")
        self.stdout.write("To generate API keys later, run:")
        self.stdout.write("  python manage.py generate_tvet_apikey INSTITUTION_CODE")
