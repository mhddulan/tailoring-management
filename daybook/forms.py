from django import forms
from django.utils import timezone

from branches.models import Branch
from .models import DayBook, OpeningBalance


# ============================================================
# CATEGORY CHOICES
# ============================================================

CATEGORY_CHOICES = [

    # -------------------------
    # INCOME
    # -------------------------

    ("Sales", "Sales"),
    ("Advance", "Advance"),
    ("Balance Payment", "Balance Payment"),
    ("Other Income", "Other Income"),

    # -------------------------
    # EXPENSE
    # -------------------------

    ("Purchase", "Purchase"),
    ("Salary", "Salary"),
    ("Rent", "Rent"),
    ("Electricity", "Electricity"),
    ("Water", "Water"),
    ("Internet", "Internet"),
    ("Fuel", "Fuel"),
    ("Maintenance", "Maintenance"),
    ("Office Expense", "Office Expense"),
    ("Miscellaneous", "Miscellaneous"),
]


# ============================================================
# INCOME CATEGORIES
# ============================================================

INCOME_CATEGORIES = [

    "Sales",
    "Advance",
    "Balance Payment",
    "Other Income",

]


# ============================================================
# EXPENSE CATEGORIES
# ============================================================

EXPENSE_CATEGORIES = [

    "Purchase",
    "Salary",
    "Rent",
    "Electricity",
    "Water",
    "Internet",
    "Fuel",
    "Maintenance",
    "Office Expense",
    "Miscellaneous",

]


# ============================================================
# DAY BOOK FORM
# ============================================================

class DayBookForm(forms.ModelForm):

    class Meta:

        model = DayBook

        fields = [
            "branch",
            "date",
            "transaction_type",
            "category",
            "payment_mode",
            "description",
            "amount",
        ]

        widgets = {

            # -----------------------------------------
            # BRANCH
            # -----------------------------------------

            "branch": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            # -----------------------------------------
            # DATE
            # -----------------------------------------

            "date": forms.DateInput(
                attrs={
                    "class": "form-control",
                    "type": "date",
                }
            ),

            # -----------------------------------------
            # TRANSACTION TYPE
            # -----------------------------------------

            "transaction_type": forms.Select(
                attrs={
                    "class": "form-select",
                    "id": "id_transaction_type",
                    "readonly": "readonly",
                }
            ),

            # -----------------------------------------
            # CATEGORY
            # -----------------------------------------

            "category": forms.Select(
                choices=[
                    ("", "Select Category"),

                    # Income
                    ("Sales", "Sales"),
                    ("Advance", "Advance"),
                    ("Balance Payment", "Balance Payment"),
                    ("Other Income", "Other Income"),

                    # Expense
                    ("Purchase", "Purchase"),
                    ("Salary", "Salary"),
                    ("Rent", "Rent"),
                    ("Electricity", "Electricity"),
                    ("Water", "Water"),
                    ("Internet", "Internet"),
                    ("Fuel", "Fuel"),
                    ("Maintenance", "Maintenance"),
                    ("Office Expense", "Office Expense"),
                    ("Miscellaneous", "Miscellaneous"),
                ],
                attrs={
                    "class": "form-select",
                    "id": "id_category",
                }
            ),

            # -----------------------------------------
            # PAYMENT MODE
            # -----------------------------------------

            "payment_mode": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            # -----------------------------------------
            # DESCRIPTION
            # -----------------------------------------

            "description": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3,
                    "placeholder": "Description",
                }
            ),

            # -----------------------------------------
            # AMOUNT
            # -----------------------------------------

            "amount": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                    "placeholder": "Enter amount",
                }
            ),
        }


    # ========================================================
    # INITIALIZATION
    # ========================================================

    def __init__(
        self,
        *args,
        user=None,
        **kwargs
    ):

        super().__init__(
            *args,
            **kwargs
        )


        # ----------------------------------------------------
        # BRANCH USER
        # ----------------------------------------------------

        if user and user.role != "Admin":

            self.fields["branch"].queryset = (
                self.fields["branch"]
                .queryset
                .filter(
                    id=user.branch_id
                )
            )

            self.fields["branch"].initial = (
                user.branch_id
            )

            self.fields["branch"].disabled = True


        # ----------------------------------------------------
        # TRANSACTION TYPE
        # ----------------------------------------------------

        self.fields["branch"].disabled = True


    # ========================================================
    # CLEAN FORM
    # ========================================================

    def clean(self):

        cleaned_data = super().clean()


        category = cleaned_data.get(
            "category"
        )


        # ----------------------------------------------------
        # AUTOMATIC INCOME
        # ----------------------------------------------------

        if category in INCOME_CATEGORIES:

            cleaned_data[
                "transaction_type"
            ] = "Income"


        # ----------------------------------------------------
        # AUTOMATIC EXPENSE
        # ----------------------------------------------------

        elif category in EXPENSE_CATEGORIES:

            cleaned_data[
                "transaction_type"
            ] = "Expense"


        return cleaned_data


# ============================================================
# OPENING BALANCE FORM
# ============================================================

class OpeningBalanceForm(forms.ModelForm):

    class Meta:

        model = OpeningBalance

        fields = [
            "branch",
            "opening_date",
            "opening_cash",
            "opening_bank",
        ]

        widgets = {

            # -----------------------------------------
            # BRANCH
            # -----------------------------------------

            "branch": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            # -----------------------------------------
            # OPENING DATE
            # -----------------------------------------

            "opening_date": forms.DateInput(
                attrs={
                    "class": "form-control",
                    "type": "date",
                }
            ),

            # -----------------------------------------
            # OPENING CASH
            # -----------------------------------------

            "opening_cash": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                    "placeholder": "Opening cash in hand",
                }
            ),

            # -----------------------------------------
            # OPENING BANK
            # -----------------------------------------

            "opening_bank": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                    "placeholder": "Opening cash in bank",
                }
            ),
        }


    # ========================================================
    # INITIALIZATION
    # ========================================================

    def __init__(
        self,
        *args,
        **kwargs
    ):

        user = kwargs.pop(
            "user",
            None
        )

        super().__init__(
            *args,
            **kwargs
        )


        # ----------------------------------------------------
        # ADMIN
        # ----------------------------------------------------

        if user and user.role == "Admin":

            self.fields[
                "branch"
            ].queryset = (
                Branch.objects
                .all()
                .order_by("name")
            )


        # ----------------------------------------------------
        # BRANCH USER
        # ----------------------------------------------------

        elif user:

            self.fields[
                "branch"
            ].queryset = (
                Branch.objects
                .filter(
                    id=user.branch_id
                )
            )

            self.fields[
                "branch"
            ].initial = user.branch_id

            self.fields[
                "branch"
            ].disabled = True


        # ----------------------------------------------------
        # DEFAULT DATE
        # ----------------------------------------------------

        if not self.instance.pk:

            self.fields[
                "opening_date"
            ].initial = timezone.localdate()