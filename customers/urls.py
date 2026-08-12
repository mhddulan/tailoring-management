from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.customer_list,
        name="customer_list"
    ),

    path(
        "add/",
        views.customer_create,
        name="customer_create"
    ),

    path(
        "<int:customer_id>/",
        views.customer_detail,
        name="customer_detail"
    ),

    path(
        "edit/<int:customer_id>/",
        views.customer_edit,
        name="customer_edit"
    ),

    path(
        "delete/<int:customer_id>/",
        views.customer_delete,
        name="customer_delete"
    ),

    path(
        "measurement/edit/<int:customer_id>/",
        views.measurement_edit,
        name="measurement_edit"
    ),

]