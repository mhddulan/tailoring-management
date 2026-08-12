from django.urls import path
from . import views

urlpatterns = [

    path(
        '',
        views.order_list,
        name='order_list'
    ),

    path(
        'add/',
        views.order_create,
        name='order_create'
    ),
    path(
        '<int:order_id>/',
        views.order_detail,
        name='order_detail'
    ),

    path(
        'status/<int:order_id>/',
        views.order_status_update,
        name='order_status_update'
    ),
    path(
    'customer/<int:customer_id>/add/',
    views.order_create,
    name='customer_order_create'
),
path(
    'payments/',
    views.payment_list,
    name='payment_list'
),

path(
    'payments/add/',
    views.payment_create,
    name='payment_create'
),
path(
    'due-report/',
    views.due_report,
    name='due_report'
),
path('ledger/<int:customer_id>/', views.customer_ledger, name='customer_ledger'),
    
path(
    'edit/<int:order_id>/',
    views.order_edit,
    name='order_edit'
),

path(
    'delete/<int:order_id>/',
    views.order_delete,
    name='order_delete'
),
path(
    'ledger/<int:customer_id>/',
    views.customer_ledger,
    name='customer_ledger'
),

path(
    'customer/<int:customer_id>/add/',
    views.order_create,
    name='customer_order_create'
),
path(
    'daily-collection/',
    views.daily_collection,
    name='daily_collection'
),
path(
    'payments/edit/<int:payment_id>/',
    views.payment_edit,
    name='payment_edit'
),

path(
    'payments/delete/<int:payment_id>/',
    views.payment_delete,
    name='payment_delete'
),
path(
    'outstanding-due/',
    views.outstanding_due_report,
    name='outstanding_due_report'
),
path(
    'invoice/<int:order_id>/',
    views.print_invoice,
    name='print_invoice'
),
path(
    'daily-production/',
    views.daily_production_report,
    name='daily_production_report'
),
]