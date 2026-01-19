"""
Telegram Mini App integration views
"""

import hashlib
import hmac
import json
from urllib.parse import parse_qsl
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from telegram_bot.models import ContactVerification
from workers.users_models import WorkerProfile
from .auth_tokens import validate_auth_token, generate_auth_token

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def generate_token(request):
    """ """
    telegram_id = request.data.get("telegram_id")
    phone_number = request.data.get("phone_number", "")

    if not telegram_id:
        return Response(
            {"error": "telegram_id is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Generate token
        token = generate_auth_token(str(telegram_id), phone_number)

        return Response(
            {
                "token": token,
                "expires_in": 300,  # 5 TODO: This should match TOKEN_EXPIRY
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def validate_telegram_webapp_data(init_data: str, bot_token: str) -> dict:
    """
    Validate Telegram WebApp initData
    Returns parsed data if valid, raises ValueError if invalid
    """
    try:
        parsed_data = dict(parse_qsl(init_data))

        received_hash = parsed_data.pop("hash", None)
        if not received_hash:
            raise ValueError("No hash provided")

        data_check_arr = [f"{k}={v}" for k, v in sorted(parsed_data.items())]
        data_check_string = "\n".join(data_check_arr)

        secret_key = hmac.new(
            key=b"WebAppData", msg=bot_token.encode(), digestmod=hashlib.sha256
        ).digest()

        calculated_hash = hmac.new(
            key=secret_key, msg=data_check_string.encode(), digestmod=hashlib.sha256
        ).hexdigest()

        if calculated_hash != received_hash:
            raise ValueError("Invalid hash")

        if "user" in parsed_data:
            parsed_data["user"] = json.loads(parsed_data["user"])

        return parsed_data
    except Exception as e:
        raise ValueError(f"Telegram data validation failed: {str(e)}")


@api_view(["POST"])
@permission_classes([AllowAny])
def validate_webapp_data(request):

    init_data = request.data.get("init_data")
    if not init_data:
        return Response(
            {"error": "init_data is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    bot_token = settings.TELEGRAM_BOT_TOKEN
    if not bot_token:
        return Response(
            {"error": "Telegram bot token not configured"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        validated_data = validate_telegram_webapp_data(init_data, bot_token)
        return Response(
            {
                "valid": True,
                "user": validated_data.get("user"),
                "auth_date": validated_data.get("auth_date"),
            }
        )
    except ValueError as e:
        return Response(
            {"valid": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def telegram_auth(request):
    """ """
    auth_token = request.data.get("token")
    if auth_token:
        token_data = validate_auth_token(auth_token)
        if not token_data:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        telegram_id = token_data.get("telegram_id")
        phone_number = token_data.get("phone_number")

        try:
            user = User.objects.get(telegram_id=telegram_id)
        except User.DoesNotExist:
            try:
                contact = ContactVerification.objects.get(telegram_id=telegram_id)
                telegram_username = contact.telegram_username
                first_name = contact.first_name
            except ContactVerification.DoesNotExist:
                telegram_username = ""
                first_name = ""

            email = f"telegram_{telegram_id}@temp.cpass.app"
            full_name = contact.first_name if contact.first_name else ""

            # user = User.objects.create(
            #     telegram_id=telegram_id,
            #     telegram_username=telegram_username,
            #     phone_number=phone_number,
            #     full_name=full_name,
            #     email=email,
            #     user_type="worker",
            # )

        # refresh = RefreshToken.for_user(user)

        return Response(
            {
                # "access_token": str(refresh.access_token),
                # "refresh_token": str(refresh),
                "user": {
                    # "id": str(user.id),
                    "telegram_id": str(telegram_id),
                    "full_name": full_name or "",
                    "phone_number": phone_number or "",
                    "role": "worker",
                },
            }
        )

    init_data = request.data.get("init_data")
    if not init_data:
        return Response(
            {"error": "Either token or init_data is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    bot_token = settings.TELEGRAM_BOT_TOKEN
    if not bot_token:
        return Response(
            {"error": "Telegram bot token not configured"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        validated_data = validate_telegram_webapp_data(init_data, bot_token)
        user_data = validated_data.get("user")

        if not user_data or "id" not in user_data:
            return Response(
                {"error": "No user data in init_data"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        telegram_id = str(user_data["id"])

        try:
            user = User.objects.get(telegram_id=telegram_id)
        except User.DoesNotExist:
            try:
                contact = ContactVerification.objects.get(telegram_id=telegram_id)
                phone_number = contact.phone_number
            except ContactVerification.DoesNotExist:
                phone_number = None

            # TODO: Consider using real email if available
            email = f"telegram_{telegram_id}@temp.cpass.app"
            first_name = user_data.get("first_name", "")
            last_name = user_data.get("last_name", "")
            full_name = (
                f"{first_name} {last_name}".strip() if first_name or last_name else ""
            )

            user = User.objects.create(
                telegram_id=telegram_id,
                telegram_username=user_data.get("username", ""),
                phone_number=phone_number,
                full_name=full_name,
                email=email,
                user_type="worker",
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "id": str(user.id),
                    "telegram_id": str(user.telegram_id),
                    "full_name": user.full_name or "",
                    "phone_number": user.phone_number or "",
                    "role": user.user_type,
                },
            }
        )

    except ValueError as e:
        return Response(
            {"error": f"Invalid Telegram data: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {"error": f"Authentication failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def signup_status(request):
    """ """
    telegram_id = request.query_params.get("telegram_id")
    if not telegram_id:
        return Response(
            {"error": "telegram_id is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.filter(telegram_id=telegram_id).first()
        if not user:
            return Response(
                {
                    "completed": False,
                    "hasProfile": False,
                    "contactVerified": ContactVerification.objects.filter(
                        telegram_id=telegram_id
                    ).exists(),
                }
            )

        worker_profile = WorkerProfile.objects.filter(user=user).first()

        return Response(
            {
                "completed": bool(worker_profile),
                "hasProfile": bool(worker_profile),
                "contactVerified": True,
                # 'workerId': str(user.id) if worker_profile else None,
                "workerId": user.id,
                "profileId": worker_profile.id if worker_profile else None,
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def get_or_create_worker_profile(request):
    """ """
    telegram_id = request.data.get("telegram_id")
    phone_number = request.data.get("phone_number")

    if not telegram_id:
        return Response(
            {"error": "telegram_id is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.filter(telegram_id=telegram_id).first()
        if not user:
            return Response(
                {"error": "User not found. Please authenticate first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        worker_profile, created = WorkerProfile.objects.get_or_create(
            user=user,
            defaults={
                "phone_number": phone_number or user.phone_number,
            },
        )

        return Response(
            {
                "worker_id": str(user.id),
                "created": created,
                "profile": {
                    "id": str(worker_profile.id),
                    "full_name": user.full_name or "",
                    "phone_number": worker_profile.phone_number or user.phone_number,
                },
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
