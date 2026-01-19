"""
Utility functions for Telegram bot operations
"""

from typing import Optional, Dict, List
from asgiref.sync import sync_to_async
from workers.users_models import CustomUser as User, WorkerProfile
from telegram_bot.models import ConversationState
from work_management.models import Task, TaskProgress, Rating, Role

from django.utils import timezone


@sync_to_async
def get_user_by_telegram_id(telegram_id: int) -> Optional[Dict]:
    """Fetch user data by telegram ID"""
    try:
        user = User.objects.select_related("worker_profile", "supervisor_profile").get(
            telegram_id=telegram_id
        )
        return serialize_user(user)
    except User.DoesNotExist:
        return None


def serialize_user(user: User) -> Dict:
    """Convert User model to dictionary"""
    data = {
        "id": str(user.id),
        "telegram_id": user.telegram_id,
        "telegram_username": user.telegram_username,
        "full_name": user.full_name,
        "role": user.user_type.upper(),
        "is_verified": True,  # Assuming users in the system are verified
        "phone_number": user.phone_number,
        "last_active": user.last_login.isoformat() if user.last_login else None,
    }

    if user.user_type == "worker" and hasattr(user, "worker_profile"):
        profile = user.worker_profile
        data["worker_profile"] = {
            "bio": getattr(profile, "bio", ""),
            "skills": getattr(profile, "skills", ""),
            "reputation_score": float(getattr(profile, "reputation_score", 0)),
            "total_tasks_completed": getattr(profile, "total_tasks_completed", 0),
            "total_tasks_assigned": getattr(profile, "total_tasks_assigned", 0),
            "completion_rate": getattr(profile, "completion_rate", 0),
            "average_rating": float(getattr(profile, "average_rating", 0)),
        }

    if user.user_type == "supervisor" and hasattr(user, "supervisor_profile"):
        profile = user.supervisor_profile
        data["supervisor_profile"] = {
            "organization": profile.organization,
            "verification_status": profile.verification_status,
            "total_tasks_created": profile.total_tasks_created,
            "total_workers_supervised": profile.total_workers_supervised,
        }

    return data


@sync_to_async
def register_user(data: Dict) -> Optional[Dict]:
    """Register a new user"""

    # TODO: This is not used currently, consider removing or integrating with CPASS onboarding
    try:
        role_name = data["role"]

        skills = data.pop("skills", "")
        bio = data.pop("bio", "")
        organization = data.pop("organization", "")

        telegram_username = data.get("telegram_username", "")
        email = f"{data['telegram_id']}@telegram.user"

        user = User.objects.create(
            email=email,
            telegram_id=data["telegram_id"],
            telegram_username=telegram_username,
            full_name=data["full_name"],
            user_type=role_name.lower(),
            phone_number=data.get("phone_number", ""),
        )

        if role_name == "worker":
            if hasattr(User, "worker_profile"):
                WorkerProfile.objects.create(
                    user=user,
                    full_name=user.full_name,
                    phone_number=user.phone_number,
                    skills=skills,
                    bio=bio,
                )

        return serialize_user(user)
    except Exception as e:
        print(f"Error registering user: {e}")
        return None


@sync_to_async
def get_conversation_state(telegram_id: int) -> Dict:
    """Get conversation state from database"""

    try:
        state = ConversationState.objects.get(telegram_id=telegram_id)
        return {"state": state.current_state, "data": state.context_data}
    except ConversationState.DoesNotExist:
        return {"state": None, "data": {}}


@sync_to_async
def set_conversation_state(telegram_id: int, state: str, data: Dict = None):
    """Set conversation state"""

    ConversationState.objects.update_or_create(
        telegram_id=telegram_id,
        defaults={"current_state": state, "context_data": data or {}},
    )


@sync_to_async
def clear_conversation_state(telegram_id: int):
    """Clear conversation state"""

    ConversationState.objects.filter(telegram_id=telegram_id).delete()


def serialize_task(task: Task) -> Dict:
    """Convert Task model to dictionary"""

    data = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "category": task.category.name if task.category else None,
        "deadline": task.deadline.isoformat() if task.deadline else None,
        "location": task.location,
        "created_by": str(task.created_by.id),
        "created_by_name": task.created_by.full_name,
        "assigned_to": str(task.assigned_to.id) if task.assigned_to else None,
        "assigned_to_name": task.assigned_to.full_name if task.assigned_to else None,
        "created_at": task.created_at.isoformat(),
        "assigned_at": task.assigned_at.isoformat() if task.assigned_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }

    if hasattr(task, "rating"):
        rating = task.rating
        data["rating"] = {
            "score": rating.score,
            "comment": rating.comment,
            "supervisor_name": rating.supervisor.full_name,
        }

    return data


