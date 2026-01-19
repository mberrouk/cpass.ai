"""
Views matching Supabase API endpoints and authentication flow.
Preserves exact logic from Supabase operations.
"""

import uuid
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from telegram_bot.models import ContactVerification
from .users_models import (
    CustomUser,
    WorkerProfile,
    WorkerSkill,
    WorkerCertification,
    WorkerDomain,
)
from .serializers import (
    CustomUserSerializer,
    WorkerProfileSerializer,
    WorkerSkillSerializer,
    SignupSerializer,
    AuthResponseSerializer,
    TVETInstitutionSerializer,
    TVETAuthSerializer,
    TVETAuth,
)
from .tvet_models import (
    TVETInstitution,
)


def get_tokens_for_user(user):
    """
    Generate JWT tokens matching Supabase token format.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "expires_in": int(timedelta(hours=1).total_seconds()),
        "token_type": "Bearer",
        "user": CustomUserSerializer(user).data,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    """
    Worker signup endpoint matching Supabase signUp flow.
    """

    # TODO: Validate data more thoroughly!
    print("Signup request data received:", request.data)
    serializer = SignupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data

    try:
        with transaction.atomic():
            phone = data.get("phone_number", "")
            email = data.get("email", "")
            access_code = data.get("password", "")
            telegram_id = data.get("telegram_id", None)

            try:

                if telegram_id:
                    user = CustomUser.objects.create_user(
                        email=email,
                        password=access_code,  # TODO: Password handling not secure yet
                        phone_number=phone,
                        telegram_id=telegram_id,
                        full_name=data.get("full_name", ""),
                        user_type="worker",
                    )
                    print("User is Created: ", user)
                else:
                    user = CustomUser.objects.create_user(
                        email=email,
                        password=access_code,  # TODO: Password handling not secure yet
                        phone_number=phone,
                        full_name=data.get("full_name", ""),
                        user_type="worker",
                    )
            except Exception as e:
                print("Error creating user", e)
                return Response(
                    {"error": f"Error creating user: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # print(
            #     f"Creating user with email: {email}, phone: {phone} and password: {access_code}"
            # )

            tvet_institution = None
            tvet_institution_id = data.get("tvet_institution_id")
            if tvet_institution_id:
                try:
                    tvet_institution = TVETInstitution.objects.get(
                        id=tvet_institution_id
                    )
                    print("DEBUG Found TVET Institution:", tvet_institution)
                except TVETInstitution.DoesNotExist:
                    print("DEBUG Invalid TVET Institution ID:", tvet_institution_id)
                    pass  # TODO: handle invalid institution IDs

            profile = WorkerProfile.objects.create(
                id=user.id,
                user=user,
                full_name=data.get("full_name", ""),
                phone_number=phone,
                location=data.get("location", ""),
                tier="bronze",
                overall_tier="bronze",
                trust_score=0,
                total_points=0,
                total_skills=0,
                bronze_skills=0,
                silver_skills=0,
                gold_skills=0,
                platinum_skills=0,
                work_status="available",
                experience_duration=data.get("experience_duration", ""),
                invited_by_org=data.get("invited_by_org", "")
                or (tvet_institution.institution_name if tvet_institution else ""),
                invitation_code=data.get("invitation_code", ""),
                upload_source="self_registration",
                claimed_institution=tvet_institution,
                verification_status="pending" if tvet_institution else "pending", # TODO: adjust logic as needed
            )

            skills_data = data.get("skills", [])
            for skill in skills_data:

                skill_id_value = skill.get("skill_id")
                try:
                    if skill_id_value:
                        uuid.UUID(str(skill_id_value))
                        skill_id = skill_id_value
                    else:
                        skill_id = None
                except (ValueError, AttributeError) as err:
                    skill_id = None

                WorkerSkill.objects.create(
                    worker=profile,
                    skill_id=skill_id,
                    skill_name=skill.get("skill_name", ""),
                    proficiency_level=skill.get("proficiency_level"),
                    proficiency_rating=skill.get("proficiency_rating", 1),
                    frequency=skill.get("frequency", ""),
                    years_experience=skill.get("years_experience"),
                    supervision_level=skill.get("supervision_level", ""),
                    scale_context=skill.get("scale_context", []),
                    evidence_types=skill.get("evidence_types", []),
                    reference_contact=skill.get("reference_contact", ""),
                    skill_verification_tier="bronze",
                    verification_source="self_reported",
                )

            tokens = get_tokens_for_user(user)
            print("Tokens: {}".format(tokens)) #DEB: Debug print
            return Response(
                {"data": tokens, "access_code": access_code, "email": email},
                status=status.HTTP_201_CREATED,
            )

    except Exception as e:
        print("Error {}".format(e)) #DEB: Debug print
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def signin_with_password(request):

    print("DEBUG signin_with_password {}".format(request.data))
    email = request.data.get("email")
    password = request.data.get("password")

    print("DEBUG signin_with_password email:{} || password:{}".format(email, password))

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(email=email, password=password)

    if user is None:
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

    tokens = get_tokens_for_user(user)
    return Response({"data": tokens}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def signin_with_otp(request):

    phone = request.data.get("phone")

    if not phone:
        return Response(
            {"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # TODO: Implement OTP logic
    return Response({"message": "OTP sent", "phone": phone}, status=status.HTTP_200_OK)


@api_view(["GET"])
# @permission_classes([IsAuthenticated]) // TODO: Enable auth once front-end handles tokens
@permission_classes([AllowAny])
def get_user(request):
    serializer = CustomUserSerializer(request.user)
    # TODO: This can be removed once front-end handles UUIDs
    return Response({"data": {"user": serializer.data}}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def signout(request):
    try:
        refresh_token = request.data.get("refresh_token")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response(
            {"message": "Signed out successfully"}, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WorkerProfileViewSet(viewsets.ModelViewSet):

    queryset = WorkerProfile.objects.all()
    serializer_class = WorkerProfileSerializer

    def get_permissions(self):
        print("Permission: ", end=" ")
        if self.action in ["list", "retrieve", "skills"]:
            print("ALLOWANY")
            return [AllowAny()]

        print("ISAUTHENTICATED")
        return [IsAuthenticated()]

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert lookup_url_kwarg in self.kwargs, (
            "Expected view %s to be called with a URL keyword argument "
            'named "%s". Fix your URL conf, or set the `.lookup_field` '
            "attribute on the view correctly."
            % (self.__class__.__name__, lookup_url_kwarg)
        )

        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        print("DEBUG filter_kwargs:", filter_kwargs)
        obj = get_object_or_404(queryset, **filter_kwargs)

        self.check_object_permissions(self.request, obj)

        return obj

    def get_queryset(self):
        queryset = WorkerProfile.objects.all()

        user_id = self.request.query_params.get("user_id")
        if user_id:
            queryset = queryset.filter(user__id=user_id)

        upload_source = self.request.query_params.get("upload_source")
        if upload_source:
            queryset = queryset.filter(upload_source=upload_source)

        return queryset.prefetch_related("worker_skills", "certifications", "domains")

    @action(detail=False, methods=["get"])
    def demo_profiles(self, request):

        profiles = WorkerProfile.objects.filter(
            upload_source="self_registration"
        ).order_by("-created_at")[:6]

        serializer = self.get_serializer(profiles, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def skills(self, request, pk=None):

        profile = get_object_or_404(WorkerProfile, pk=pk)
        skills = WorkerSkill.objects.filter(worker=profile)
        serializer = WorkerSkillSerializer(skills, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkerSkillViewSet(viewsets.ModelViewSet):

    queryset = WorkerSkill.objects.all()
    serializer_class = WorkerSkillSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = WorkerSkill.objects.all()

        # Filter by worker ID
        worker_id = self.request.query_params.get("worker_id")
        if worker_id:
            queryset = queryset.filter(worker__id=worker_id)

        return queryset



class TVETInstitutionViewSet(viewsets.ModelViewSet):


    queryset = TVETInstitution.objects.all()
    serializer_class = TVETInstitutionSerializer
    permission_classes = [AllowAny]


@api_view(["POST"])
@permission_classes([AllowAny])
def tvet_signin(request):

    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(email=email, password=password)

    if user is None:
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        tvet_auth = TVETAuth.objects.get(user=user)
        tokens = get_tokens_for_user(user)
        response_data = {
            "data": tokens,
            "institution": TVETInstitutionSerializer(tvet_auth.institution).data,
        }
        return Response(response_data, status=status.HTTP_200_OK)
    except TVETAuth.DoesNotExist:
        return Response(
            {"error": "User does not have TVET access"},
            status=status.HTTP_403_FORBIDDEN,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def partnership_signin(request):

    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(email=email, password=password)

    if user is None:
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

    tokens = get_tokens_for_user(user)
    return Response({"data": tokens}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    """
    Simple user registration endpoint for telegram mini app.
    """
    try:
        telegram_id = request.data.get("telegram_id")
        telegram_username = request.data.get("telegram_username")
        full_name = request.data.get("full_name")
        user_type = request.data.get("role", "worker")
        phone_number = (
            ContactVerification.objects.filter(telegram_id=telegram_id)
            .first()
            .phone_number
            if ContactVerification.objects.filter(telegram_id=telegram_id).exists()
            else ""
        )

        if not phone_number:
            return Response(
                {"error": "Phone number not verified for this Telegram ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not telegram_id:
            return Response(
                {"error": "telegram_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if CustomUser.objects.filter(telegram_id=telegram_id).exists():
            return Response(
                {"error": "User already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = f"{telegram_id}@telegram.user"
        user = CustomUser.objects.create(
            email=email,
            phone_number=phone_number,
            telegram_id=telegram_id,
            telegram_username=telegram_username or "",
            full_name=full_name or "",
            user_type=user_type,
        )

        return Response(
            {
                "success": True,
                "user_id": str(user.id),
                "full_name": user.full_name,
                "telegram_id": telegram_id,
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {"error": f"Registration failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def list_workers(request):

    workers = CustomUser.objects.filter(user_type="worker").select_related(
        "worker_profile"
    )

    data = []
    for worker in workers:
        worker_data = {
            "id": str(worker.id),
            "full_name": worker.full_name,
            "telegram_id": worker.telegram_id,
            "telegram_username": worker.telegram_username,
        }

        if hasattr(worker, "worker_profile"):
            profile = worker.worker_profile
            worker_data.update(
                {
                    "location": profile.location or "",
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
            )

        data.append(worker_data)

    return Response(data)
