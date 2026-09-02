from django import forms
from django.forms import formset_factory

from products.models import Product

from .models import Employee, DailyProduction


# ============================================================
# EMPLOYEE FORM
# ============================================================

class EmployeeForm(forms.ModelForm):

    class Meta:
        model = Employee

        fields = [
            "name",
            "mobile",
            "designation",
            "salary",
            "joining_date",
            "active",
        ]

        widgets = {
            "name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Employee name",
                }
            ),

            "mobile": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Mobile number",
                }
            ),

            "designation": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Tailor",
                }
            ),

            "salary": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Salary",
                    "step": "0.01",
                    "min": "0",
                }
            ),

            "joining_date": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control",
                }
            ),

            "active": forms.CheckboxInput(
                attrs={
                    "class": "form-check-input",
                }
            ),
        }


# ============================================================
# DAILY PRODUCTION ITEM FORM
# ============================================================

class DailyProductionItemForm(forms.Form):

    product = forms.ModelChoiceField(
        queryset=Product.objects.filter(
            active=True
        ).order_by("name"),

        widget=forms.Select(
            attrs={
                "class": "form-select product-select",
            }
        )
    )

    quantity = forms.IntegerField(
        min_value=1,

        widget=forms.NumberInput(
            attrs={
                "class": "form-control quantity-input",
                "min": "1",
                "placeholder": "Pieces",
            }
        )
    )

    rate_per_piece = forms.DecimalField(
        required=True,
        min_value=0,
        decimal_places=2,
        max_digits=10,

        widget=forms.NumberInput(
            attrs={
                "class": "form-control rate-input",
                "step": "0.01",
                "min": "0",
                "placeholder": "Rate / Piece",
            }
        )
    )

    remarks = forms.CharField(
        required=False,

        widget=forms.TextInput(
            attrs={
                "class": "form-control",
                "placeholder": "Optional remarks",
            }
        )
    )


# ============================================================
# DAILY PRODUCTION FORMSET
# ============================================================

DailyProductionFormSet = formset_factory(
    DailyProductionItemForm,
    extra=1
)