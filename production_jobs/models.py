from decimal import Decimal

from django.db import models

from branches.models import Branch
from customers.models import Customer
from products.models import Product


class ProductionJob(models.Model):

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Processing", "Processing"),
        ("Completed", "Completed"),
        ("Delivered", "Delivered"),
        ("Cancelled", "Cancelled"),
    ]

    PAYMENT_MODE_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="production_jobs"
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="production_jobs"
    )

    job_type = models.CharField(
        max_length=150
    )

    job_date = models.DateField()

    expected_delivery = models.DateField(
        null=True,
        blank=True
    )

    quantity = models.PositiveIntegerField()

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00")
    )

    advance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00")
    )

    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00")
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    remarks = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def save(self, *args, **kwargs):

        self.balance = (
            self.total_amount - self.advance
        )

        if self.balance < 0:
            self.balance = Decimal("0.00")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Job #{self.id} - {self.customer.name}"


class JobPurchase(models.Model):

    PAYMENT_MODE_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    job = models.ForeignKey(
        ProductionJob,
        on_delete=models.CASCADE,
        related_name="purchases"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="job_purchases"
    )

    quantity = models.PositiveIntegerField()

    rate = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00")
    )

    supplier = models.CharField(
        max_length=200,
        blank=True,
        default=""
    )

    purchase_date = models.DateField()

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_MODE_CHOICES,
        default="Cash"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def save(self, *args, **kwargs):

        self.total = (
            Decimal(self.quantity) * self.rate
        )

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.quantity}"
        )


class JobPayment(models.Model):

    PAYMENT_TYPE_CHOICES = [
        ("Advance", "Advance"),
        ("Balance Payment", "Balance Payment"),
    ]

    PAYMENT_MODE_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    job = models.ForeignKey(
        ProductionJob,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    payment_type = models.CharField(
        max_length=30,
        choices=PAYMENT_TYPE_CHOICES
    )

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_MODE_CHOICES,
        default="Cash"
    )

    payment_date = models.DateField()

    remarks = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"Job #{self.job_id} - "
            f"{self.payment_type}"
        )