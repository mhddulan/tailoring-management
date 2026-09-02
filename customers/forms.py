from django import forms
from .models import Customer, Measurement

class CustomerForm(forms.ModelForm):

    class Meta:
        model = Customer

        fields = [
            "branch",
            "name",
            "mobile",
            "address",
        ]

        widgets = {

            "branch": forms.Select(
                attrs={
                    "class": "form-select",
                }
            ),

            "name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Customer Name",
                }
            ),

            "mobile": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Mobile Number",
                }
            ),

            "address": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3,
                    "placeholder": "Address",
                }
            ),
        }

    def __init__(self, *args, user=None, **kwargs):

        super().__init__(*args, **kwargs)

        # Only customer name is mandatory
        self.fields["name"].required = True

        self.fields["mobile"].required = False
        self.fields["address"].required = False

        # Branch is not required from the user
        self.fields["branch"].required = False

        # Branch Manager
        if user and user.role == "Branch Manager":

            self.fields["branch"].queryset = (
                Branch.objects.filter(
                    id=user.branch_id
                )
            )

            self.fields["branch"].initial = (
                user.branch_id
            )

            self.fields["branch"].disabled = True

        # Admin
        elif user and user.role == "Admin":

            self.fields["branch"].queryset = (
                Branch.objects.all().order_by("name")
            )

            self.fields["branch"].required = True
            
class MeasurementForm(forms.ModelForm):

    class Meta:
        model = Measurement

        exclude = [
            "customer"
        ]

        widgets = {

            "top_length": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "shoulder": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "sleeve": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "sleeve_down": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "body": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "collar": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "pant_length": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "band": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "hip": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "bell": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "loose": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "mutt": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "play": forms.NumberInput(
                attrs={"class": "form-control"}
            ),

            "notes": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 4
                }
            ),
        }