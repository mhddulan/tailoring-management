from django.urls import path
from . import views


urlpatterns = [

    # ==================================================
    # CATEGORY
    # ==================================================

    path(
        "categories/",
        views.category_list,
        name="category_list"
    ),

    path(
        "categories/add/",
        views.category_create,
        name="category_create"
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


    # ==================================================
    # PRODUCTS
    # ==================================================

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


    # ==================================================
    # SALES
    # ==================================================

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


    # ==================================================
    # STOCK TRANSFER
    # ==================================================

    path(
        "stock-transfer/",
        views.stock_transfer_list,
        name="stock_transfer_list"
    ),

    path(
        "stock-transfer/add/",
        views.stock_transfer_create,
        name="stock_transfer_create"
    ),


    # ==================================================
    # BRANCH STOCK
    # ==================================================

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


    # ==================================================
    # STOCK REPORT
    # ==================================================

    path(
        "stock-report/",
        views.stock_report,
        name="stock_report"
    ),


    # ==================================================
    # PRODUCT SEARCH / AJAX
    # ==================================================

    path(
        "search-product/",
        views.search_product,
        name="search_product"
    ),
]