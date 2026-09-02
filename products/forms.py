from django import forms
from django.forms import inlineformset_factory

from .models import (
    ProductCategory,
    Product,
    BranchProduct,
    Sale,
    SaleItem,
    StockTransfer,
)


# ==================================================
# PRODUCT CATEGORY FORM
# ==================================================

class ProductCategoryForm(forms.ModelForm):

    class Meta:
        model = ProductCategory

        fields = [
            "name",
        ]

        widgets = {
            "name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Category Name",
                }
            ),
        }


# ==================================================
# PRODUCT FORM
# ==================================================

class ProductForm(forms.ModelForm):

    # Size choices
    SIZE_CHOICES = [
        ("XS", "XS"),
        ("S", "S"),
        ("M", "M"),
        ("L", "L"),
        ("XL", "XL"),
        ("XXL", "XXL"),
        ("XXXL", "XXXL"),
        ("XXXXL", "XXXXL"),
        ("XXXXXL", "XXXXXL"),
        ("OTHER", "Other"),
    ]

    available_sizes = forms.MultipleChoiceField(
        choices=SIZE_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple(
            attrs={
                "class": "size-checkbox"
            }
        )
    )

    other_size = forms.CharField(
        required=False,
        widget=forms.TextInput(
            attrs={
                "class": "form-control",
                "placeholder": "Enter custom size",
                "id": "other-size-input",
            }
        )
    )

    class Meta:
        model = Product

        fields = [
            "category",
            "name",
            "barcode",
            "available_sizes",
            "color",
            "purchase_price",
            "active",
        ]

        widgets = {

            "category": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            "name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Product Name",
                }
            ),

            "barcode": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Barcode (Optional)",
                }
            ),

            "color": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Color (Optional)",
                }
            ),

            "purchase_price": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                }
            ),

            "active": forms.CheckboxInput(
                attrs={
                    "class": "form-check-input",
                }
            ),
        }

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        # Existing JSON list → form initial values
        if self.instance.pk:

            self.fields["available_sizes"].initial = (
                self.instance.available_sizes or []
            )

    def clean(self):

        cleaned_data = super().clean()

        sizes = cleaned_data.get("available_sizes") or []
        other_size = cleaned_data.get("other_size", "").strip()

        # If Other is selected, require custom size
        if "OTHER" in sizes and not other_size:
            self.add_error(
                "other_size",
                "Please enter the custom size."
            )

        # Add custom size to the selected sizes
        if "OTHER" in sizes and other_size:

            sizes = [
                size for size in sizes
                if size != "OTHER"
            ]

            sizes.append(other_size)

        cleaned_data["available_sizes"] = sizes

        return cleaned_data

    def save(self, commit=True):

        instance = super().save(commit=False)

        instance.available_sizes = (
            self.cleaned_data.get("available_sizes") or []
        )

        if commit:
            instance.save()

        return instance


# ==================================================
# BRANCH PRODUCT / PRICE FORM
# ==================================================

class BranchProductForm(forms.ModelForm):

    class Meta:
        model = BranchProduct

        fields = [
            "selling_price",
        ]

        widgets = {

            "selling_price": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                }
            ),
        }


# ==================================================
# SALE FORM
# ==================================================

class SaleForm(forms.ModelForm):

    class Meta:
        model = Sale

        fields = [
            "branch",
            "customer",
            "sale_date",
            "payment_mode",
        ]

        widgets = {

            "branch": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "customer": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "sale_date": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control"
                }
            ),

            "payment_mode": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),
        }


# ==================================================
# SALE ITEM FORM
# ==================================================

class SaleItemForm(forms.ModelForm):

    class Meta:
        model = SaleItem

        fields = [
            "branch_product",
            "quantity",
            "rate",
        ]

        widgets = {

            "branch_product": forms.Select(
                attrs={
                    "class": "form-select product"
                }
            ),

            "quantity": forms.NumberInput(
                attrs={
                    "class": "form-control quantity",
                    "min": "1"
                }
            ),

            "rate": forms.NumberInput(
                attrs={
                    "class": "form-control rate",
                    "step": "0.01",
                    "min": "0"
                }
            ),
        }

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        if self.instance.pk and self.instance.branch_product_id:

            self.fields["rate"].initial = (
                self.instance.branch_product.selling_price
            )


# ==================================================
# SALE ITEM FORMSET
# ==================================================

SaleItemFormSet = inlineformset_factory(
    Sale,
    SaleItem,
    form=SaleItemForm,
    extra=1,
    can_delete=True,
)


# ==================================================
# STOCK TRANSFER FORM
# ==================================================

class StockTransferForm(forms.ModelForm):

    class Meta:
        model = StockTransfer

        fields = [
            "product",
            "branch",
            "quantity",
            "transfer_date",
            "remarks",
        ]

        widgets = {

            "product": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "branch": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "quantity": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "min": "1"
                }
            ),

            "transfer_date": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control"
                }
            ),

            "remarks": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Optional remarks"
                }
            ),
        }