from django.urls import path
from . import views

urlpatterns = [

    # Category
    path(
        "categories/",
        views.category_list,
        name="category_list"
    ),
    path(
    "categories/edit/<int:id>/",
    views.category_edit,
    name="category_edit"
),
path(
    "categories/delete/<int:id>/",
    views.category_delete,
    name="category_delete"
),

    path(
        "categories/add/",
        views.category_create,
        name="category_create"
    ),

    # Products
    path(
        "",
        views.product_list,
        name="product_list"
    ),

    path(
        "add/",
        views.product_create,
        name="product_create"
    ),

    path(
    "edit/<int:id>/",
    views.product_edit,
    name="product_edit"
),

    path(
        "delete/<int:id>/",
        views.product_delete,
        name="product_delete"
    ),

    # Sales

    path(
        "sales/",
        views.sale_list,
        name="sale_list"
    ),

    path(
        "sales/add/",
        views.sale_create,
        name="sale_create"
    ),

    path(
        "sales/report/",
        views.sale_report,
        name="sale_report"
    ),
path(
    "stock-transfer/",
    views.stock_transfer_list,
    name="stock_transfer_list"
),
path(
    "branch-stock/<int:id>/price/",
    views.update_price,
    name="update_price"
),

path(
    "stock-transfer/add/",
    views.stock_transfer_create,
    name="stock_transfer_create"
),
path(
    "branch-stock/",
    views.branch_stock,
    name="branch_stock"
),

path(
    "branch-stock/<int:id>/price/",
    views.update_price,
    name="update_price"
),
path(
    "stock-report/",
    views.stock_report,
    name="stock_report"
),
path(
    "search-product/",
    views.search_product,
    name="search_product"
),
]