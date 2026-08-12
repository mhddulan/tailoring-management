from django.contrib import admin

from .models import (
    ProductCategory,
    Product,
    BranchProduct,
    StockTransfer,
    Sale,
    SaleItem,
)


# ==================================================
# PRODUCT CATEGORY
# ==================================================

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
    )

    search_fields = (
        "name",
    )


# ==================================================
# PRODUCT
# ==================================================

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "barcode",
        "category",
        "size",
        "color",
        "purchase_price",
        "active",
    )

    list_display_links = (
        "id",
        "name",
    )

    search_fields = (
        "name",
        "barcode",
        "color",
        "size",
    )

    list_filter = (
        "category",
        "active",
    )

    ordering = (
        "-id",
    )


# ==================================================
# BRANCH PRODUCT
# ==================================================

@admin.register(BranchProduct)
class BranchProductAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "branch",
        "product",
        "stock",
        "selling_price",
    )

    search_fields = (
        "product__name",
        "product__barcode",
        "branch__name",
    )

    list_filter = (
        "branch",
        "product__category",
    )

    ordering = (
        "branch",
        "product",
    )


# ==================================================
# STOCK TRANSFER
# ==================================================

@admin.register(StockTransfer)
class StockTransferAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "product",
        "branch",
        "quantity",
        "transfer_date",
    )

    search_fields = (
        "product__name",
        "product__barcode",
        "branch__name",
    )

    list_filter = (
        "branch",
        "transfer_date",
    )

    ordering = (
        "-transfer_date",
        "-id",
    )


# ==================================================
# SALE
# ==================================================

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "branch",
        "customer",
        "sale_date",
        "payment_mode",
        "total",
    )

    search_fields = (
        "customer__name",
        "branch__name",
    )

    list_filter = (
        "branch",
        "payment_mode",
        "sale_date",
    )

    ordering = (
        "-sale_date",
        "-id",
    )


# ==================================================
# SALE ITEM
# ==================================================

@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "sale",
        "branch_product",
        "quantity",
        "rate",
        "amount",
    )

    search_fields = (
        "branch_product__product__name",
        "branch_product__product__barcode",
    )

    list_filter = (
        "branch_product__branch",
    )

    ordering = (
        "-id",
    )