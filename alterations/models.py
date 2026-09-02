from django.db import models
from django.utils import timezone
from branches.models import Branch

class Alteration(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="alterations"
    )

    # ============================================================
    # CUSTOMER DETAILS
    # ============================================================

    customer_name = models.CharField(
        max_length=100
    )

    phone = models.CharField(
        max_length=15
    )

    alteration_date = models.DateField(
        default=timezone.now
    )

    # ============================================================
    # ITEM
    # ============================================================

    # Product from our Products module
    # Optional because customer may bring their own item
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="alterations"
    )

    # Customer's own / outside item
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
    # ADVANCE PAYMENT
    # ============================================================

    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    advance_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    advance_payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default="Cash"
    )

    # ============================================================
    # CREATED DATE
    # ============================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

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