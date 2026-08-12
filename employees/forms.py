from django import forms

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
# DAILY EMPLOYEE PRODUCTION FORM
# ============================================================

class DailyProductionForm(forms.ModelForm):

    class Meta:
        model = DailyProduction

        fields = [
            "employee",
            "product",
            "production_date",
            "quantity",
            "remarks",
        ]

        widgets = {

            "employee": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            "product": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            "production_date": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control",
                }
            ),

            "quantity": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "min": "1",
                    "placeholder": "Pieces stitched",
                }
            ),

            "remarks": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3,
                    "placeholder": "Optional remarks",
                }
            ),
        }

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        # Only active products created by Admin
        self.fields["product"].queryset = (
            Product.objects
            .filter(active=True)
            .order_by("name")
        )