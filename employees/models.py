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

    quantity = models.PositiveIntegerField(default=0)

    remarks = models.CharField(
        max_length=255,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.employee.name} - "
            f"{self.product.name} - "
            f"{self.quantity}"
        )