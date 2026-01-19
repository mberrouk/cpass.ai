"""
Views for work management app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Task, TaskProgress, Rating, JobCategory, Job, Role
from .serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskProgressSerializer,
    RatingSerializer,
    JobCategorySerializer,
    JobSerializer,
)
from workers.users_models import CustomUser as User
from telegram_bot.notifications import (
    notify_task_assigned,
    notify_task_status_updated,
    notify_task_completed,
)

from rest_framework.permissions import AllowAny

from asgiref.sync import async_to_sync


class JobCategoryViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = JobCategory.objects.all()
    serializer_class = JobCategorySerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=["get"])
    def jobs(self, request, pk=None):
        category = self.get_object()
        jobs = category.jobs.all()
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data)


class JobViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Job.objects.all().select_related("category")
    serializer_class = JobSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=["get"], url_path="category/(?P<category_id>[0-9]+)")
    def by_category(self, request, category_id=None):
        jobs = Job.objects.filter(category_id=category_id)
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().select_related("created_by", "assigned_to")
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "create":
            return TaskCreateSerializer
        return TaskSerializer

    @action(detail=False, methods=["get"], url_path="available")
    def available(self, request):
        """Get all unassigned tasks"""
        tasks = Task.objects.filter(status=Task.OPEN)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(
        detail=False, methods=["get"], url_path="supervisor/(?P<supervisor_id>[^/.]+)"
    )
    def by_supervisor(self, request, supervisor_id=None):
        """Get all tasks created by a specific supervisor"""
        tasks = Task.objects.filter(created_by_id=supervisor_id)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="worker/(?P<worker_id>[^/.]+)")
    def by_worker(self, request, worker_id=None):
        """Get all tasks assigned to a specific worker"""
        tasks = Task.objects.filter(assigned_to_id=worker_id)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="assign")
    def assign(self, request, pk=None):
        """Assign a task to a worker"""
        task = self.get_object()
        worker_id = request.data.get("worker_id")
        print(")))> Assigning task to worker_id:", worker_id)
        print("00)> Request data:", request.data)
        if not worker_id:
            return Response(
                {"error": "worker_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            worker = User.objects.get(id=worker_id, user_type=Role.WORKER)
        except User.DoesNotExist:
            return Response(
                {"error": "Worker not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if task.status != Task.OPEN:
            return Response(
                {"error": "Task is not available for assignment"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task.assigned_to = worker
        task.status = Task.ASSIGNED
        task.assigned_at = timezone.now()
        task.save()

        if hasattr(worker, "worker_profile"):
            worker.worker_profile.total_tasks_assigned += 1
            worker.worker_profile.save()

        if hasattr(task.created_by, "supervisor_profile"):
            if (
                task.created_by.supervisor_profile.total_workers_supervised == 0
                or worker
                not in User.objects.filter(assigned_tasks__created_by=task.created_by)
            ):
                task.created_by.supervisor_profile.total_workers_supervised += 1
                task.created_by.supervisor_profile.save()

        # send telegram notification
        if hasattr(worker, "telegram_id") and worker.telegram_id:
            async_to_sync(notify_task_assigned)(
                worker_telegram_id=worker.telegram_id,
                task_title=task.title,
                supervisor_name=task.created_by.full_name,
                task_id=task.id,
            )

        serializer = TaskSerializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="update-status")
    def update_status(self, request, pk=None):
        """Update task status"""
        task = self.get_object()
        new_status = request.data.get("status")

        if new_status not in dict(Task.STATUS_CHOICES):
            return Response(
                {"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
            )

        task.status = new_status

        if new_status == Task.COMPLETED:
            task.completed_at = timezone.now()

            if task.assigned_to and hasattr(task.assigned_to, "worker_profile"):
                task.assigned_to.worker_profile.total_tasks_completed += 1
                task.assigned_to.worker_profile.save()

        # notify supervisor about status change
        if (
            hasattr(task.created_by, "telegram_id")
            and task.created_by.telegram_id
            and task.assigned_to
        ):
            async_to_sync(notify_task_status_updated)(
                supervisor_telegram_id=task.created_by.telegram_id,
                task_title=task.title,
                worker_name=task.assigned_to.full_name,
                new_status=new_status,
                task_id=task.id,
            )

        task.save()

        serializer = TaskSerializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="progress")
    def add_progress(self, request, pk=None):
        task = self.get_object()

        data = request.data.copy()
        data["task"] = task.id

        serializer = TaskProgressSerializer(data=data)
        if serializer.is_valid():
            progress = serializer.save()

            if task.status == Task.ASSIGNED:
                task.status = Task.IN_PROGRESS
                task.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="rate")
    def rate(self, request, pk=None):
        """Rate a completed task"""
        task = self.get_object()

        if task.status != Task.COMPLETED:
            return Response(
                {"error": "Task must be completed before rating"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(task, "rating"):
            return Response(
                {"error": "Task has already been rated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data.copy()
        data["task"] = task.id
        data["worker"] = task.assigned_to.id

        serializer = RatingSerializer(data=data)
        if serializer.is_valid():
            rating = serializer.save()

            # notify worker about rating
            if (
                task.assigned_to
                and hasattr(task.assigned_to, "telegram_id")
                and task.assigned_to.telegram_id
            ):
                async_to_sync(notify_task_completed)(
                    worker_telegram_id=task.assigned_to.telegram_id,
                    task_title=task.title,
                    rating=rating.score,
                    comment=rating.comment if rating.comment else None,
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
