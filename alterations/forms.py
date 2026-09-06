from django import forms
from django.utils import timezone

from .models import Alteration
from products.models import Product
from branches.models import Branch


class AlterationForm(forms.ModelForm):

    class Meta:

        model = Alteration

        fields = [
            "branch",
            "customer_name",
            "phone",
            "alteration_date",
            "product",
            "item_name",
            "custom_size",
            "notes",
            "assigned_employee",
            "advance_amount",
            "advance_payment_mode",
        ]

        widgets = {

            "branch": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            "customer_name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Customer name",
                }
            ),

            "phone": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Phone number",
                }
            ),

            "alteration_date": forms.DateInput(
                format="%Y-%m-%d",
                attrs={
                    "class": "form-control",
                    "type": "date",
                }
            ),

            "product": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            "item_name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Enter outside item name",
                }
            ),

            "custom_size": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 4,
                    "placeholder": "Enter size / alteration details",
                }
            ),

            "notes": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3,
                    "placeholder": "Additional notes",
                }
            ),

            "advance_amount": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                    "placeholder": "Advance amount",
                }
            ),

            "advance_payment_mode": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),
        }


    def __init__(self, *args, **kwargs):

        user = kwargs.pop("user", None)

        super().__init__(*args, **kwargs)

        # Active products only
        self.fields["product"].queryset = (
            Product.objects
            .filter(active=True)
            .order_by("name")
        )

        # Admin can select any branch
        if user and user.role == "Admin":

            self.fields["branch"].queryset = (
                Branch.objects
                .all()
                .order_by("name")
            )

        # Branch Manager
        elif user:

            self.fields["branch"].queryset = (
                Branch.objects
                .filter(id=user.branch_id)
            )

            self.fields["branch"].initial = user.branch_id

            self.fields["branch"].disabled = True

        # Today
        if not self.instance.pk:

            self.fields["alteration_date"].initial = (
                timezone.localdate()
            )


    def clean(self):

        cleaned_data = super().clean()

        product = cleaned_data.get("product")

        item_name = (
            cleaned_data.get("item_name") or ""
        ).strip()

        branch = cleaned_data.get("branch")

        if not branch:

            raise forms.ValidationError(
                "Please select a branch."
            )

        if not product and not item_name:

            raise forms.ValidationError(
                "Select a product or enter an outside item name."
            )

        cleaned_data["item_name"] = item_name

        return cleaned_data


    def clean_customer_name(self):

        name = self.cleaned_data["customer_name"].strip()

        if not name:

            raise forms.ValidationError(
                "Customer name is required."
            )

        return name


    def clean_phone(self):

        phone = self.cleaned_data["phone"].strip()

        if not phone:

            raise forms.ValidationError(
                "Phone number is required."
            )

        return phone


    def clean_advance_amount(self):

        amount = self.cleaned_data.get("advance_amount")

        if amount is None:
            return 0

        if amount < 0:

            raise forms.ValidationError(
                "Advance amount cannot be negative."
            )

        return amount