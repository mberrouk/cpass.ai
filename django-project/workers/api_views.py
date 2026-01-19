"""
Public API Views for CPASS.

These endpoints are consumed by external applications like TVET Dashboard.
Authentication is via API Key (X-API-Key header).

Endpoints:
- GET /api/public/workers/ - List workers affiliated with the institution
- GET /api/public/workers/<id>/ - Get worker details
- POST /api/public/workers/bulk/ - Bulk create workers with institution affiliation
- GET /api/public/stats/ - Get institution statistics
- POST /api/public/workers/<id>/verify/ - Verify worker affiliation
"""

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from django.utils import timezone
from django.db.models import Count, Q

from .api_auth import APIKeyAuthentication
from .users_models import WorkerProfile, WorkerSkill
from .tvet_models import TVETInstitution


class IsAPIKeyAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return request.auth is not None and isinstance(request.auth, TVETInstitution)


@api_view(["GET"])
@authentication_classes([APIKeyAuthentication])
@permission_classes([IsAPIKeyAuthenticated])
def list_affiliated_workers(request):
    institution = request.auth

    queryset = (
        WorkerProfile.objects.filter(claimed_institution=institution)
        .select_related("claimed_institution")
        .prefetch_related("worker_skills")
    )

    verification_status = request.query_params.get("status")
    if verification_status:
        queryset = queryset.filter(verification_status=verification_status)

    tier = request.query_params.get("tier")
    if tier:
        queryset = queryset.filter(tier=tier)

    search = request.query_params.get("search")
    if search:
        queryset = queryset.filter(
            Q(full_name__icontains=search)
            | Q(phone_number__icontains=search)
            | Q(email__icontains=search)
        )

    page = int(request.query_params.get("page", 1))
    page_size = min(int(request.query_params.get("page_size", 20)), 100)

    total = queryset.count()
    pages = (total + page_size - 1) // page_size

    start = (page - 1) * page_size
    end = start + page_size

    workers = queryset.order_by("-created_at")[start:end]

    workers_data = []
    for worker in workers:
        skills = list(
            worker.worker_skills.values(
                "skill_name", "skill_verification_tier", "proficiency_level"
            )
        )
        workers_data.append(
            {
                "id": str(worker.id),
                "full_name": worker.full_name,
                "email": worker.email,
                "phone_number": worker.phone_number,
                "location": worker.location,
                "tier": worker.tier,
                "overall_tier": worker.overall_tier,
                "trust_score": worker.trust_score,
                "work_status": worker.work_status,
                "verification_status": worker.verification_status,
                "verified_at": (
                    worker.verified_at.isoformat() if worker.verified_at else None
                ),
                "upload_source": worker.upload_source,
                "skills": skills,
                "total_skills": worker.total_skills,
                "bronze_skills": worker.bronze_skills,
                "silver_skills": worker.silver_skills,
                "gold_skills": worker.gold_skills,
                "platinum_skills": worker.platinum_skills,
                "created_at": worker.created_at.isoformat(),
            }
        )

    return Response(
        {
            "workers": workers_data,
            "total": total,
            "page": page,
            "pages": pages,
            "institution": {
                "code": institution.institution_code,
                "name": institution.institution_name,
            },
        }
    )


@api_view(["GET"])
@authentication_classes([APIKeyAuthentication])
@permission_classes([IsAPIKeyAuthenticated])
def get_worker_detail(request, worker_id):
    institution = request.auth

    try:
        worker = (
            WorkerProfile.objects.select_related("claimed_institution")
            .prefetch_related("worker_skills", "certifications", "domains")
            .get(id=worker_id, claimed_institution=institution)
        )
    except WorkerProfile.DoesNotExist:
        return Response(
            {"error": "Worker not found or not affiliated with your institution"},
            status=status.HTTP_404_NOT_FOUND,
        )

    skills = list(
        worker.worker_skills.values(
            "id",
            "skill_name",
            "skill_verification_tier",
            "proficiency_level",
            "proficiency_rating",
            "years_experience",
            "verification_source",
            "verified_by",
            "credibility_score",
            "created_at",
        )
    )

    certifications = list(
        worker.certifications.values(
            "id",
            "certification_name",
            "issuing_organization",
            "issue_date",
            "expiry_date",
            "certification_url",
        )
    )

    domains = list(worker.domains.values("id", "domain_name"))

    return Response(
        {
            "id": str(worker.id),
            "full_name": worker.full_name,
            "email": worker.email,
            "phone_number": worker.phone_number,
            "location": worker.location,
            "bio": worker.bio,
            "tier": worker.tier,
            "overall_tier": worker.overall_tier,
            "trust_score": worker.trust_score,
            "total_points": worker.total_points,
            "total_skills": worker.total_skills,
            "bronze_skills": worker.bronze_skills,
            "silver_skills": worker.silver_skills,
            "gold_skills": worker.gold_skills,
            "platinum_skills": worker.platinum_skills,
            "work_status": worker.work_status,
            "experience_duration": worker.experience_duration,
            "reputation_score": float(worker.reputation_score),
            "total_tasks_completed": worker.total_tasks_completed,
            "total_tasks_assigned": worker.total_tasks_assigned,
            "average_rating": float(worker.average_rating),
            "completion_rate": worker.completion_rate,
            "verification_status": worker.verification_status,
            "verified_at": (
                worker.verified_at.isoformat() if worker.verified_at else None
            ),
            "verification_notes": worker.verification_notes,
            "skills": skills,
            "certifications": certifications,
            "domains": domains,
            "upload_source": worker.upload_source,
            "created_at": worker.created_at.isoformat(),
            "updated_at": worker.updated_at.isoformat(),
        }
    )


