from django.db import models
from django.db.models import Sum
from customers.models import Customer
from django.conf import settings


# =============================================================
# ORDER
# =============================================================

class Order(models.Model):

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Cutting", "Cutting"),
        ("Stitching", "Stitching"),
        ("Ready", "Ready"),
        ("Delivery", "Delivery"),
        ("Delivered", "Delivered"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE
    )

    order_date = models.DateField()

    delivery_date = models.DateField()

    # =========================================================
    # ADVANCE PAYMENT MODE
    # =========================================================

    ADVANCE_PAYMENT_MODES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    advance_payment_mode = models.CharField(
        max_length=20,
        choices=ADVANCE_PAYMENT_MODES,
        default="Cash"
    )

    # =========================================================
    # STATUS
    # =========================================================

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    # =========================================================
    # DELIVERY INFORMATION
    # =========================================================

    delivered_date = models.DateTimeField(
        null=True,
        blank=True
    )

    delivered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="delivered_orders"
    )

    # =========================================================
    # TOTAL ORDER AMOUNT
    # =========================================================

    def total_amount(self):

        return (
            self.items.aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

    # =========================================================
    # TOTAL PAYMENT RECEIVED
    # =========================================================

    def total_received(self):

        return (
            self.payments.aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

    # =========================================================
    # ADVANCE RECEIVED
    # =========================================================

    def advance_received(self):

        return (
            self.payments.filter(
                payment_type="Advance"
            ).aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

    # =========================================================
    # BALANCE PAYMENT RECEIVED
    # =========================================================

    def balance_received(self):

        return (
            self.payments.filter(
                payment_type="Balance Payment"
            ).aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

    # =========================================================
    # REMAINING BALANCE
    # =========================================================

    def balance(self):

        return (
            self.total_amount()
            - self.total_received()
        )

    # =========================================================
    # PAYMENT STATUS
    # =========================================================

    def is_fully_paid(self):

        return self.balance() <= 0

    # =========================================================
    # STRING
    # =========================================================

    def __str__(self):

        return (
            f"Order #{self.id} - "
            f"{self.customer.name}"
        )


# =============================================================
# ORDER ITEM
# =============================================================
class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="order_items"
    )

    quantity = models.PositiveIntegerField(
        default=1
    )

    rate = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    def save(self, *args, **kwargs):

        self.amount = self.quantity * self.rate

        super().save(*args, **kwargs)

    def __str__(self):

        return (
            f"{self.product.name} x "
            f"{self.quantity}"
        )
      
# =============================================================
# PAYMENT
# =============================================================

class Payment(models.Model):

    PAYMENT_MODES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    PAYMENT_TYPE_CHOICES = [
        ("Advance", "Advance"),
        ("Balance Payment", "Balance Payment"),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_MODES
    )

    payment_type = models.CharField(
        max_length=30,
        choices=PAYMENT_TYPE_CHOICES,
        default="Balance Payment"
    )

    payment_date = models.DateField(
        auto_now_add=True
    )

    # =========================================================
    # STRING
    # =========================================================

    def __str__(self):

        return (
            f"{self.order} - "
            f"SAR{self.amount}"
        )