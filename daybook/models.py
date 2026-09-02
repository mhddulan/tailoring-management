from django.db import models
from branches.models import Branch
from django.utils import timezone


# ============================================================
# DAY BOOK
# ============================================================

class DayBook(models.Model):

    # ========================================================
    # TRANSACTION TYPE
    # ========================================================

    TYPE_CHOICES = [
        ("Income", "Income"),
        ("Expense", "Expense"),
    ]

    # ========================================================
    # PAYMENT MODE
    # ========================================================

    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    # ========================================================
    # BRANCH
    # ========================================================

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="daybook_entries"
    )

    # ========================================================
    # DATE
    # ========================================================

    date = models.DateField(
        default=timezone.now
    )

    # ========================================================
    # TRANSACTION TYPE
    # ========================================================

    transaction_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES
    )

    # ========================================================
    # CATEGORY
    # ========================================================

    category = models.CharField(
        max_length=100
    )

    # ========================================================
    # PAYMENT MODE
    # ========================================================

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default="Cash"
    )

    # ========================================================
    # DESCRIPTION
    # ========================================================

    description = models.TextField(
        blank=True
    )

    # ========================================================
    # AMOUNT
    # ========================================================

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    # ========================================================
    # CREATED AT
    # ========================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # ========================================================
    # ACCOUNT TYPE
    # ========================================================

    def affects_cash(self):

        return self.payment_mode == "Cash"


    def affects_bank(self):

        return self.payment_mode in [
            "Bank",
            "Online",
            "POS",
        ]


    # ========================================================
    # SIGNED AMOUNT
    # ========================================================

    def signed_amount(self):

        if self.transaction_type == "Income":
            return self.amount

        return -self.amount


    # ========================================================
    # STRING
    # ========================================================

    def __str__(self):

        return (
            f"{self.branch} - "
            f"{self.category} - "
            f"{self.amount}"
        )


# ============================================================
# OPENING BALANCE
# ============================================================

class OpeningBalance(models.Model):

    """
    Stores the starting Cash and Bank balance
    for each branch.

    Only one opening balance record is normally required
    for each branch.
    """

    branch = models.OneToOneField(
        Branch,
        on_delete=models.CASCADE,
        related_name="opening_balance"
    )

    opening_date = models.DateField(
        default=timezone.now
    )

    opening_cash = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    opening_bank = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # ========================================================
    # STRING
    # ========================================================

    def __str__(self):

        return (
            f"{self.branch.name} - "
            f"Cash SAR{self.opening_cash} - "
            f"Bank SAR{self.opening_bank}"
        )