@api_view(["POST"])
@authentication_classes([APIKeyAuthentication])
@permission_classes([IsAPIKeyAuthenticated])
def bulk_create_workers(request):
    institution = request.auth
    workers_data = request.data.get("workers", [])

    if not workers_data:
        return Response(
            {"error": "No workers provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    if len(workers_data) > 500:
        return Response(
            {"error": "Maximum 500 workers per request"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    created_count = 0
    updated_count = 0
    errors = []
    worker_ids = []

    for idx, worker_data in enumerate(workers_data):
        try:
            full_name = worker_data.get("full_name")
            phone_number = worker_data.get("phone_number")

            if not full_name or not phone_number:
                errors.append(
                    {"index": idx, "error": "full_name and phone_number are required"}
                )
                continue

            worker, created = WorkerProfile.objects.get_or_create(
                phone_number=phone_number,
                defaults={
                    "full_name": full_name,
                    "email": worker_data.get("email"),
                    "location": worker_data.get("location"),
                    "claimed_institution": institution,
                    "verification_status": "pending",
                    "upload_source": "tvet_bulk_upload",
                },
            )

            if created:
                created_count += 1
            else:
                if worker.claimed_institution is None:
                    worker.claimed_institution = institution
                    worker.verification_status = "pending"
                    worker.save(
                        update_fields=[
                            "claimed_institution",
                            "verification_status",
                            "updated_at",
                        ]
                    )
                    updated_count += 1

            worker_ids.append(str(worker.id))

            skills = worker_data.get("skills", [])
            for skill_name in skills:
                WorkerSkill.objects.get_or_create(
                    worker=worker,
                    skill_name=skill_name,
                    defaults={
                        "verification_source": "tvet_upload",
                        "verified_by": institution.institution_name,
                    },
                )

        except Exception as e:
            errors.append({"index": idx, "error": str(e)})

    return Response(
        {
            "created": created_count,
            "updated": updated_count,
            "errors": errors,
            "workers": worker_ids,
            "institution": institution.institution_code,
        },
        status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_200_OK,
    )


@api_view(["GET"])
@authentication_classes([APIKeyAuthentication])
@permission_classes([IsAPIKeyAuthenticated])
def get_institution_stats(request):

    institution = request.auth

    base_queryset = WorkerProfile.objects.filter(claimed_institution=institution)
    total_workers = base_queryset.count()

    by_status = dict(
        base_queryset.values("verification_status")
        .annotate(count=Count("id"))
        .values_list("verification_status", "count")
    )


    by_tier = dict(
        base_queryset.values("tier")
        .annotate(count=Count("id"))
        .values_list("tier", "count")
    )

    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    recent_registrations = base_queryset.filter(created_at__gte=thirty_days_ago).count()

    total_skills = WorkerSkill.objects.filter(
        worker__claimed_institution=institution
    ).count()

    return Response(
        {
            "institution": {
                "code": institution.institution_code,
                "name": institution.institution_name,
                "location": institution.location,
            },
            "total_workers": total_workers,
            "by_status": {
                "pending": by_status.get("pending", 0),
                "verified": by_status.get("verified", 0),
                "rejected": by_status.get("rejected", 0),
                "revoked": by_status.get("revoked", 0),
            },
            "by_tier": {
                "bronze": by_tier.get("bronze", 0),
                "silver": by_tier.get("silver", 0),
                "gold": by_tier.get("gold", 0),
                "platinum": by_tier.get("platinum", 0),
            },
            "recent_registrations": recent_registrations,
            "total_skills": total_skills,
        }
    )


@api_view(["POST"])
@authentication_classes([APIKeyAuthentication])
@permission_classes([IsAPIKeyAuthenticated])
def verify_worker_affiliation(request, worker_id):

    institution = request.auth

    try:
        worker = WorkerProfile.objects.get(
            id=worker_id, claimed_institution=institution
        )
    except WorkerProfile.DoesNotExist:
        return Response(
            {"error": "Worker not found or not affiliated with your institution"},
            status=status.HTTP_404_NOT_FOUND,
        )

    action = request.data.get("action")
    notes = request.data.get("notes", "")

    if action not in ["verify", "reject", "revoke"]:
        return Response(
            {"error": "action must be verify, reject, or revoke"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if action == "verify":
        worker.verification_status = "verified"
        worker.verified_at = timezone.now()
    elif action == "reject":
        worker.verification_status = "rejected"
        worker.verified_at = None
    elif action == "revoke":
        worker.verification_status = "revoked"

    if notes:
        worker.verification_notes = notes

    worker.save(
        update_fields=[
            "verification_status",
            "verified_at",
            "verification_notes",
            "updated_at",
        ]
    )

    return Response(
        {
            "id": str(worker.id),
            "full_name": worker.full_name,
            "verification_status": worker.verification_status,
            "verified_at": (
                worker.verified_at.isoformat() if worker.verified_at else None
            ),
            "verification_notes": worker.verification_notes,
            "message": f"Worker affiliation {action}d successfully",
        }
    )
