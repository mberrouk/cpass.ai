# TODO: This script can be removed

"""
Script to export data from Supabase to JSON files.
Run this script to export workers, profiles, and authentication data.

Usage:
    python scripts/export_from_supabase.py
"""
import os
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Supabase configuration from .env
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def export_worker_profiles():
    """
    Export all worker profiles from Supabase.
    """
    print("Exporting worker profiles...")
    try:
        response = supabase.table('worker_profiles').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} worker profiles")
        return data
    except Exception as e:
        print(f"Error exporting worker profiles: {e}")
        return []


def export_worker_skills():
    """
    Export all worker skills from Supabase.
    """
    print("Exporting worker skills...")
    try:
        response = supabase.table('worker_skills').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} worker skills")
        return data
    except Exception as e:
        print(f"Error exporting worker skills: {e}")
        return []


def export_worker_certifications():
    """
    Export all worker certifications from Supabase.
    """
    print("Exporting worker certifications...")
    try:
        response = supabase.table('worker_certifications').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} worker certifications")
        return data
    except Exception as e:
        print(f"Error exporting worker certifications: {e}")
        return []


def export_worker_domains():
    """
    Export all worker domains from Supabase.
    """
    print("Exporting worker domains...")
    try:
        response = supabase.table('worker_domains').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} worker domains")
        return data
    except Exception as e:
        print(f"Error exporting worker domains: {e}")
        return []


def export_upload_batches():
    """
    Export all upload batches from Supabase.
    """
    print("Exporting upload batches...")
    try:
        response = supabase.table('upload_batches').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} upload batches")
        return data
    except Exception as e:
        print(f"Error exporting upload batches: {e}")
        return []


def export_bulk_uploaded_workers():
    """
    Export all bulk uploaded workers from Supabase.
    """
    print("Exporting bulk uploaded workers...")
    try:
        response = supabase.table('bulk_uploaded_workers').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} bulk uploaded workers")
        return data
    except Exception as e:
        print(f"Error exporting bulk uploaded workers: {e}")
        return []


def export_skill_mappings():
    """
    Export all skill mappings from Supabase.
    """
    print("Exporting skill mappings...")
    try:
        response = supabase.table('skill_mappings').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} skill mappings")
        return data
    except Exception as e:
        print(f"Error exporting skill mappings: {e}")
        return []


def export_column_mappings():
    """
    Export all column mappings from Supabase.
    """
    print("Exporting column mappings...")
    try:
        response = supabase.table('column_mappings').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} column mappings")
        return data
    except Exception as e:
        print(f"Error exporting column mappings: {e}")
        return []


def export_tvet_institutions():
    """
    Export all TVET institutions from Supabase.
    """
    print("Exporting TVET institutions...")
    try:
        response = supabase.table('tvet_institutions').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} TVET institutions")
        return data
    except Exception as e:
        print(f"Error exporting TVET institutions: {e}")
        return []


def export_tvet_auth():
    """
    Export all TVET auth records from Supabase.
    """
    print("Exporting TVET auth records...")
    try:
        response = supabase.table('tvet_auth').select('*').execute()
        data = response.data
        print(f"Exported {len(data)} TVET auth records")
        return data
    except Exception as e:
        print(f"Error exporting TVET auth: {e}")
        return []


def main():
    """
    Main function to export all data from Supabase.
    """
    print("=" * 50)
    print("Supabase Data Export Script")
    print("=" * 50)

    # Create exports directory
    exports_dir = 'exports'
    if not os.path.exists(exports_dir):
        os.makedirs(exports_dir)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Export all tables
    exports = {
        'worker_profiles': export_worker_profiles(),
        'worker_skills': export_worker_skills(),
        'worker_certifications': export_worker_certifications(),
        'worker_domains': export_worker_domains(),
        'upload_batches': export_upload_batches(),
        'bulk_uploaded_workers': export_bulk_uploaded_workers(),
        'skill_mappings': export_skill_mappings(),
        'column_mappings': export_column_mappings(),
        'tvet_institutions': export_tvet_institutions(),
        'tvet_auth': export_tvet_auth(),
    }

    # Save to JSON file
    output_file = os.path.join(exports_dir, f'supabase_export_{timestamp}.json')
    with open(output_file, 'w') as f:
        json.dump(exports, f, indent=2, default=str)

    print("\n" + "=" * 50)
    print(f"Export completed successfully!")
    print(f"Data saved to: {output_file}")
    print("=" * 50)

    # Print summary
    print("\nSummary:")
    for table, data in exports.items():
        print(f"  {table}: {len(data)} records")


if __name__ == '__main__':
    main()
