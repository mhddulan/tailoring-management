from .models import ActivityLog


def log_activity(request, action, model_name, object_id):

    ActivityLog.objects.create(
        user=request.user,
        action=action,
        model_name=model_name,
        object_id=object_id
    )