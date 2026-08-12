from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "action",
        "model_name",
        "object_id",
        "timestamp",
    )

    list_filter = (
        "model_name",
        "timestamp",
    )

    search_fields = (
        "action",
        "user__username",
    )