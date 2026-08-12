from django.db import models
from branches.models import Branch


class Supplier(models.Model):

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE
    )

    name = models.CharField(max_length=150)

    phone = models.CharField(max_length=20)

    address = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Purchase(models.Model):

    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE
    )

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE
    )

    date = models.DateField()

    bill_no = models.CharField(
        max_length=100,
        blank=True
    )

    item = models.CharField(
        max_length=200
    )

    quantity = models.IntegerField()

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES
    )

    remarks = models.TextField(blank=True)

    def __str__(self):
        return self.item