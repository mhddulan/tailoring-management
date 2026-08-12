from django.contrib import admin

from .models import Employee, DailyProduction


# ============================================================
# EMPLOYEE ADMIN
# ============================================================

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "branch",
        "mobile",
        "designation",
        "salary",
        "joining_date",
        "active",
    )

    search_fields = (
        "name",
        "mobile",
        "designation",
        "branch__name",
    )

    list_filter = (
        "branch",
        "designation",
        "active",
    )

    ordering = (
        "branch",
        "name",
    )


# ============================================================
# DAILY PRODUCTION ADMIN
# ============================================================

@admin.register(DailyProduction)
class DailyProductionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "production_date",
        "branch",
        "employee",
        "product",
        "quantity",
    )

    search_fields = (
        "employee__name",
        "product__name",
        "branch__name",
    )

    list_filter = (
        "branch",
        "production_date",
        "product",
    )

    ordering = (
        "-production_date",
        "employee",
    )