@sync_to_async
def get_available_tasks() -> List[Dict]:
    """Get all available (open) tasks"""

    tasks = Task.objects.filter(status=Task.OPEN).select_related("created_by")
    return [serialize_task(task) for task in tasks]


@sync_to_async
def get_tasks_by_worker(worker_id: str) -> List[Dict]:
    """Get tasks assigned to a worker"""

    tasks = Task.objects.filter(assigned_to_id=worker_id).select_related(
        "created_by", "assigned_to"
    )
    return [serialize_task(task) for task in tasks]


@sync_to_async
def get_tasks_by_supervisor(supervisor_id: str) -> List[Dict]:
    """Get tasks created by a supervisor"""

    tasks = Task.objects.filter(created_by_id=supervisor_id).select_related(
        "created_by", "assigned_to"
    )
    return [serialize_task(task) for task in tasks]


@sync_to_async
def get_task_detail(task_id: int) -> Optional[Dict]:
    """Get detailed information about a task"""

    try:
        task = (
            Task.objects.select_related("created_by", "assigned_to")
            .prefetch_related("progress_updates")
            .get(id=task_id)
        )
        return serialize_task(task)
    except Task.DoesNotExist:
        return None


@sync_to_async
def create_task(data: Dict) -> Optional[Dict]:
    """Create a new task"""

    try:
        task = Task.objects.create(
            created_by_id=data["created_by"],
            title=data["title"],
            description=data["description"],
            category=data.get("category"),
            deadline=data.get("deadline"),
            location=data.get("location", ""),
        )

        if hasattr(task.created_by, "supervisor_profile"):
            supervisor_profile = task.created_by.supervisor_profile
            supervisor_profile.total_tasks_created += 1
            supervisor_profile.save()

        return serialize_task(task)
    except Exception as e:
        print(f"Error creating task: {e}")
        return None


@sync_to_async
def assign_task(task_id: int, worker_id: str) -> Optional[Dict]:
    """Assign a task to a worker"""

    try:
        task = Task.objects.select_related("created_by").get(id=task_id)
        worker = User.objects.get(id=worker_id, user_type="worker")

        if task.status != Task.OPEN:
            return None

        task.assigned_to = worker
        task.status = Task.ASSIGNED
        task.assigned_at = timezone.now()
        task.save()

        if hasattr(worker, "worker_profile"):
            worker.worker_profile.total_tasks_assigned += 1
            worker.worker_profile.save()

        if hasattr(task.created_by, "supervisor_profile"):
            supervisor_profile = task.created_by.supervisor_profile
            if (
                supervisor_profile.total_workers_supervised == 0
                or not Task.objects.filter(
                    created_by=task.created_by, assigned_to=worker
                )
                .exclude(id=task_id)
                .exists()
            ):
                supervisor_profile.total_workers_supervised += 1
                supervisor_profile.save()

        return serialize_task(task)
    except (Task.DoesNotExist, User.DoesNotExist) as e:
        print(f"Error assigning task: {e}")
        return None


@sync_to_async
def update_task_status(
    task_id: int, status: str, unassign: bool = False
) -> Optional[Dict]:
    """Update task status and optionally unassign worker"""

    try:
        task = Task.objects.get(id=task_id)
        task.status = status

        if status == Task.COMPLETED:
            task.completed_at = timezone.now()

        if unassign and status == Task.OPEN:
            task.assigned_to = None
            task.assigned_at = None

        task.save()
        return serialize_task(task)
    except Task.DoesNotExist:
        return None


@sync_to_async
def add_task_progress(
    task_id: int, user_id: str, status_update: str, progress_percentage: int
) -> Optional[Dict]:
    """Add progress update to a task"""

    try:
        task = Task.objects.get(id=task_id)
        user = User.objects.get(id=user_id)

        progress = TaskProgress.objects.create(
            task=task,
            updated_by=user,
            status_update=status_update,
            progress_percentage=progress_percentage,
        )

        if task.status == Task.ASSIGNED:
            task.status = Task.IN_PROGRESS
            task.save()

        return {
            "id": progress.id,
            "status_update": progress.status_update,
            "progress_percentage": progress.progress_percentage,
            "timestamp": progress.timestamp.isoformat(),
        }
    except (Task.DoesNotExist, User.DoesNotExist):
        return None


