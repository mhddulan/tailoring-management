from django.urls import path
from . import views

urlpatterns = [

    path(
        '',
        views.branch_list,
        name='branch_list'
    ),

    path(
        'add/',
        views.branch_create,
        name='branch_create'
    ),
    path("dashboard/", views.branch_dashboard, name="branch_dashboard"),
    path(
    "<int:branch_id>/performance/",
    views.branch_performance,
    name="branch_performance"
),
]