"""
Models for managing jobs, tasks, and progress tracking in the work management system.
"""

from django.db import models
from django.db.models import Avg
from django.core.validators import MinValueValidator, MaxValueValidator
from workers.models import CustomUser as User, WorkerProfile
from core.abstracts import CreatedModifiedAbstract


class Role:
    """Role constants for backward compatibility"""

    WORKER = "worker"
    SUPERVISOR = "supervisor"


class SupervisorProfile(CreatedModifiedAbstract):
    """Profile for supervisor users"""

    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

    VERIFICATION_STATUS_CHOICES = [
        (PENDING, "Pending"),
        (VERIFIED, "Verified"),
        (REJECTED, "Rejected"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="supervisor_profile"
    )
    organization = models.CharField(max_length=255, blank=True, null=True)
    verification_status = models.CharField(
        max_length=20, choices=VERIFICATION_STATUS_CHOICES, default=PENDING
    )
    total_tasks_created = models.IntegerField(default=0)
    total_workers_supervised = models.IntegerField(default=0)

    class Meta:
        db_table = "supervisor_profiles"

    def __str__(self):
        return f"Supervisor: {self.user.full_name}"


class JobCategory(CreatedModifiedAbstract):
    """Job categories/domains"""

    category_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "job_categories"
        ordering = ["name"]
        verbose_name_plural = "Job Categories"

    def __str__(self):
        return self.name


class Job(models.Model):
    """Specific jobs within categories"""

    job_id = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(
        JobCategory, on_delete=models.CASCADE, related_name="jobs"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "jobs"
        ordering = ["title"]

    def __str__(self):
        return f"{self.category.name} - {self.title}"


class Task(CreatedModifiedAbstract):
    """Tasks assigned to workers based on selected jobs"""

    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (OPEN, "Open"),
        (ASSIGNED, "Assigned"),
        (IN_PROGRESS, "In Progress"),
        (SUBMITTED, "Submitted"),
        (COMPLETED, "Completed"),
        (CANCELLED, "Cancelled"),
    ]

    category = models.ForeignKey(
        JobCategory,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True,
    )
    job = models.ForeignKey(
        Job, on_delete=models.CASCADE, related_name="tasks", null=True, blank=True
    )

    # Assignment
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_tasks",
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="assigned_tasks",
        null=True,
        blank=True,
    )

    # Task details
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=OPEN)
    deadline = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)

    assigned_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tasks"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Task #{self.id}: {self.title} ({self.status})"


class TaskProgress(CreatedModifiedAbstract):
    """Track progress updates for tasks"""

    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name="progress_updates"
    )
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    status_update = models.TextField()
    progress_percentage = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_progress"
        ordering = ["timestamp"]

    def __str__(self):
        return f"Progress for Task #{self.task.id} - {self.progress_percentage}%"


class Rating(CreatedModifiedAbstract):
    """Rating given by supervisor to worker after task completion"""

    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name="rating")
    worker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_ratings",
    )
    supervisor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="given_ratings",
    )
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "ratings"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Rating for Task #{self.task.id}: {self.score}/5"

    def save(self, *args, **kwargs):
        """Update worker's reputation after saving rating"""
        super().save(*args, **kwargs)
        self._update_worker_reputation()

    def _update_worker_reputation(self):
        """Recalculate and update worker's average rating and reputation"""
        if hasattr(self.worker, "worker_profile"):
            worker_profile = self.worker.worker_profile
            avg_rating = Rating.objects.filter(worker=self.worker).aggregate(
                avg=Avg("score")
            )["avg"]

            if hasattr(worker_profile, "average_rating"):
                worker_profile.average_rating = (
                    round(avg_rating, 2) if avg_rating else 0
                )

            if hasattr(worker_profile, "update_reputation") and callable(
                worker_profile.update_reputation
            ):
                worker_profile.update_reputation()
            else:
                worker_profile.save()
