from django.db import models
from django.db.models import Sum
from customers.models import Customer


class Order(models.Model):

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Cutting", "Cutting"),
        ("Stitching", "Stitching"),
        ("Ready", "Ready"),
        ("Delivered", "Delivered"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE
    )

    order_date = models.DateField()

    delivery_date = models.DateField()

    advance_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    def total_amount(self):
        return self.items.aggregate(
            total=Sum("amount")
        )["total"] or 0

    def balance(self):
        return self.total_amount() - self.advance_paid

    def __str__(self):
        return f"Order #{self.id} - {self.customer.name}"


class OrderItem(models.Model):

    ITEM_CHOICES = [
        ("Shirt", "Shirt"),
        ("Pant", "Pant"),
        ("Kurta", "Kurta"),
        ("Blazer", "Blazer"),
        ("Safari", "Safari"),
        ("Coat", "Coat"),
        ("Jubba", "Jubba"),
        ("Others", "Others"),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    item_name = models.CharField(
        max_length=50,
        choices=ITEM_CHOICES
    )

    quantity = models.PositiveIntegerField(default=1)

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
        return f"{self.item_name} x {self.quantity}"


class Payment(models.Model):

    PAYMENT_MODES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_MODES
    )

    payment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.order} - ₹{self.amount}"