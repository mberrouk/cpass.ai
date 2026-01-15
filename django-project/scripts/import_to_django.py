"""
Script to import data from Supabase export JSON to Django database.
Run this after running export_from_supabase.py.

Usage:
    python manage.py shell < scripts/import_to_django.py
    Or:
    python scripts/import_to_django.py (if Django is set up in path)
"""
import os
import sys
import json
import django
from datetime import datetime

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cpass_backend.settings')
django.setup()

from workers.models import (
    CustomUser, WorkerProfile, WorkerSkill, WorkerCertification,
    WorkerDomain, UploadBatch, BulkUploadedWorker, SkillMapping,
    ColumnMapping, TVETInstitution, TVETAuth
)
from django.db import transaction


def load_export_file(filename):
    """
    Load the latest export file.
    """
    exports_dir = 'exports'
    if filename:
        filepath = os.path.join(exports_dir, filename)
    else:
        # Get the latest export file
        files = [f for f in os.listdir(exports_dir) if f.startswith('supabase_export_')]
        if not files:
            print("No export files found in exports/ directory")
            return None
        latest_file = sorted(files)[-1]
        filepath = os.path.join(exports_dir, latest_file)

    print(f"Loading export file: {filepath}")
    with open(filepath, 'r') as f:
        return json.load(f)


def import_worker_profiles(profiles_data, user_map):
    """
    Import worker profiles and create corresponding auth users.
    """
    print(f"\nImporting {len(profiles_data)} worker profiles...")
    imported = 0

    for profile in profiles_data:
        try:
            with transaction.atomic():
                # Create auth user if not exists
                profile_id = profile['id']

                if profile_id not in user_map:
                    # Create user
                    email = profile.get('email') or f"{profile.get('phone_number', 'worker')}@temp.cpass.worker"
                    user = CustomUser.objects.create_user(
                        id=profile_id,
                        email=email,
                        phone_number=profile.get('phone_number'),
                        full_name=profile.get('full_name'),
                        user_type='worker'
                    )
                    user.set_password('DefaultPassword123!')  # Set a default password
                    user.save()
                    user_map[profile_id] = user
                else:
                    user = user_map[profile_id]

                # Create worker profile
                WorkerProfile.objects.update_or_create(
                    id=profile['id'],
                    defaults={
                        'user': user,
                        'full_name': profile.get('full_name', ''),
                        'email': profile.get('email'),
                        'phone_number': profile.get('phone_number', ''),
                        'location': profile.get('location'),
                        'tier': profile.get('tier', 'bronze'),
                        'overall_tier': profile.get('overall_tier', 'bronze'),
                        'trust_score': profile.get('trust_score', 0),
                        'total_points': profile.get('total_points', 0),
                        'total_skills': profile.get('total_skills', 0),
                        'bronze_skills': profile.get('bronze_skills', 0),
                        'silver_skills': profile.get('silver_skills', 0),
                        'gold_skills': profile.get('gold_skills', 0),
                        'platinum_skills': profile.get('platinum_skills', 0),
                        'work_status': profile.get('work_status', 'available'),
                        'experience_duration': profile.get('experience_duration'),
                        'invited_by_org': profile.get('invited_by_org'),
                        'invited_by_type': profile.get('invited_by_type'),
                        'invitation_code': profile.get('invitation_code'),
                        'upload_source': profile.get('upload_source', 'self_registration'),
                    }
                )
                imported += 1
        except Exception as e:
            print(f"Error importing profile {profile.get('id')}: {e}")

    print(f"Imported {imported} worker profiles")


def import_worker_skills(skills_data):
    """
    Import worker skills.
    """
    print(f"\nImporting {len(skills_data)} worker skills...")
    imported = 0

    for skill in skills_data:
        try:
            worker_id = skill.get('worker_id')
            if not worker_id:
                continue

            WorkerSkill.objects.update_or_create(
                id=skill['id'],
                defaults={
                    'worker_id': worker_id,
                    'skill_id': skill.get('skill_id'),
                    'skill_name': skill.get('skill_name', ''),
                    'proficiency_level': skill.get('proficiency_level'),
                    'proficiency_rating': skill.get('proficiency_rating', 1),
                    'frequency': skill.get('frequency'),
                    'years_experience': skill.get('years_experience'),
                    'supervision_level': skill.get('supervision_level'),
                    'scale_context': skill.get('scale_context', []),
                    'evidence_types': skill.get('evidence_types', []),
                    'reference_contact': skill.get('reference_contact'),
                    'skill_verification_tier': skill.get('skill_verification_tier', 'bronze'),
                    'verification_source': skill.get('verification_source', 'self_reported'),
                    'verified_by': skill.get('verified_by'),
                    'last_practiced_date': skill.get('last_practiced_date'),
                    'credibility_score': skill.get('credibility_score', 0),
                }
            )
            imported += 1
        except Exception as e:
            print(f"Error importing skill {skill.get('id')}: {e}")

    print(f"Imported {imported} worker skills")


def import_worker_certifications(certs_data):
    """
    Import worker certifications.
    """
    print(f"\nImporting {len(certs_data)} worker certifications...")
    imported = 0

    for cert in certs_data:
        try:
            worker_id = cert.get('worker_id')
            if not worker_id:
                continue

            WorkerCertification.objects.update_or_create(
                id=cert['id'],
                defaults={
                    'worker_id': worker_id,
                    'certification_name': cert.get('certification_name', ''),
                    'issuing_organization': cert.get('issuing_organization'),
                    'issue_date': cert.get('issue_date'),
                    'expiry_date': cert.get('expiry_date'),
                    'certification_url': cert.get('certification_url'),
                }
            )
            imported += 1
        except Exception as e:
            print(f"Error importing certification {cert.get('id')}: {e}")

    print(f"Imported {imported} worker certifications")


