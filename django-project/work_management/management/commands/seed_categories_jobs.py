"""
This command creates job categories based on CPASS.

# TODO: This is a temporary way (hard coded)!
"""

# import csv
from django.core.management.base import BaseCommand
from work_management.models import JobCategory, Job


class Command(BaseCommand):
    # TODO: I am not sure if i need to parse the csv file for this?
    help = "Seed job categories and jobs"

    def handle(self, *args, **kwargs):
        categories_data = [
            {
                "category_id": "DOM_CROP",
                "name": "Crop Production",
                "description": "Field crops, horticulture, nursery management, and plant cultivation.",
            },
            {
                "category_id": "DOM_LIVE",
                "name": "Livestock Management",
                "description": "Animal husbandry, feeding, health, breeding, and livestock operations.",
            },
            {
                "category_id": "DOM_MACH",
                "name": "Machinery & Equipment",
                "description": "Mechanized operations, tractor use, implements, and agricultural machinery.",
            },
            {
                "category_id": "DOM_POST",
                "name": "Post-Harvest & Processing",
                "description": "Grading, sorting, storage, packaging, and produce processing.",
            },
            {
                "category_id": "DOM_MGMT",
                "name": "Agri-Business Management",
                "description": "Farm records, compliance, finance, digital tools, and precision agriculture.",
            },
        ]

        self.stdout.write("Creating job categories...")
        for cat_data in categories_data:
            category, created = JobCategory.objects.get_or_create(
                category_id=cat_data["category_id"],
                defaults={
                    "name": cat_data["name"],
                    "description": cat_data["description"],
                },
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"Created category: {category.name}")
                )
            else:
                self.stdout.write(f"  Category already exists: {category.name}")

        jobs_data = [
            {
                "job_id": "agri_crop_001",
                "category_id": "DOM_CROP",
                "title": "Preparing land for planting (plowing, digging)",
                "description": "Manual land preparation using hand tools or animal-drawn implements.",
            },
            {
                "job_id": "agri_crop_002",
                "category_id": "DOM_CROP",
                "title": "Planting seeds or seedlings",
                "description": "Sowing seeds or transplanting seedlings into prepared fields.",
            },
            {
                "job_id": "agri_crop_003",
                "category_id": "DOM_CROP",
                "title": "Watering crops / managing irrigation",
                "description": "Manual or automated watering and irrigation management.",
            },
            {
                "job_id": "agri_crop_004",
                "category_id": "DOM_CROP",
                "title": "Weeding by hand or with tools",
                "description": "Removing weeds manually to protect crop growth.",
            },
            {
                "job_id": "agri_crop_005",
                "category_id": "DOM_CROP",
                "title": "Applying fertilizers",
                "description": "Application of organic or chemical fertilizers to crops.",
            },
            {
                "job_id": "agri_crop_006",
                "category_id": "DOM_CROP",
                "title": "Identifying pests and diseases",
                "description": "Crop scouting and monitoring for pest/disease identification.",
            },
            {
                "job_id": "agri_crop_007",
                "category_id": "DOM_CROP",
                "title": "Spraying pesticides",
                "description": "Safe application of pesticides using sprayers.",
            },
            {
                "job_id": "agri_crop_008",
                "category_id": "DOM_CROP",
                "title": "Harvesting crops",
                "description": "Manual harvesting of fruits, vegetables, or field crops.",
            },
            {
                "job_id": "agri_crop_012",
                "category_id": "DOM_CROP",
                "title": "Working in a greenhouse",
                "description": "Greenhouse crop production and management.",
            },
            {
                "job_id": "agri_crop_013",
                "category_id": "DOM_CROP",
                "title": "Managing a nursery",
                "description": "Nursery bed preparation and seedling management.",
            },
            {
                "job_id": "agri_live_001",
                "category_id": "DOM_LIVE",
                "title": "Feeding dairy cows",
                "description": "Livestock feeding and nutrition management.",
            },
            {
                "job_id": "agri_live_002",
                "category_id": "DOM_LIVE",
                "title": "Milking cows by hand",
                "description": "Manual milking techniques.",
            },
            {
                "job_id": "agri_live_003",
                "category_id": "DOM_LIVE",
                "title": "Milking cows with machine",
                "description": "Operating milking machines.",
            },
            {
                "job_id": "agri_live_004",
                "category_id": "DOM_LIVE",
                "title": "Cleaning animal housing",
                "description": "Livestock housing hygiene and sanitation.",
            },
            {
                "job_id": "agri_live_005",
                "category_id": "DOM_LIVE",
                "title": "Checking animals for illness",
                "description": "Animal health monitoring and basic diagnostics.",
            },
            {
                "job_id": "agri_live_009",
                "category_id": "DOM_LIVE",
                "title": "Feeding poultry",
                "description": "Poultry feeding and care.",
            },
            {
                "job_id": "agri_crop_010",
                "category_id": "DOM_MACH",
                "title": "Operating a tractor",
                "description": "Tractor operation for field preparation.",
            },
            {
                "job_id": "agri_mach_001",
                "category_id": "DOM_MACH",
                "title": "Operating irrigation pumps",
                "description": "Water pump operation and maintenance.",
            },
            {
                "job_id": "agri_mach_002",
                "category_id": "DOM_MACH",
                "title": "Using power tools",
                "description": "Safe operation of power tools and equipment.",
            },
            {
                "job_id": "agri_crop_009",
                "category_id": "DOM_POST",
                "title": "Sorting and grading produce",
                "description": "Quality grading and standardization of agricultural products.",
            },
            {
                "job_id": "agri_post_001",
                "category_id": "DOM_POST",
                "title": "Packaging produce",
                "description": "Packaging and preparing produce for market.",
            },
            {
                "job_id": "agri_post_002",
                "category_id": "DOM_POST",
                "title": "Storage management",
                "description": "Post-harvest storage and preservation.",
            },
            {
                "job_id": "agri_mgmt_001",
                "category_id": "DOM_MGMT",
                "title": "Farm record keeping",
                "description": "Documentation and record management.",
            },
            {
                "job_id": "agri_mgmt_002",
                "category_id": "DOM_MGMT",
                "title": "Inventory management",
                "description": "Tracking inputs, outputs, and supplies.",
            },
        ]

        self.stdout.write("\nCreating jobs...")
        crop_cat = JobCategory.objects.get(category_id="DOM_CROP")
        live_cat = JobCategory.objects.get(category_id="DOM_LIVE")
        mach_cat = JobCategory.objects.get(category_id="DOM_MACH")
        post_cat = JobCategory.objects.get(category_id="DOM_POST")
        mgmt_cat = JobCategory.objects.get(category_id="DOM_MGMT")

        category_map = {
            "DOM_CROP": crop_cat,
            "DOM_LIVE": live_cat,
            "DOM_MACH": mach_cat,
            "DOM_POST": post_cat,
            "DOM_MGMT": mgmt_cat,
        }

        for job_data in jobs_data:
            category = category_map[job_data["category_id"]]
            job, created = Job.objects.get_or_create(
                job_id=job_data["job_id"],
                defaults={
                    "category": category,
                    "title": job_data["title"],
                    "description": job_data["description"],
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created job: {job.title}"))
            else:
                self.stdout.write(f"  -> Job already exists: {job.title}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSuccessfully seeded job categories and jobs.\n\n"
                f"   Total categories: {JobCategory.objects.count()}\n"
                f"   Total jobs: {Job.objects.count()}"
            )
        )
