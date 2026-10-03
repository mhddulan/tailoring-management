from django.core.exceptions import ValidationError
from django.db import models
from branches.models import Branch
from products.models import Product


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

    def save(self, *args, **kwargs):

        from products.models import BranchProduct, StockTransfer
        from django.db import transaction

        self.total_amount = (
            self.quantity * self.rate_per_piece
        )

        with transaction.atomic():

            # =================================================
            # NEW PRODUCTION
            # =================================================

            if not self.pk:

                super().save(*args, **kwargs)

                # Get EXISTING branch stock
                branch_stock, created = (
                    BranchProduct.objects.get_or_create(
                        branch=self.branch,
                        product=self.product,
                        defaults={
                            "stock": 0
                        }
                    )
                )

                # ADD production to existing stock
                branch_stock.stock += self.quantity

                branch_stock.save(
                    update_fields=["stock"]
                )

                # Create production history
                StockTransfer.objects.create(
                    product=self.product,
                    branch=self.branch,
                    employee=self.employee,
                    quantity=self.quantity,
                    movement_type="PRODUCTION",
                    transfer_date=self.production_date,
                    remarks=(
                        f"Production by "
                        f"{self.employee.name}"
                    )
                )

                return

            # =================================================
            # EXISTING PRODUCTION
            # =================================================

            old_production = (
                DailyProduction.objects
                .get(pk=self.pk)
            )

            old_quantity = old_production.quantity

            # Save production
            super().save(*args, **kwargs)

            # =================================================
            # BRANCH OR PRODUCT CHANGED
            # =================================================

            if (
                old_production.branch_id != self.branch_id
                or
                old_production.product_id != self.product_id
            ):

                # Remove OLD production quantity
                old_stock = (
                    BranchProduct.objects
                    .filter(
                        branch_id=old_production.branch_id,
                        product_id=old_production.product_id
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

                # Add NEW production quantity
                new_stock, created = (
                    BranchProduct.objects.get_or_create(
                        branch=self.branch,
                        product=self.product,
                        defaults={
                            "stock": 0
                        }
                    )
                )

                new_stock.stock += self.quantity

                new_stock.save(
                    update_fields=["stock"]
                )

                # History
                StockTransfer.objects.create(
                    product=self.product,
                    branch=self.branch,
                    employee=self.employee,
                    quantity=self.quantity,
                    movement_type="PRODUCTION",
                    transfer_date=self.production_date,
                    remarks=(
                        f"Production updated by "
                        f"{self.employee.name}"
                    )
                )

            # =================================================
            # ONLY QUANTITY CHANGED
            # =================================================

            else:

                difference = (
                    self.quantity - old_quantity
                )

                if difference != 0:

                    branch_stock = (
                        BranchProduct.objects.get(
                            branch=self.branch,
                            product=self.product
                        )
                    )

                    # ADD or REMOVE ONLY THE DIFFERENCE
                    branch_stock.stock += difference

                    branch_stock.stock = max(
                        0,
                        branch_stock.stock
                    )

                    branch_stock.save(
                        update_fields=["stock"]
                    )

                    StockTransfer.objects.create(
                        product=self.product,
                        branch=self.branch,
                        employee=self.employee,
                        quantity=abs(difference),
                        movement_type="PRODUCTION",
                        transfer_date=self.production_date,
                        remarks=(
                            f"Production quantity "
                            f"adjustment by "
                            f"{self.employee.name}"
                        )
                    )

    def delete(self, *args, **kwargs):

        from products.models import BranchProduct
        from django.db import transaction

        with transaction.atomic():

            branch_stock = (
                BranchProduct.objects
                .filter(
                    branch=self.branch,
                    product=self.product
                )
                .first()
            )

            if branch_stock:

                branch_stock.stock = max(
                    0,
                    branch_stock.stock - self.quantity
                )

                branch_stock.save(
                    update_fields=["stock"]
                )

            super().delete(*args, **kwargs)

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