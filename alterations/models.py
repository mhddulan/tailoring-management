from django.db import models
from django.utils import timezone

from branches.models import Branch
class Alteration(models.Model):

    # ============================================================
    # STATUS
    # ============================================================

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Delivery", "Delivery"),
        ("Cancel", "Cancel"),
    ]

    # ============================================================
    # PAYMENT METHODS
    # ============================================================

    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    # ============================================================
    # BRANCH
    # ============================================================

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="alterations"
    )

    # ============================================================
    # CUSTOMER
    # ============================================================

    customer_name = models.CharField(
        max_length=100
    )

    phone = models.CharField(
        max_length=15
    )

    # ============================================================
    # ALTERATION CREATION DATE
    # ============================================================

    alteration_date = models.DateField(
        default=timezone.now
    )

    # ============================================================
    # EXPECTED DELIVERY
    # ============================================================

    expected_delivery_date = models.DateField(
        null=True,
        blank=True
    )

    expected_delivery_time = models.TimeField(
        null=True,
        blank=True
    )

    # ============================================================
    # PRODUCT
    # ============================================================

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="alterations"
    )

    item_name = models.CharField(
        max_length=100,
        blank=True
    )

    # ============================================================
    # ALTERATION DETAILS
    # ============================================================

    custom_size = models.TextField(
        blank=True
    )

    notes = models.TextField(
        blank=True
    )

    # ============================================================
    # ASSIGNED EMPLOYEE
    # ============================================================

    assigned_employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alterations"
    )

    # ============================================================
    # AMOUNT
    # ============================================================

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    advance_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    balance_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # ============================================================
    # ADVANCE PAYMENT
    # ============================================================

    advance_payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default="Cash"
    )

    # ============================================================
    # DELIVERY PAYMENT
    # ============================================================

    delivered_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    delivery_payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        null=True,
        blank=True
    )

    # ============================================================
    # ACTUAL DELIVERY DATE & TIME
    # ============================================================

    delivery_date = models.DateField(
        null=True,
        blank=True
    )

    delivery_time = models.TimeField(
        null=True,
        blank=True
    )

    delivered_at = models.DateTimeField(
        null=True,
        blank=True
    )

    # ============================================================
    # STATUS
    # ============================================================

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    # ============================================================
    # SYSTEM DATES
    # ============================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # ============================================================
    # AUTOMATIC BALANCE CALCULATION
    # ============================================================

    def save(self, *args, **kwargs):

        balance = (
            self.total_amount
            - self.advance_amount
            - self.delivered_amount
        )

        if balance < 0:
            balance = 0

        self.balance_amount = balance

        super().save(*args, **kwargs)

    # ============================================================
    # ITEM NAME
    # ============================================================

    def get_item_name(self):

        if self.product:
            return self.product.name

        if self.item_name:
            return self.item_name

        return "Other Item"

    # ============================================================
    # STRING
    # ============================================================

    def __str__(self):

        return (
            f"{self.customer_name} - "
            f"{self.get_item_name()}"
        )