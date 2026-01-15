"""
Serializers for work management models.
"""

from rest_framework import serializers
from .models import Task, TaskProgress, Rating, JobCategory, Job, SupervisorProfile
from workers.serializers import WorkerProfileSerializer


class SupervisorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupervisorProfile
        fields = [
            "organization",
            "verification_status",
            "total_tasks_created",
            "total_workers_supervised",
        ]
        read_only_fields = [
            "verification_status",
            "total_tasks_created",
            "total_workers_supervised",
        ]


class JobCategorySerializer(serializers.ModelSerializer):
    jobs_count = serializers.SerializerMethodField()

    class Meta:
        model = JobCategory
        fields = [
            "id",
            "category_id",
            "name",
            "description",
            "jobs_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_jobs_count(self, obj):
        return obj.jobs.count()


class JobSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "job_id",
            "category",
            "category_name",
            "title",
            "description",
        ]
        read_only_fields = ["id"]


class TaskProgressSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(
        source="updated_by.full_name", read_only=True
    )

    class Meta:
        model = TaskProgress
        fields = [
            "id",
            "task",
            "updated_by",
            "updated_by_name",
            "status_update",
            "progress_percentage",
            "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]


class RatingSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    supervisor_name = serializers.CharField(
        source="supervisor.full_name", read_only=True
    )

    class Meta:
        model = Rating
        fields = [
            "id",
            "task",
            "worker",
            "worker_name",
            "supervisor",
            "supervisor_name",
            "score",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class TaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True
    )
    assigned_to_name = serializers.CharField(
        source="assigned_to.full_name", read_only=True
    )
    category_name = serializers.CharField(source="category.name", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    progress_updates = TaskProgressSerializer(many=True, read_only=True)
    rating = RatingSerializer(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "created_by",
            "created_by_name",
            "assigned_to",
            "assigned_to_name",
            "category",
            "category_name",
            "job",
            "job_title",
            "title",
            "description",
            "status",
            "deadline",
            "location",
            "created_at",
            "assigned_at",
            "completed_at",
            "updated_at",
            "progress_updates",
            "rating",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "assigned_at",
            "completed_at",
            "updated_at",
        ]


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id",
            "created_by",
            "category",
            "job",
            "title",
            "description",
            "deadline",
            "location",
        ]
        read_only_fields = ["id"]
