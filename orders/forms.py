from django import forms
from django.forms import inlineformset_factory

from .models import Order, OrderItem, Payment
from django.utils import timezone

class OrderForm(forms.ModelForm):

    class Meta:
        model = Order
        fields = [
            "customer",
            "order_date",
            "delivery_date",
            "advance_paid",
            "status",
        ]

        widgets = {
            "customer": forms.Select(attrs={"class": "form-select"}),

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

            "advance_paid": forms.NumberInput(
                attrs={
                    "class": "form-control",
                }
            ),

            "status": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Set today's date only when creating a new order
        if not self.instance.pk:
            today = timezone.now().date()
            self.fields["order_date"].initial = today
            self.fields["delivery_date"].initial = today


class OrderItemForm(forms.ModelForm):

    class Meta:
        model = OrderItem

        exclude = ["order"]

        widgets = {
            "item_name": forms.Select(attrs={"class": "form-select"}),
            "quantity": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "min": 1,
                }
            ),
            "rate": forms.NumberInput(
                attrs={
                    "class": "form-control",
                }
            ),
            "amount": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "readonly": True,
                }
            ),
        }


OrderItemFormSet = inlineformset_factory(
    Order,
    OrderItem,
    form=OrderItemForm,
    extra=1,
    can_delete=True,
)


class PaymentForm(forms.ModelForm):

    class Meta:
        model = Payment
        fields = "__all__"

        widgets = {
            "order": forms.Select(attrs={"class": "form-select"}),
            "amount": forms.NumberInput(attrs={"class": "form-control"}),
            "payment_mode": forms.Select(attrs={"class": "form-select"}),
        }