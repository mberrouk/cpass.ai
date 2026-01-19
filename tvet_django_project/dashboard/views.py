"""
TVET Dashboard API Views.

These endpoints serve the TVET Dashboard frontend.
"""

import csv
import io
import uuid
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Institution,
    StaffUser,
    UploadBatch,
    CandidateNote,
    ContactLog,
    CandidateAssessment,
)
from .cpass_client import get_cpass_client, CPASSAPIError


# AUTHENTICATION


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate staff user and return JWT tokens.
    """
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = StaffUser.objects.select_related("institution").get(email=email)
        if not user.check_password(password):
            raise StaffUser.DoesNotExist
    except StaffUser.DoesNotExist:
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {"error": "Account is disabled"}, status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
            },
            "institution": {
                "id": str(user.institution.id),
                "name": user.institution.institution_name,
                "code": user.institution.institution_code,
            },
        }
    )


# INSTITUTION


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_institution(request):
    """Get the current user's institution details."""
    institution = request.user.institution

    return Response(
        {
            "data": {
                "id": str(institution.id),
                "institution_name": institution.institution_name,
                "institution_code": institution.institution_code,
                "institution_type": institution.institution_type,
                "location": institution.location,
                "country": institution.country,
                "contact_person": institution.contact_person,
                "contact_email": institution.contact_email,
                "contact_phone": institution.contact_phone,
                "created_at": (
                    institution.created_at.isoformat()
                    if institution.created_at
                    else None
                ),
            }
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    """
    Get dashboard statistics.
    """
    institution = request.user.institution

    assessments = CandidateAssessment.objects.filter(institution=institution)

    total_local = assessments.count()

    cpass_client = get_cpass_client(institution)
    cpass_stats = None
    total_cpass_workers = 0

    if cpass_client:
        try:
            cpass_stats = cpass_client.get_stats()
            total_cpass_workers = (
                cpass_stats.get("total_workers", 0) if cpass_stats else 0
            )
        except CPASSAPIError as e:
            return Response(
                {
                    "message": e.message or "Failed to fetch CPASS stats",
                    "details": e.details or {},
                },
                status=e.status_code or status.HTTP_502_BAD_GATEWAY,
            )

    # TODO: Merge CPASS stats with local assessment stats
    # For now, just return both sets of data
    status_counts = dict(
        assessments.values("assessment_status")
        .annotate(count=Count("id"))
        .values_list("assessment_status", "count")
    )

    tier_counts = dict(
        assessments.values("worker_tier")
        .annotate(count=Count("id"))
        .values_list("worker_tier", "count")
    )

    batch_count = UploadBatch.objects.filter(institution=institution).count()

    total_candidates = max(total_cpass_workers, total_local)

    return Response(
        {
            "data": {
                "rpl_candidates": total_candidates,
                "verified_graduates": status_counts.get("certified", 0),
                "active_students": status_counts.get("in_progress", 0),
                "total_batches": batch_count,
                "skill_distribution": {
                    "bronze": tier_counts.get("bronze", 0),
                    "silver": tier_counts.get("silver", 0),
                    "gold": tier_counts.get("gold", 0),
                    "platinum": tier_counts.get("platinum", 0),
                },
                "institution": {
                    "name": institution.institution_name,
                    "code": institution.institution_code,
                    "location": institution.location or "",
                },
                "cpass_synced": cpass_stats is not None,
                "cpass_total_workers": total_cpass_workers,
                "local_assessments": total_local,
            }
        }
    )


# RPL CANDIDATES


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_rpl_candidates(request):
    """
    Get RPL candidates for the institution.
    """
    institution = request.user.institution

    # Query parameters
    assessment_status = request.query_params.get("status")
    min_match = request.query_params.get("min_match")
    max_match = request.query_params.get("max_match")

    assessments = CandidateAssessment.objects.filter(institution=institution)
    local_assessment_map = {}

    for assessment in assessments:
        local_assessment_map[str(assessment.worker_id)] = assessment

    if min_match:
        assessments = assessments.filter(certification_match__gte=int(min_match))

    if max_match:
        assessments = assessments.filter(certification_match__lte=int(max_match))

    cpass_client = get_cpass_client(institution)
    cpass_workers = {}
    all_worker_ids = set()

    if cpass_client:
        try:
            result = cpass_client.list_workers(page_size=100)
            for worker in result.get("workers", []):
                cpass_workers[worker["id"]] = worker
                all_worker_ids.add(worker["id"])
        except CPASSAPIError as e:
            return Response(
                {
                    "message": e.message or "Failed to fetch CPASS workers",
                    "details": e.details or {},
                },
                status=e.status_code or status.HTTP_502_BAD_GATEWAY,
            )

    # Also add worker IDs from local assessments
    # for worker_id in local_assessment_map.keys():
    #     all_worker_ids.add(worker_id)

    # Build response - combine CPASS data with local assessments
    candidates = []
    for worker_id in all_worker_ids:
        cpass_data = cpass_workers.get(worker_id, {})
        assessment = local_assessment_map.get(worker_id)

        # Get status - prefer local assessment status if exists, otherwise use CPASS verification_status
        candidate_status = "identified"  # Default for self-registered workers
        if assessment:
            candidate_status = assessment.assessment_status
        elif cpass_data.get("verification_status"):
            # Map verification_status to assessment_status
            vs = cpass_data.get("verification_status")
            if vs == "verified":
                candidate_status = "certified"
            elif vs == "pending":
                candidate_status = "identified"
            elif vs == "rejected":
                candidate_status = "identified"

        # Filter by status if specified
        if assessment_status and candidate_status != assessment_status:
            continue

        candidates.append(
            {
                "id": worker_id,
                "full_name": cpass_data.get(
                    "full_name", assessment.worker_name if assessment else "Unknown"
                ),
                "email": cpass_data.get("email", ""),
                "phone_number": cpass_data.get(
                    "phone_number", assessment.worker_phone if assessment else ""
                ),
                "location": cpass_data.get("location", ""),
                "tier": cpass_data.get(
                    "tier", assessment.worker_tier if assessment else "bronze"
                ),
                "total_skills": cpass_data.get("total_skills", 0),
                "bronze_skills": cpass_data.get("bronze_skills", 0),
                "silver_skills": cpass_data.get("silver_skills", 0),
                "gold_skills": cpass_data.get("gold_skills", 0),
                "platinum_skills": cpass_data.get("platinum_skills", 0),
                "average_rating": cpass_data.get("average_rating", 0),
                "total_tasks_completed": cpass_data.get("total_tasks_completed", 0),
                "certification_match": (
                    assessment.certification_match if assessment else 0
                ),
                "assessment_status": candidate_status,
                "verification_status": cpass_data.get("verification_status", "pending"),
                "upload_source": cpass_data.get("upload_source", "self_registration"),
                "batch_id": (
                    str(assessment.batch_id)
                    if assessment and assessment.batch_id
                    else None
                ),
                "created_at": cpass_data.get("created_at")
                or (assessment.created_at.isoformat() if assessment else None),
            }
        )

    # Sort by created_at descending
    candidates.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    return Response(
        {
            "data": candidates,
            "count": len(candidates),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_rpl_candidate_detail(request, candidate_id):
    """Get detailed information about a specific candidate."""
    institution = request.user.institution

    try:
        assessment = CandidateAssessment.objects.get(
            institution=institution, worker_id=candidate_id
        )
    except CandidateAssessment.DoesNotExist:
        return Response(
            {"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # Try to get full CPASS data
    cpass_client = get_cpass_client(institution)
    cpass_data = {}
    skills = []

    if cpass_client:
        try:
            cpass_data = cpass_client.get_worker(str(candidate_id))
            skills = cpass_data.get("skills", [])
        except CPASSAPIError as e:
            return Response(
                {
                    "message": e.message or "Failed to fetch CPASS workers",
                    "details": e.details or {},
                },
                status=e.status_code or status.HTTP_502_BAD_GATEWAY,
            )

    # Get contact history
    contacts = ContactLog.objects.filter(
        institution=institution, worker_id=candidate_id
    ).order_by("-created_at")[:10]

    # Get notes
    notes = CandidateNote.objects.filter(
        institution=institution, worker_id=candidate_id
    ).order_by("-created_at")[:10]

    return Response(
        {
            "data": {
                "id": str(candidate_id),
                "full_name": cpass_data.get("full_name", assessment.worker_name),
                "email": cpass_data.get("email", ""),
                "phone_number": cpass_data.get("phone_number", assessment.worker_phone),
                "location": cpass_data.get("location", ""),
                "tier": cpass_data.get("tier", assessment.worker_tier),
                "total_skills": cpass_data.get("total_skills", 0),
                "bronze_skills": cpass_data.get("bronze_skills", 0),
                "silver_skills": cpass_data.get("silver_skills", 0),
                "gold_skills": cpass_data.get("gold_skills", 0),
                "platinum_skills": cpass_data.get("platinum_skills", 0),
                "average_rating": cpass_data.get("average_rating", 0),
                "total_tasks_completed": cpass_data.get("total_tasks_completed", 0),
                "certification_match": assessment.certification_match,
                "assessment_status": assessment.assessment_status,
                "batch_id": str(assessment.batch_id) if assessment.batch_id else None,
                "created_at": assessment.created_at.isoformat(),
                "skills": skills,
                "contact_history": [
                    {
                        "id": str(c.id),
                        "method": c.contact_method,
                        "notes": c.notes,
                        "created_at": c.created_at.isoformat(),
                    }
                    for c in contacts
                ],
                "notes": [
                    {
                        "id": str(n.id),
                        "note": n.note,
                        "created_at": n.created_at.isoformat(),
                    }
                    for n in notes
                ],
            }
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_candidate_contact(request, candidate_id):
    """Log a contact attempt with a candidate."""
    institution = request.user.institution

    if not CandidateAssessment.objects.filter(
        institution=institution, worker_id=candidate_id
    ).exists():
        return Response(
            {"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND
        )

    contact_method = request.data.get("contact_method")
    notes = request.data.get("notes", "")

    if contact_method not in ["sms", "whatsapp", "email", "phone"]:
        return Response(
            {"error": "Invalid contact method"}, status=status.HTTP_400_BAD_REQUEST
        )

    log = ContactLog.objects.create(
        institution=institution,
        worker_id=candidate_id,
        contact_method=contact_method,
        notes=notes,
        contacted_by=request.user,
    )

    return Response(
        {
            "data": {
                "id": str(log.id),
                "method": log.contact_method,
                "notes": log.notes,
                "created_at": log.created_at.isoformat(),
            }
        }
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_candidate_status(request, candidate_id):
    """Update a candidate's assessment status."""
    institution = request.user.institution

    try:
        assessment = CandidateAssessment.objects.get(
            institution=institution, worker_id=candidate_id
        )
    except CandidateAssessment.DoesNotExist:
        return Response(
            {"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get("assessment_status")
    valid_statuses = [s[0] for s in CandidateAssessment.ASSESSMENT_STATUS_CHOICES]

    if new_status not in valid_statuses:
        return Response(
            {"error": f"Invalid status. Must be one of: {valid_statuses}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    assessment.assessment_status = new_status
    assessment.save(update_fields=["assessment_status", "updated_at"])

    return Response(
        {
            "data": {
                "id": str(assessment.worker_id),
                "assessment_status": assessment.assessment_status,
                "updated_at": assessment.updated_at.isoformat(),
            }
        }
    )


# BULK UPLOAD


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_upload_batch(request):
    """Create a new upload batch."""
    institution = request.user.institution

    source_file_name = request.data.get("source_file_name", "Unknown")
    upload_mode = request.data.get("upload_mode", "demo")

    batch = UploadBatch.objects.create(
        batch_id=f"batch_{uuid.uuid4().hex[:12]}",
        institution=institution,
        source_file_name=source_file_name,
        upload_mode=upload_mode,
        uploaded_by=request.user,
    )

    return Response(
        {
            "data": {
                "batch_id": batch.batch_id,
                "source_file_name": batch.source_file_name,
                "worker_count": 0,
                "upload_mode": batch.upload_mode,
                "created_at": batch.created_at.isoformat(),
            }
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def parse_csv_file(request):
    """Parse a CSV file and return headers and preview rows."""
    if "file" not in request.FILES:
        return Response(
            {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    file = request.FILES["file"]

    try:
        # Read file content
        content = file.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))

        headers = reader.fieldnames or []
        rows = list(reader)

        # Return first 5 rows as preview
        preview_rows = rows[:5]

        return Response(
            {
                "data": {
                    "headers": headers,
                    "preview_rows": preview_rows,
                    "total_rows": len(rows),
                }
            }
        )

    except Exception as e:
        return Response(
            {"error": f"Failed to parse CSV: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_bulk_upload(request):
    """
    Process bulk upload - send workers to CPASS and create local assessments.
    """
    institution = request.user.institution

    batch_id = request.data.get("batch_id")
    workers = request.data.get("workers", [])
    column_mapping = request.data.get("column_mapping", {})

    try:
        batch = UploadBatch.objects.get(batch_id=batch_id, institution=institution)
    except UploadBatch.DoesNotExist:
        return Response({"error": "Batch not found"}, status=status.HTTP_404_NOT_FOUND)

    batch.status = "processing"
    batch.worker_count = len(workers)
    batch.save()

    mapped_workers = []
    for row in workers:
        mapped = {}
        for csv_col, field in column_mapping.items():
            if csv_col in row:
                mapped[field] = row[csv_col]
        mapped_workers.append(mapped)

    cpass_client = get_cpass_client(institution)

    if not cpass_client:
        # No CPASS integration - create local assessments only
        created_ids = []
        for worker in mapped_workers:
            assessment = CandidateAssessment.objects.create(
                institution=institution,
                worker_id=uuid.uuid4(),
                worker_name=worker.get("full_name", ""),
                worker_phone=worker.get("phone_number", ""),
                worker_tier="bronze",
                batch=batch,
            )
            created_ids.append(str(assessment.worker_id))

        batch.status = "completed"
        batch.success_count = len(created_ids)
        batch.worker_ids = created_ids
        batch.save()

        return Response(
            {
                "data": {
                    "batch_id": batch.batch_id,
                    "created_count": len(created_ids),
                    "errors": [],
                }
            }
        )

    # Send to CPASS API
    try:
        result = cpass_client.bulk_create_workers(mapped_workers)

        worker_ids = result.get("workers", [])
        for i, worker_id in enumerate(worker_ids):
            worker_data = mapped_workers[i] if i < len(mapped_workers) else {}
            CandidateAssessment.objects.create(
                institution=institution,
                worker_id=worker_id,
                worker_name=worker_data.get("full_name", ""),
                worker_phone=worker_data.get("phone_number", ""),
                worker_tier="bronze",
                batch=batch,
            )

        batch.status = "completed"
        batch.success_count = result.get("created", 0) + result.get("updated", 0)
        batch.error_count = len(result.get("errors", []))
        batch.worker_ids = worker_ids
        batch.errors = result.get("errors", [])
        batch.save()

        return Response(
            {
                "data": {
                    "batch_id": batch.batch_id,
                    "created_count": batch.success_count,
                    "errors": batch.errors,
                }
            }
        )

    except CPASSAPIError as e:
        batch.status = "failed"
        batch.errors = [{"error": str(e)}]
        batch.save()

        return Response(
            {"error": f"CPASS API error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_upload_batches(request):
    """Get upload batches for the institution."""
    institution = request.user.institution
    mode = request.query_params.get("mode", "all")

    batches = UploadBatch.objects.filter(institution=institution)

    if mode != "all":
        batches = batches.filter(upload_mode=mode)

    return Response(
        {
            "data": [
                {
                    "batch_id": b.batch_id,
                    "source_file_name": b.source_file_name,
                    "worker_count": b.worker_count,
                    "upload_mode": b.upload_mode,
                    "status": b.status,
                    "created_at": b.created_at.isoformat(),
                }
                for b in batches
            ],
            "count": batches.count(),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_upload_batch(request, batch_id):
    """Delete an upload batch."""
    institution = request.user.institution

    try:
        batch = UploadBatch.objects.get(batch_id=batch_id, institution=institution)
    except UploadBatch.DoesNotExist:
        return Response({"error": "Batch not found"}, status=status.HTTP_404_NOT_FOUND)

    CandidateAssessment.objects.filter(batch=batch).delete()
    batch.delete()

    return Response({"data": {"deleted": True}})


# ANALYTICS


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_analytics(request):
    """Get analytics data for the institution."""
    institution = request.user.institution

    assessments = CandidateAssessment.objects.filter(institution=institution)
    total = assessments.count()

    status_dist = list(
        assessments.values("assessment_status").annotate(count=Count("id"))
    )

    tier_dist = dict(
        assessments.values("worker_tier")
        .annotate(count=Count("id"))
        .values_list("worker_tier", "count")
    )

    certification_ready = assessments.filter(certification_match__gte=80).count()

    in_progress = assessments.filter(assessment_status="in_progress").count()

    early_stage = assessments.filter(
        assessment_status__in=["identified", "contacted"]
    ).count()

    monthly_trend = []

    return Response(
        {
            "data": {
                "total_candidates": total,
                "certification_ready": certification_ready,
                "in_progress": in_progress,
                "early_stage": early_stage,
                "tier_distribution": {
                    "bronze": tier_dist.get("bronze", 0),
                    "silver": tier_dist.get("silver", 0),
                    "gold": tier_dist.get("gold", 0),
                    "platinum": tier_dist.get("platinum", 0),
                },
                "status_distribution": status_dist,
                "monthly_trend": monthly_trend,
            }
        }
    )
