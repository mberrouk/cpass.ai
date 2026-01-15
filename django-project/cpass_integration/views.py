"""CPASS integration API views"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from workers.models import CustomUser as User, WorkerProfile
from work_management.models import Role
from telegram_bot.models import ConversationState, ContactVerification
import logging

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def cpass_onboarding(request):
    # DEPRECATED

    try:
        telegram_id = request.data.get("telegram_id")

        if not telegram_id:
            return Response(
                {"error": "telegram_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(telegram_id=telegram_id).exists():
            return Response(
                {"error": "User already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = f"{telegram_id}@telegram.user"
        user = User.objects.create(
            email=email,
            telegram_id=telegram_id,
            telegram_username=request.data.get("telegram_username", ""),
            full_name=request.data.get("full_name", ""),
            phone_number=request.data.get("phone_number", ""),
            user_type="worker",
        )

        worker_profile = WorkerProfile.objects.create(
            user=user,
            full_name=user.full_name,
            phone_number=user.phone_number,
            location=request.data.get("location", ""),
            experience_duration=request.data.get("experience_duration", ""),
        )

        ConversationState.objects.filter(telegram_id=telegram_id).delete()

        logger.info(
            f"CPASS onboarding completed for user {user.full_name} (telegram_id: {telegram_id})"
        )

        return Response(
            {
                "success": True,
                "message": "Registration completed successfully",
                "user_id": str(user.id),
                "full_name": user.full_name,
                "telegram_id": telegram_id,
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        logger.error(f"Error during CPASS onboarding: {str(e)}")
        return Response(
            {"error": f"Registration failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_user_by_telegram_id(request, telegram_id):
    """Get user info by telegram ID for the Web App"""
    try:
        user = User.objects.select_related("worker_profile").get(
            telegram_id=telegram_id
        )

        data = {
            "exists": True,
            "user_id": str(user.id),
            "full_name": user.full_name,
            "role": user.user_type,
            "telegram_username": user.telegram_username,
            "phone_number": user.phone_number or None,
            "contact_verified": True,  # User exists so contact is verified
        }

        if user.user_type == "worker" and hasattr(user, "worker_profile"):
            profile = user.worker_profile
            data["worker_profile"] = {
                "cpass_onboarding_completed": True,
                "has_supervisor": False,  # TODO: implement supervisor linkage
                "experience_duration": profile.experience_duration or "",
                "primary_domain_name": "",
            }

        return Response(data)

    except User.DoesNotExist:
        try:
            contact = ContactVerification.objects.get(telegram_id=telegram_id)
            return Response(
                {
                    "exists": False,
                    "contact_verified": True,
                    "phone_number": contact.phone_number,
                    "telegram_id": telegram_id,
                },
                status=status.HTTP_200_OK,
            )
        except ContactVerification.DoesNotExist:
            return Response(
                {
                    "exists": False,
                    "contact_verified": False,
                },
                status=status.HTTP_200_OK,
            )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_worker_profile(request, telegram_id):
    try:
        user = User.objects.select_related("worker_profile").get(
            telegram_id=telegram_id, user_type="worker"
        )

        profile = user.worker_profile

        data = {
            "full_name": user.full_name,
            "email": user.email,
            "phone_number": user.phone_number,
            "location": profile.location,
            "tier": profile.tier,
            "reputation_score": (
                float(profile.reputation_score)
                if hasattr(profile, "reputation_score")
                else 0
            ),
            "total_tasks_completed": (
                profile.total_tasks_completed
                if hasattr(profile, "total_tasks_completed")
                else 0
            ),
        }

        return Response(data)

    except User.DoesNotExist:
        return Response({"error": "Worker not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([AllowAny])
def save_worker_skills(request, telegram_id):
    try:
        user = User.objects.get(telegram_id=telegram_id, user_type="worker")

        # TODO: implement skill saving logic

        return Response({"success": True, "message": "Skills saved successfully"})

    except User.DoesNotExist:
        return Response({"error": "Worker not found"}, status=status.HTTP_404_NOT_FOUND)
