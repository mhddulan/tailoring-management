from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import ActivityLog


@login_required
def activity_list(request):

    search = request.GET.get("search")
    if request.user.role == "Admin":
        logs = ActivityLog.objects.all()
    else:
        logs = ActivityLog.objects.filter(user=request.user)

    if search:
        logs = logs.filter(
        action__icontains=search
    )

    logs = logs.order_by("-timestamp")

    return render(
        request,
        "logs/activity_list.html",
        {
            "logs": logs
        }
    )