@sync_to_async
def rate_task(
    task_id: int, supervisor_id: str, score: int, comment: str = ""
) -> Optional[Dict]:
    """Rate a completed task"""
    try:
        task = Task.objects.select_related("assigned_to").get(id=task_id)
        supervisor = User.objects.get(id=supervisor_id)

        import logging

        logger = logging.getLogger(__name__)
        logger.info(
            f"Attempting to rate task {task_id}: status={task.status}, has_rating={hasattr(task, 'rating')}"
        )

        if hasattr(task, "rating"):
            logger.warning(f"Task {task_id} already has a rating")
            return None

        rating = Rating.objects.create(
            task=task,
            worker=task.assigned_to,
            supervisor=supervisor,
            score=score,
            comment=comment,
        )

        logger.info(f"Successfully created rating {rating.id} for task {task_id}")

        return {"id": rating.id, "score": rating.score, "comment": rating.comment}
    except (Task.DoesNotExist, User.DoesNotExist) as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Error rating task {task_id}: {str(e)}")
        return None


@sync_to_async
def get_all_workers() -> List[Dict]:
    """Get all registered workers"""

    workers = User.objects.filter(user_type="worker").select_related("worker_profile")
    return [serialize_user(worker) for worker in workers]


def format_task_detail(task: Dict) -> str:
    """Format task details for display"""

    status_emoji = {
        "OPEN": "🟢",
        "ASSIGNED": "🟡",
        "IN_PROGRESS": "🔵",
        "SUBMITTED": "🟠",
        "COMPLETED": "✅",
        "CANCELLED": "❌",
    }.get(task["status"], "⚪")

    message = f"<b>Task #{task['id']}</b>\n\n"
    message += f"<b>Title:</b> {task['title']}\n"
    message += f"<b>Status:</b> {status_emoji} {task['status']}\n"
    if task.get("category"):
        message += f"<b>Category:</b> {task['category']}\n"
    message += f"<b>Description:</b>\n{task['description']}\n\n"

    if task.get("location"):
        message += f"<b>Location:</b> {task['location']}\n"

    if task.get("deadline"):
        message += f"<b>Deadline:</b> {task['deadline']}\n"

    message += f"\n<b>Created by:</b> {task['created_by_name']}"

    if task.get("assigned_to_name"):
        message += f"\n<b>Assigned to:</b> {task['assigned_to_name']}"

    if task.get("rating"):
        rating = task["rating"]
        stars = "⭐" * rating["score"]
        message += f"\n\n<b>Rating:</b> {stars} ({rating['score']}/5)"
        if rating.get("comment"):
            message += f"\n<b>Comment:</b> {rating['comment']}"

    return message


def format_profile(user: Dict) -> str:
    """Format user profile for display"""

    message = f"<b>Profile</b>\n\n"
    message += f"<b>Name:</b> {user['full_name']}\n"
    message += f"<b>Role:</b> {user['role']}\n"

    if user["role"] == "worker" and user.get("worker_profile"):
        profile = user["worker_profile"]
        message += "\n<b>Statistics:</b>\n"
        message += f"• Reputation Score: {profile['reputation_score']}/110\n"
        message += f"• Average Rating: {'⭐' * int(profile['average_rating'])} ({profile['average_rating']}/5)\n"
        message += f"• Tasks Completed: {profile['total_tasks_completed']}/{profile['total_tasks_assigned']}\n"
        message += f"• Completion Rate: {profile['completion_rate']}%\n"

        if profile.get("skills"):
            message += f"\n<b>Skills:</b> {profile['skills']}\n"

        if profile.get("bio"):
            message += f"\n<b>Bio:</b>\n{profile['bio']}"

    elif user["role"] == Role.SUPERVISOR and user.get("supervisor_profile"):
        profile = user["supervisor_profile"]
        message += f"\n<b>Status:</b> {profile['verification_status']}\n"

        if profile.get("organization"):
            message += f"<b>Organization:</b> {profile['organization']}\n"

        message += "\n<b>Statistics:</b>\n"
        message += f"• Tasks Created: {profile['total_tasks_created']}\n"
        message += f"• Workers Supervised: {profile['total_workers_supervised']}\n"

    return message
