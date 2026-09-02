from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.employee_list,
        name="employee_list"
    ),

    path(
        "add/",
        views.employee_create,
        name="employee_create"
    ),

    path(
        "edit/<int:id>/",
        views.employee_edit,
        name="employee_edit"
    ),

    path(
        "delete/<int:id>/",
        views.employee_delete,
        name="employee_delete"
    ),

    # Employee Performance

    path(
        "production/",
        views.production_list,
        name="production_list"
    ),

    path(
        "production/add/",
        views.production_create,
        name="production_create"
    ),

    path(
        "production/edit/<int:id>/",
        views.production_edit,
        name="production_edit"
    ),

    path(
        "production/delete/<int:id>/",
        views.production_delete,
        name="production_delete"
    ),
    path(
    "production/employee/<int:employee_id>/",
    views.employee_performance,
    name="employee_performance"
),
path(
        "performance/<int:employee_id>/pdf/",
        views.employee_performance_pdf,
        name="employee_performance_pdf",
    ),
]