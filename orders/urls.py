from django.urls import path
from . import views


urlpatterns = [

    # =====================================================
    # ORDERS
    # =====================================================

    path(
        "",
        views.order_list,
        name="order_list"
    ),

    path(
        "add/",
        views.order_create,
        name="order_create"
    ),

    path(
        "customer/<int:customer_id>/add/",
        views.order_create,
        name="customer_order_create"
    ),

    path(
        "<int:order_id>/",
        views.order_detail,
        name="order_detail"
    ),

    path(
        "edit/<int:order_id>/",
        views.order_edit,
        name="order_edit"
    ),

    path(
        "delete/<int:order_id>/",
        views.order_delete,
        name="order_delete"
    ),

    # =====================================================
    # STATUS
    # =====================================================

    path(
        "status/<int:order_id>/",
        views.order_status_update,
        name="order_status_update"
    ),

    path(
        "deliver/<int:order_id>/",
        views.order_deliver,
        name="order_deliver"
    ),

    # =====================================================
    # PAYMENTS
    # =====================================================

    path(
        "payments/",
        views.payment_list,
        name="payment_list"
    ),

    path(
        "payments/add/",
        views.payment_create,
        name="payment_create"
    ),

    path(
        "payments/edit/<int:payment_id>/",
        views.payment_edit,
        name="payment_edit"
    ),

    path(
        "payments/delete/<int:payment_id>/",
        views.payment_delete,
        name="payment_delete"
    ),

    # =====================================================
    # REPORTS
    # =====================================================

    path(
        "due-report/",
        views.due_report,
        name="due_report"
    ),

    path(
        "outstanding-due/",
        views.outstanding_due_report,
        name="outstanding_due_report"
    ),

    path(
        "daily-collection/",
        views.daily_collection,
        name="daily_collection"
    ),

    path(
        "daily-production/",
        views.daily_production_report,
        name="daily_production_report"
    ),

    # =====================================================
    # LEDGER
    # =====================================================

    path(
        "ledger/<int:customer_id>/",
        views.customer_ledger,
        name="customer_ledger"
    ),

    # =====================================================
    # INVOICE
    # =====================================================

    path(
        "invoice/<int:order_id>/",
        views.print_invoice,
        name="print_invoice"
    ),

    # =====================================================
    # PRODUCT PRICE
    # =====================================================

    path(
        "order-price/",
        views.order_product_price,
        name="order_product_price"
    ),
]