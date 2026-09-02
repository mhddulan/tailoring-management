from django import forms
from django.forms import inlineformset_factory
from django.utils import timezone

from .models import Order, OrderItem, Payment


# ============================================================
# ORDER FORM
# ============================================================

class OrderForm(forms.ModelForm):

    class Meta:
        model = Order

        fields = [
            "customer",
            "order_date",
            "delivery_date",
            "advance_payment_mode",
            "status",
        ]

        widgets = {

            "customer": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "order_date": forms.DateInput(
                attrs={
                    "class": "form-control",
                    "type": "date",
                }
            ),

            "delivery_date": forms.DateInput(
                attrs={
                    "class": "form-control",
                    "type": "date",
                }
            ),

            "advance_payment_mode": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "status": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),
        }

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        if not self.instance.pk:

            today = timezone.now().date()

            self.fields["order_date"].initial = today
            self.fields["delivery_date"].initial = today


# ============================================================
# ORDER ITEM FORM
# ============================================================

class OrderItemForm(forms.ModelForm):

    class Meta:
        model = OrderItem

        fields = [
            "product",
            "quantity",
            "rate",
            "amount",
        ]

        widgets = {
            "product": forms.Select(
                attrs={"class": "form-select"}
            ),

            "quantity": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "min": 1,
                }
            ),

            "rate": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": 0,
                }
            ),

            "amount": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "readonly": True,
                }
            ),
        }

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        self.fields["product"].queryset = (
            self.fields["product"]
            .queryset
            .filter(active=True)
            .order_by("name")
        )

    def clean_quantity(self):

        quantity = self.cleaned_data.get("quantity")

        if quantity is None or quantity <= 0:

            raise forms.ValidationError(
                "Quantity must be greater than zero."
            )

        return quantity

    def clean_rate(self):

        rate = self.cleaned_data.get("rate")

        if rate is None or rate < 0:

            raise forms.ValidationError(
                "Rate cannot be negative."
            )

        return rate

# ============================================================
# ADVANCE PAYMENT FORM
# ============================================================
class AdvancePaymentForm(forms.Form):

    amount = forms.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=False,
        widget=forms.NumberInput(
            attrs={
                "class": "form-control",
                "step": "0.01",
                "min": "0",
                "placeholder": "Advance amount",
            }
        )
    )

    payment_mode = forms.ChoiceField(
        choices=Payment.PAYMENT_MODES,
        initial="Cash",
        widget=forms.Select(
            attrs={
                "class": "form-select",
            }
        )
    )

    def clean_amount(self):

        amount = self.cleaned_data.get("amount")

        if amount is None:
            return 0

        if amount < 0:

            raise forms.ValidationError(
                "Advance amount cannot be negative."
            )

        return amount


# ============================================================
# ORDER ITEM FORMSET
# ============================================================

OrderItemFormSet = inlineformset_factory(
    Order,
    OrderItem,
    form=OrderItemForm,
    extra=1,
    can_delete=True
)


# ============================================================
# PAYMENT FORM
# ============================================================

class PaymentForm(forms.ModelForm):

    class Meta:

        model = Payment

        fields = [
            "order",
            "amount",
            "payment_mode",
            "payment_type",
        ]

        widgets = {

            "order": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "amount": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                    "placeholder": "Payment amount"
                }
            ),

            "payment_mode": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "payment_type": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),
        }

    def clean(self):

        cleaned_data = super().clean()

        order = cleaned_data.get("order")
        amount = cleaned_data.get("amount")

        if not order or not amount:
            return cleaned_data

        already_paid = order.total_received()

        remaining = (
            order.total_amount()
            - already_paid
        )

        if amount <= 0:

            raise forms.ValidationError(
                "Payment amount must be greater than zero."
            )

        if amount > remaining:

            raise forms.ValidationError(
                f"Payment cannot exceed the remaining "
                f"balance of SAR{remaining:.2f}."
            )

        return cleaned_data