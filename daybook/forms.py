from django import forms
from django.utils import timezone
from .models import DayBook

CATEGORY_CHOICES = [
    ("Sales", "Sales"),
    ("Advance", "Advance"),
    ("Balance Payment", "Balance Payment"),
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
    ("Other Income", "Other Income"),
]

class DayBookForm(forms.ModelForm):

    category = forms.ChoiceField(
        choices=CATEGORY_CHOICES,
        widget=forms.Select(attrs={"class": "form-select"})
    )

    class Meta:
        model = DayBook
        fields = "__all__"

        widgets = {
            "branch": forms.Select(attrs={"class": "form-select"}),

            "date": forms.DateInput(
                attrs={
                    "class": "form-control",
                    "type": "date"
                }
            ),

            "transaction_type": forms.Select(
                attrs={"class": "form-select"}
            ),

            "payment_mode": forms.Select(
                attrs={"class": "form-select"}
            ),

            "description": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3
                }
            ),

            "amount": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01"
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)

        if not self.instance.pk:
            self.fields["date"].initial = timezone.now().date()

        if user and user.role != "Admin":
            self.fields.pop("branch", None)