def import_worker_domains(domains_data):
    """
    Import worker domains.
    """
    print(f"\nImporting {len(domains_data)} worker domains...")
    imported = 0

    for domain in domains_data:
        try:
            worker_id = domain.get('worker_id')
            if not worker_id:
                continue

            WorkerDomain.objects.update_or_create(
                id=domain['id'],
                defaults={
                    'worker_id': worker_id,
                    'domain_name': domain.get('domain_name', ''),
                }
            )
            imported += 1
        except Exception as e:
            print(f"Error importing domain {domain.get('id')}: {e}")

    print(f"Imported {imported} worker domains")


def import_tvet_institutions(institutions_data):
    """
    Import TVET institutions.
    """
    print(f"\nImporting {len(institutions_data)} TVET institutions...")
    imported = 0

    for inst in institutions_data:
        try:
            TVETInstitution.objects.update_or_create(
                id=inst['id'],
                defaults={
                    'institution_code': inst.get('institution_code', ''),
                    'institution_name': inst.get('institution_name', ''),
                    'location': inst.get('location'),
                    'contact_email': inst.get('contact_email'),
                    'contact_phone': inst.get('contact_phone'),
                }
            )
            imported += 1
        except Exception as e:
            print(f"Error importing institution {inst.get('id')}: {e}")

    print(f"Imported {imported} TVET institutions")


def import_upload_batches(batches_data):
    """
    Import upload batches.
    """
    print(f"\nImporting {len(batches_data)} upload batches...")
    imported = 0

    for batch in batches_data:
        try:
            UploadBatch.objects.update_or_create(
                id=batch['id'],
                defaults={
                    'batch_id': batch.get('batch_id', ''),
                    'institution_code': batch.get('institution_code', ''),
                    'upload_mode': batch.get('upload_mode', 'bulk'),
                    'status': batch.get('status', 'pending'),
                    'total_workers': batch.get('total_workers', 0),
                    'processed_workers': batch.get('processed_workers', 0),
                }
            )
            imported += 1
        except Exception as e:
            print(f"Error importing batch {batch.get('id')}: {e}")

    print(f"Imported {imported} upload batches")


def import_bulk_uploaded_workers(workers_data):
    """
    Import bulk uploaded workers.
    """
    print(f"\nImporting {len(workers_data)} bulk uploaded workers...")
    imported = 0

    for worker in workers_data:
        try:
            batch_id = worker.get('batch_id')
            if not batch_id:
                continue

            BulkUploadedWorker.objects.update_or_create(
                id=worker['id'],
                defaults={
                    'batch_id': batch_id,
                    'full_name': worker.get('full_name', ''),
                    'phone_number': worker.get('phone_number'),
                    'location': worker.get('location'),
                    'raw_data': worker.get('raw_data', {}),
                }
            )
            imported += 1
        except Exception as e:
            print(f"Error importing bulk worker {worker.get('id')}: {e}")

    print(f"Imported {imported} bulk uploaded workers")


def import_skill_mappings(mappings_data):
    """
    Import skill mappings.
    """
    print(f"\nImporting {len(mappings_data)} skill mappings...")
    imported = 0

    for mapping in mappings_data:
        try:
            worker_id = mapping.get('worker_id')
            batch_id = mapping.get('batch_id')
            if not worker_id or not batch_id:
                continue

            SkillMapping.objects.update_or_create(
                id=mapping['id'],
                defaults={
                    'worker_id': worker_id,
                    'batch_id': batch_id,
                    'skill_id': mapping.get('skill_id'),
                    'skill_name': mapping.get('skill_name', ''),
                    'original_task_name': mapping.get('original_task_name'),
                    'canonical_task_matched': mapping.get('canonical_task_matched'),
                    'confidence_score': mapping.get('confidence_score', 0.0),
                    'confidence_tier': mapping.get('confidence_tier'),
                    'matching_method': mapping.get('matching_method'),
                }
            )
            imported += 1
        except Exception as e:
            print(f"Error importing skill mapping {mapping.get('id')}: {e}")

    print(f"Imported {imported} skill mappings")


def import_column_mappings(mappings_data):
    """
    Import column mappings.
    """
    print(f"\nImporting {len(mappings_data)} column mappings...")
    imported = 0

    for mapping in mappings_data:
        try:
            batch_id = mapping.get('batch_id')
            if not batch_id:
                continue

            ColumnMapping.objects.update_or_create(
                id=mapping['id'],
                defaults={
                    'batch_id': batch_id,
                    'csv_column': mapping.get('csv_column', ''),
                    'mapped_field': mapping.get('mapped_field', ''),
                }
            )
            imported += 1
        except Exception as e:
            print(f"Error importing column mapping {mapping.get('id')}: {e}")

    print(f"Imported {imported} column mappings")


def main():
    """
    Main import function.
    """
    print("=" * 50)
    print("Django Import Script")
    print("=" * 50)

    # Load export file
    data = load_export_file(None)
    if not data:
        return

    # User map to track created users
    user_map = {}

    # Import in order (respecting foreign key dependencies)
    import_tvet_institutions(data.get('tvet_institutions', []))
    import_worker_profiles(data.get('worker_profiles', []), user_map)
    import_worker_skills(data.get('worker_skills', []))
    import_worker_certifications(data.get('worker_certifications', []))
    import_worker_domains(data.get('worker_domains', []))
    import_upload_batches(data.get('upload_batches', []))
    import_bulk_uploaded_workers(data.get('bulk_uploaded_workers', []))
    import_skill_mappings(data.get('skill_mappings', []))
    import_column_mappings(data.get('column_mappings', []))

    print("\n" + "=" * 50)
    print("Import completed successfully!")
    print("=" * 50)


if __name__ == '__main__':
    main()
