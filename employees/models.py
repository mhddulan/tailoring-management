from django.core.exceptions import ValidationError
from django.db import models , transaction
from branches.models import Branch
from products.models import Product 
from django.utils import timezone
import datetime



class Employee(models.Model):

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="employees"
    )

    name = models.CharField(
        max_length=100
    )

    mobile = models.CharField(
        max_length=15
    )

    designation = models.CharField(
        max_length=100
    )

    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    joining_date = models.DateField(
        null=True,
        blank=True
    )

    active = models.BooleanField(
        default=True
    )

    def clean(self):
        super().clean()
        if self.salary < 0:
            raise ValidationError({'salary': 'Salary must be non-negative.'})
        if self.mobile and not self.mobile.isdigit():
            raise ValidationError({'mobile': 'Mobile must contain only digits.'})

    def __str__(self):
        return f"{self.name} - {self.branch.name}"
class DailyProduction(models.Model):

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="daily_productions"
    )

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="productions"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="daily_productions"
    )

    production_date = models.DateField()

    quantity = models.PositiveIntegerField(
        default=0
    )

    rate_per_piece = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    remarks = models.CharField(
        max_length=255,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # ========================================================
    # SAVE
    # ========================================================

    def save(self, *args, **kwargs):

        from products.models import BranchProduct, StockTransfer

        # ----------------------------------------------------
        # CALCULATE TOTAL
        # ----------------------------------------------------

        self.total_amount = (
            self.quantity * self.rate_per_piece
        )

        with transaction.atomic():

            # =================================================
            # NEW PRODUCTION
            # =================================================

            if not self.pk:

                # Save production first
                super().save(*args, **kwargs)

                # ---------------------------------------------
                # GET / CREATE BRANCH STOCK
                # ---------------------------------------------

                branch_stock, created = (
                    BranchProduct.objects.get_or_create(
                        branch=self.branch,
                        product=self.product,
                        defaults={
                            "stock": 0,
                            "selling_price": (
                                self.product.purchase_price
                            )
                        }
                    )
                )

                # ---------------------------------------------
                # ADD PRODUCTION ONCE
                # ---------------------------------------------

                branch_stock.stock += self.quantity

                branch_stock.save(
                    update_fields=["stock"]
                )

                # ---------------------------------------------
                # STOCK HISTORY ONLY
                # IMPORTANT:
                # This does NOT update stock.
                # ---------------------------------------------

                StockTransfer.objects.create(
                    product=self.product,
                    branch=self.branch,
                    quantity=self.quantity,
                    transfer_date=self.production_date,
                    remarks=(
                        f"Daily Production #{self.id} - "
                        f"{self.employee.name}"
                    )
                )

                return

            # =================================================
            # EXISTING PRODUCTION
            # =================================================

            old_production = (
                DailyProduction.objects
                .select_related(
                    "branch",
                    "employee",
                    "product"
                )
                .get(pk=self.pk)
            )

            old_quantity = old_production.quantity
            old_branch_id = old_production.branch_id
            old_product_id = old_production.product_id

            # =================================================
            # BRANCH / PRODUCT CHANGED
            # =================================================

            if (
                old_branch_id != self.branch_id
                or
                old_product_id != self.product_id
            ):

                # ---------------------------------------------
                # REMOVE OLD STOCK
                # ---------------------------------------------

                old_stock = (
                    BranchProduct.objects
                    .filter(
                        branch_id=old_branch_id,
                        product_id=old_product_id
                    )
                    .first()
                )

                if old_stock:

                    old_stock.stock = max(
                        0,
                        old_stock.stock - old_quantity
                    )

                    old_stock.save(
                        update_fields=["stock"]
                    )

                # ---------------------------------------------
                # SAVE PRODUCTION
                # ---------------------------------------------

                super().save(*args, **kwargs)

                # ---------------------------------------------
                # ADD NEW STOCK
                # ---------------------------------------------

                new_stock, created = (
                    BranchProduct.objects.get_or_create(
                        branch=self.branch,
                        product=self.product,
                        defaults={
                            "stock": 0,
                            "selling_price": (
                                self.product.purchase_price
                            )
                        }
                    )
                )

                new_stock.stock += self.quantity

                new_stock.save(
                    update_fields=["stock"]
                )

                # ---------------------------------------------
                # DELETE OLD HISTORY
                # ---------------------------------------------

                StockTransfer.objects.filter(
                    remarks__startswith=(
                        f"Daily Production #{self.pk}"
                    )
                ).delete()

                # ---------------------------------------------
                # CREATE NEW HISTORY
                # ---------------------------------------------

                StockTransfer.objects.create(
                    product=self.product,
                    branch=self.branch,
                    quantity=self.quantity,
                    transfer_date=self.production_date,
                    remarks=(
                        f"Daily Production #{self.id} - "
                        f"{self.employee.name}"
                    )
                )

                return

            # =================================================
            # SAME BRANCH + SAME PRODUCT
            # =================================================

            difference = (
                self.quantity - old_quantity
            )

            # ---------------------------------------------
            # SAVE PRODUCTION
            # ---------------------------------------------

            super().save(*args, **kwargs)

            # ---------------------------------------------
            # QUANTITY CHANGED
            # ---------------------------------------------

            if difference != 0:

                branch_stock = (
                    BranchProduct.objects
                    .filter(
                        branch=self.branch,
                        product=self.product
                    )
                    .first()
                )

                if not branch_stock:

                    branch_stock = (
                        BranchProduct.objects.create(
                            branch=self.branch,
                            product=self.product,
                            stock=0,
                            selling_price=(
                                self.product.purchase_price
                            )
                        )
                    )

                # -----------------------------------------
                # ADD OR REMOVE ONLY DIFFERENCE
                # -----------------------------------------

                branch_stock.stock = max(
                    0,
                    branch_stock.stock + difference
                )

                branch_stock.save(
                    update_fields=["stock"]
                )

                # -----------------------------------------
                # HISTORY
                # -----------------------------------------

                movement = (
                    "increased"
                    if difference > 0
                    else "decreased"
                )

                StockTransfer.objects.create(
                    product=self.product,
                    branch=self.branch,
                    quantity=abs(difference),
                    transfer_date=self.production_date,
                    remarks=(
                        f"Daily Production #{self.id} "
                        f"quantity {movement} by "
                        f"{self.employee.name} "
                        f"(adjustment)"
                    )
                )

    # ========================================================
    # DELETE
    # ========================================================

    def delete(self, *args, **kwargs):

        from products.models import BranchProduct, StockTransfer

        with transaction.atomic():

            # ---------------------------------------------
            # GET CURRENT STOCK
            # ---------------------------------------------

            branch_stock = (
                BranchProduct.objects
                .filter(
                    branch=self.branch,
                    product=self.product
                )
                .first()
            )

            # ---------------------------------------------
            # REMOVE PRODUCTION STOCK
            # ---------------------------------------------

            if branch_stock:

                branch_stock.stock = max(
                    0,
                    branch_stock.stock - self.quantity
                )

                branch_stock.save(
                    update_fields=["stock"]
                )

            # ---------------------------------------------
            # DELETE PRODUCTION HISTORY
            # ---------------------------------------------

            StockTransfer.objects.filter(
                remarks__startswith=(
                    f"Daily Production #{self.id}"
                )
            ).delete()

            # ---------------------------------------------
            # DELETE PRODUCTION
            # ---------------------------------------------

            super().delete(*args, **kwargs)

    # ========================================================
    # STRING
    # ========================================================

    def __str__(self):

        return (
            f"{self.employee.name} - "
            f"{self.product.name} - "
            f"{self.quantity}"
        )


# ============================================================
# EMPLOYEE PRODUCT RATE
# ============================================================

class EmployeeProductRate(models.Model):

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="product_rates"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="employee_rates"
    )

    rate_per_piece = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "employee",
                    "product"
                ],
                name="unique_employee_product_rate"
            )
        ]

    def __str__(self):

        return (
            f"{self.employee.name} - "
            f"{self.product.name} - "
            f"SAR{self.rate_per_piece}"
        )
    
# ============================================================
# EMPLOYEE PRODUCT RATE
# ============================================================
class EmployeeProductRate(models.Model):

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="product_rates"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="employee_rates"
    )

    rate_per_piece = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "product"],
                name="unique_employee_product_rate"
            )
        ]

    def __str__(self):
        return (
            f"{self.employee.name} - "
            f"{self.product.name} - "
            f"SAR{self.rate_per_piece}"
        )