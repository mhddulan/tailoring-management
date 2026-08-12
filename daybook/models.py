from django.db import models
from branches.models import Branch
from django.utils import timezone


class DayBook(models.Model):

    TYPE_CHOICES = [
        ('Income', 'Income'),
        ('Expense', 'Expense'),
    ]
    PAYMENT_CHOICES = [
    ('Cash', 'Cash'),
    ('Bank', 'Bank'),
    ('Online', 'Online'),
    ('Cheque', 'Cheque'),
    ('POS', 'POS'),
]

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE
    )

    date = models.DateField(default=timezone.now)

    transaction_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES
    )

    category = models.CharField(
        max_length=100
    )
    payment_mode = models.CharField(
    max_length=20,
    choices=PAYMENT_CHOICES,
    default='Cash'
)

    description = models.TextField(
        blank=True
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.branch} - {self.category} - {self.amount}"