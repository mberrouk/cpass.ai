"""
Django management command to seed demo worker profiles with meaningful data.
Each tier (Bronze, Silver, Gold, Platinum) has different skill levels and profiles.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from workers.models import CustomUser, WorkerProfile, WorkerSkill, WorkerCertification
from datetime import date, timedelta
import uuid


class Command(BaseCommand):
    help = "Seeds demo worker profiles with realistic data for each tier"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding demo worker profiles...\n")

        demo_profiles = [
            {
                # BRONZE TIER
                "email": "peter@demo.agriworker.co",
                "password": "Demo1234!",
                "phone": "+254700000002",
                "full_name": "Peter Ochieng",
                "location": "Kisumu",
                "tier": "bronze",
                "overall_tier": "bronze",
                "trust_score": 15,
                "total_points": 150,
                "experience_duration": "< 1 year",
                "total_skills": 5,
                "bronze_skills": 5,
                "silver_skills": 0,
                "gold_skills": 0,
                "platinum_skills": 0,
                "average_rating": 3.5,
                "total_tasks_completed": 8,
                "total_tasks_assigned": 12,
                "skills": [
                    {
                        "skill_id": "CP002",
                        "skill_name": "Planting & Transplanting",
                        "proficiency_level": "beginner",
                        "proficiency_rating": 2,
                        "years_experience": 1,
                        "skill_verification_tier": "bronze",
                        "verification_source": "self_reported",
                        "credibility_score": 40,
                    },
                    {
                        "skill_id": "CP003",
                        "skill_name": "Weeding & Cultivation",
                        "proficiency_level": "beginner",
                        "proficiency_rating": 2,
                        "years_experience": 1,
                        "skill_verification_tier": "bronze",
                        "verification_source": "self_reported",
                        "credibility_score": 35,
                    },
                    {
                        "skill_id": "CP001",
                        "skill_name": "Watering & Irrigation",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 1,
                        "skill_verification_tier": "bronze",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 50,
                    },
                    {
                        "skill_id": "CP008",
                        "skill_name": "Harvesting",
                        "proficiency_level": "beginner",
                        "proficiency_rating": 2,
                        "years_experience": 1,
                        "skill_verification_tier": "bronze",
                        "verification_source": "self_reported",
                        "credibility_score": 45,
                    },
                    {
                        "skill_id": "CP009",
                        "skill_name": "Sorting & Grading",
                        "proficiency_level": "beginner",
                        "proficiency_rating": 2,
                        "years_experience": 1,
                        "skill_verification_tier": "bronze",
                        "verification_source": "self_reported",
                        "credibility_score": 30,
                    },
                ],
                "certifications": [],
            },
            {
                # SILVER TIER
                "email": "mary@demo.agriworker.co",
                "password": "Demo1234!",
                "phone": "+254700000003",
                "full_name": "Mary Wanjiku",
                "location": "Kiambu",
                "tier": "silver",
                "overall_tier": "silver",
                "trust_score": 45,
                "total_points": 450,
                "experience_duration": "1-3 years",
                "total_skills": 8,
                "bronze_skills": 4,
                "silver_skills": 4,
                "gold_skills": 0,
                "platinum_skills": 0,
                "average_rating": 4.2,
                "total_tasks_completed": 28,
                "total_tasks_assigned": 35,
                "skills": [
                    {
                        "skill_id": "CP002",
                        "skill_name": "Planting & Transplanting",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 65,
                    },
                    {
                        "skill_id": "CP001",
                        "skill_name": "Watering & Irrigation",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "silver",
                        "verification_source": "tvet_verified",
                        "credibility_score": 70,
                    },
                    {
                        "skill_id": "CP003",
                        "skill_name": "Weeding & Cultivation",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "bronze",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 60,
                    },
                    {
                        "skill_id": "CP008",
                        "skill_name": "Harvesting",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 65,
                    },
                    {
                        "skill_id": "CP004",
                        "skill_name": "Pest & Disease Identification",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "silver",
                        "verification_source": "tvet_verified",
                        "credibility_score": 72,
                    },
                    {
                        "skill_id": "CP009",
                        "skill_name": "Sorting & Grading",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "bronze",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 55,
                    },
                    {
                        "skill_id": "PH001",
                        "skill_name": "Post-Harvest Handling",
                        "proficiency_level": "beginner",
                        "proficiency_rating": 2,
                        "years_experience": 1,
                        "skill_verification_tier": "bronze",
                        "verification_source": "self_reported",
                        "credibility_score": 45,
                    },
                    {
                        "skill_id": "CP011",
                        "skill_name": "Greenhouse Operations",
                        "proficiency_level": "beginner",
                        "proficiency_rating": 2,
                        "years_experience": 1,
                        "skill_verification_tier": "bronze",
                        "verification_source": "self_reported",
                        "credibility_score": 50,
                    },
                ],
                "certifications": [
                    {
                        "certification_name": "TVET Level 3 Crop Production",
                        "issuing_organization": "Kenya TVET Authority",
                        "issue_date": date(2023, 6, 15),
                        "expiry_date": None,
                    }
                ],
            },
            {
                # GOLD TIER
                "email": "grace@demo.agriworker.co",
                "password": "Demo1234!",
                "phone": "+254700000001",
                "full_name": "Grace Njeri",
                "location": "Nakuru",
                "tier": "gold",
                "overall_tier": "gold",
                "trust_score": 75,
                "total_points": 980,
                "experience_duration": "3-5 years",
                "total_skills": 11,
                "bronze_skills": 3,
                "silver_skills": 4,
                "gold_skills": 4,
                "platinum_skills": 0,
                "average_rating": 4.7,
                "total_tasks_completed": 67,
                "total_tasks_assigned": 72,
                "skills": [
                    {
                        "skill_id": "CP002",
                        "skill_name": "Planting & Transplanting",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 4,
                        "skill_verification_tier": "gold",
                        "verification_source": "certification_verified",
                        "credibility_score": 85,
                    },
                    {
                        "skill_id": "CP001",
                        "skill_name": "Watering & Irrigation",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 4,
                        "skill_verification_tier": "gold",
                        "verification_source": "certification_verified",
                        "credibility_score": 90,
                    },
                    {
                        "skill_id": "CP003",
                        "skill_name": "Weeding & Cultivation",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 4,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 75,
                    },
                    {
                        "skill_id": "CP008",
                        "skill_name": "Harvesting",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 4,
                        "skill_verification_tier": "gold",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 82,
                    },
                    {
                        "skill_id": "CP004",
                        "skill_name": "Pest & Disease Identification",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 3,
                        "skill_verification_tier": "gold",
                        "verification_source": "certification_verified",
                        "credibility_score": 88,
                    },
                    {
                        "skill_id": "CP005",
                        "skill_name": "Pesticide Application",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 3,
                        "skill_verification_tier": "gold",
                        "verification_source": "certification_verified",
                        "credibility_score": 85,
                    },
                    {
                        "skill_id": "CP009",
                        "skill_name": "Sorting & Grading",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 3,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 70,
                    },
                    {
                        "skill_id": "CP011",
                        "skill_name": "Greenhouse Operations",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "silver",
                        "verification_source": "tvet_verified",
                        "credibility_score": 68,
                    },
                    {
                        "skill_id": "PH001",
                        "skill_name": "Post-Harvest Handling",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 65,
                    },
                    {
                        "skill_id": "CP012",
                        "skill_name": "Soil Testing & Analysis",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 2,
                        "skill_verification_tier": "bronze",
                        "verification_source": "tvet_verified",
                        "credibility_score": 60,
                    },
                    {
                        "skill_id": "CP006",
                        "skill_name": "Land Preparation",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 3,
                        "skill_verification_tier": "bronze",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 62,
                    },
                ],
                "certifications": [
                    {
                        "certification_name": "KenyaGAP",
                        "issuing_organization": "FPEAK - Fresh Produce Exporters Association of Kenya",
                        "issue_date": date(2022, 3, 10),
                        "expiry_date": date(2025, 3, 10),
                    },
                    {
                        "certification_name": "TVET Level 3 Crop Production",
                        "issuing_organization": "Kenya TVET Authority",
                        "issue_date": date(2021, 11, 20),
                        "expiry_date": None,
                    },
                    {
                        "certification_name": "Greenhouse Operations Certificate",
                        "issuing_organization": "Horticultural Crops Directorate",
                        "issue_date": date(2022, 8, 5),
                        "expiry_date": None,
                    },
                ],
            },
            {
                # PLATINUM TIER
                "email": "john@demo.agriworker.co",
                "password": "Demo1234!",
                "phone": "+254700000004",
                "full_name": "John Kamau",
                "location": "Eldoret",
                "tier": "platinum",
                "overall_tier": "platinum",
                "trust_score": 95,
                "total_points": 1850,
                "experience_duration": "5+ years",
                "total_skills": 17,
                "bronze_skills": 3,
                "silver_skills": 5,
                "gold_skills": 6,
                "platinum_skills": 3,
                "average_rating": 4.9,
                "total_tasks_completed": 142,
                "total_tasks_assigned": 148,
                "skills": [
                    # Crop Production
                    {
                        "skill_id": "CP002",
                        "skill_name": "Planting & Transplanting",
                        "proficiency_level": "expert",
                        "proficiency_rating": 5,
                        "years_experience": 7,
                        "skill_verification_tier": "platinum",
                        "verification_source": "certification_verified",
                        "credibility_score": 95,
                    },
                    {
                        "skill_id": "CP001",
                        "skill_name": "Watering & Irrigation",
                        "proficiency_level": "expert",
                        "proficiency_rating": 5,
                        "years_experience": 7,
                        "skill_verification_tier": "platinum",
                        "verification_source": "certification_verified",
                        "credibility_score": 98,
                    },
                    {
                        "skill_id": "CP003",
                        "skill_name": "Weeding & Cultivation",
                        "proficiency_level": "expert",
                        "proficiency_rating": 5,
                        "years_experience": 7,
                        "skill_verification_tier": "gold",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 90,
                    },
                    {
                        "skill_id": "CP008",
                        "skill_name": "Harvesting",
                        "proficiency_level": "expert",
                        "proficiency_rating": 5,
                        "years_experience": 7,
                        "skill_verification_tier": "platinum",
                        "verification_source": "certification_verified",
                        "credibility_score": 96,
                    },
                    {
                        "skill_id": "CP004",
                        "skill_name": "Pest & Disease Identification",
                        "proficiency_level": "expert",
                        "proficiency_rating": 5,
                        "years_experience": 6,
                        "skill_verification_tier": "gold",
                        "verification_source": "certification_verified",
                        "credibility_score": 92,
                    },
                    {
                        "skill_id": "CP005",
                        "skill_name": "Pesticide Application",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 5,
                        "skill_verification_tier": "gold",
                        "verification_source": "certification_verified",
                        "credibility_score": 88,
                    },
                    {
                        "skill_id": "CP009",
                        "skill_name": "Sorting & Grading",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 6,
                        "skill_verification_tier": "gold",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 85,
                    },
                    {
                        "skill_id": "CP011",
                        "skill_name": "Greenhouse Operations",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 4,
                        "skill_verification_tier": "gold",
                        "verification_source": "certification_verified",
                        "credibility_score": 87,
                    },
                    {
                        "skill_id": "CP006",
                        "skill_name": "Land Preparation",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 6,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 80,
                    },
                    {
                        "skill_id": "CP012",
                        "skill_name": "Soil Testing & Analysis",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 4,
                        "skill_verification_tier": "gold",
                        "verification_source": "certification_verified",
                        "credibility_score": 86,
                    },
                    {
                        "skill_id": "PH001",
                        "skill_name": "Post-Harvest Handling",
                        "proficiency_level": "advanced",
                        "proficiency_rating": 4,
                        "years_experience": 5,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 78,
                    },
                    {
                        "skill_id": "PH002",
                        "skill_name": "Storage Management",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 3,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 70,
                    },
                    {
                        "skill_id": "PH003",
                        "skill_name": "Quality Grading",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 4,
                        "skill_verification_tier": "silver",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 72,
                    },
                    {
                        "skill_id": "CP010",
                        "skill_name": "Nursery Management",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 3,
                        "skill_verification_tier": "bronze",
                        "verification_source": "tvet_verified",
                        "credibility_score": 68,
                    },
                    # Machinery Skills
                    {
                        "skill_id": "MC001",
                        "skill_name": "Tractor Operation",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 4,
                        "skill_verification_tier": "silver",
                        "verification_source": "certification_verified",
                        "credibility_score": 75,
                    },
                    {
                        "skill_id": "MC002",
                        "skill_name": "Equipment Maintenance",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 3,
                        "skill_verification_tier": "bronze",
                        "verification_source": "supervisor_verified",
                        "credibility_score": 65,
                    },
                    {
                        "skill_id": "MC003",
                        "skill_name": "Irrigation System Operation",
                        "proficiency_level": "intermediate",
                        "proficiency_rating": 3,
                        "years_experience": 3,
                        "skill_verification_tier": "bronze",
                        "verification_source": "tvet_verified",
                        "credibility_score": 70,
                    },
                ],
                "certifications": [
                    {
                        "certification_name": "KenyaGAP",
                        "issuing_organization": "FPEAK - Fresh Produce Exporters Association of Kenya",
                        "issue_date": date(2020, 5, 15),
                        "expiry_date": date(2026, 5, 15),
                    },
                    {
                        "certification_name": "TVET Level 4 Agricultural Technology",
                        "issuing_organization": "Kenya TVET Authority",
                        "issue_date": date(2020, 9, 10),
                        "expiry_date": None,
                    },
                    {
                        "certification_name": "Farm Business Management",
                        "issuing_organization": "Agricultural Training Centre",
                        "issue_date": date(2021, 7, 22),
                        "expiry_date": None,
                    },
                    {
                        "certification_name": "Greenhouse Operations Certificate",
                        "issuing_organization": "Horticultural Crops Directorate",
                        "issue_date": date(2021, 3, 18),
                        "expiry_date": None,
                    },
                    {
                        "certification_name": "Tractor Operation License",
                        "issuing_organization": "Ministry of Agriculture",
                        "issue_date": date(2022, 1, 12),
                        "expiry_date": date(2027, 1, 12),
                    },
                ],
            },
        ]

        # Create each profile
        for profile_data in demo_profiles:
            self.create_demo_profile(profile_data)

        self.stdout.write(
            self.style.SUCCESS("\n✅ Demo profiles seeded successfully!\n")
        )
        self.stdout.write("📧 Login credentials:")
        self.stdout.write("   Email: <profile-email>")
        self.stdout.write("   Password: Demo1234!\n")
        self.stdout.write("Available profiles:")
        for p in demo_profiles:
            self.stdout.write(
                f"   • {p['full_name']} ({p['tier'].upper()}) - {p['email']}"
            )

    def create_demo_profile(self, data):
        """Create or update a demo profile with all related data"""
        email = data["email"]
        self.stdout.write(f"\nCreating profile: {data['full_name']} ({data['tier'].upper()})")

        user, user_created = CustomUser.objects.update_or_create(
            email=email,
            defaults={
                "phone_number": data["phone"],
                "full_name": data["full_name"],
                "user_type": "worker",
                "is_active": True,
                "is_staff": False,
            },
        )

        user.set_password(data["password"])
        user.save()

        if user_created:
            self.stdout.write(f"    Created user: {email}")
        else:
            self.stdout.write(f"    Updated user: {email}")


        profile, profile_created = WorkerProfile.objects.update_or_create(
            user=user,
            defaults={
                "full_name": data["full_name"],
                "email": email,
                "phone_number": data["phone"],
                "location": data["location"],
                "tier": data["tier"],
                "overall_tier": data["overall_tier"],
                "trust_score": data["trust_score"],
                "total_points": data["total_points"],
                "experience_duration": data["experience_duration"],
                "total_skills": data["total_skills"],
                "bronze_skills": data["bronze_skills"],
                "silver_skills": data["silver_skills"],
                "gold_skills": data["gold_skills"],
                "platinum_skills": data["platinum_skills"],
                "average_rating": data["average_rating"],
                "total_tasks_completed": data["total_tasks_completed"],
                "total_tasks_assigned": data["total_tasks_assigned"],
                "work_status": "available",
                "upload_source": "demo_account",
                "bio": f"Demo {data['tier']} tier worker with {data['experience_duration']} of agricultural experience.",
            },
        )


        profile.update_reputation()

        if profile_created:
            self.stdout.write(f" Created profile")
        else:
            self.stdout.write(f" Updated profile")

        WorkerSkill.objects.filter(worker=profile).delete()
        
        skills_created = 0
        for skill_data in data["skills"]:
            skill_code = skill_data.get("skill_id", "")
            skill_name = skill_data["skill_name"]
            
            WorkerSkill.objects.create(
                worker=profile,
                skill_id=None,  # Leave as None - skill_name is used for matching
                skill_name=f"[{skill_code}] {skill_name}" if skill_code else skill_name,
                proficiency_level=skill_data["proficiency_level"],
                proficiency_rating=skill_data["proficiency_rating"],
                years_experience=skill_data.get("years_experience"),
                skill_verification_tier=skill_data["skill_verification_tier"],
                verification_source=skill_data["verification_source"],
                credibility_score=skill_data["credibility_score"],
                last_practiced_date=date.today() - timedelta(days=30),
            )
            skills_created += 1

        self.stdout.write(f"    Created {skills_created} skills")


        WorkerCertification.objects.filter(worker=profile).delete()
        
        certs_created = 0
        for cert_data in data["certifications"]:
            WorkerCertification.objects.create(
                worker=profile,
                certification_name=cert_data["certification_name"],
                issuing_organization=cert_data["issuing_organization"],
                issue_date=cert_data["issue_date"],
                expiry_date=cert_data.get("expiry_date"),
            )
            certs_created += 1

        if certs_created > 0:
            self.stdout.write(f"    Created {certs_created} certifications")

        self.stdout.write(
            self.style.SUCCESS(
                f"   {data['full_name']} profile complete!"
            )
        )
