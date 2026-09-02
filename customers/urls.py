from django.urls import path
from . import views


urlpatterns = [

    # Customer list
    path(
        "",
        views.customer_list,
        name="customer_list"
    ),

    # Add customer
    path(
        "add/",
        views.customer_create,
        name="customer_create"
    ),

    # Customer ledger
    path(
        "<int:customer_id>/ledger/",
        views.customer_ledger,
        name="customer_ledger"
    ),

    # Customer detail
    path(
        "<int:customer_id>/",
        views.customer_detail,
        name="customer_detail"
    ),

    # Edit customer
    path(
        "edit/<int:customer_id>/",
        views.customer_edit,
        name="customer_edit"
    ),

    # Delete customer
    path(
        "delete/<int:customer_id>/",
        views.customer_delete,
        name="customer_delete"
    ),

    # Edit measurements
    path(
        "measurement/edit/<int:customer_id>/",
        views.measurement_edit,
        name="measurement_edit"
    ),

]