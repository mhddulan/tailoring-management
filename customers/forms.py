from django import forms
from .models import Customer, Measurement


class CustomerForm(forms.ModelForm):

    class Meta:
        model = Customer
        fields = "__all__"

        widgets = {
            "name": forms.TextInput(attrs={
                "class": "form-control",
                "placeholder": "Customer Name"
            }),
            "mobile": forms.TextInput(attrs={
                "class": "form-control",
                "placeholder": "Mobile Number"
            }),
            "address": forms.Textarea(attrs={
                "class": "form-control",
                "rows": 4
            }),
            "branch": forms.Select(attrs={
                "class": "form-select"
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["branch"].required = False

class MeasurementForm(forms.ModelForm):

    class Meta:
        model = Measurement
        exclude = ["customer"]

        widgets = {

            "top_length": forms.NumberInput(attrs={"class":"form-control"}),
            "shoulder": forms.NumberInput(attrs={"class":"form-control"}),
            "sleeve": forms.NumberInput(attrs={"class":"form-control"}),
            "sleeve_down": forms.NumberInput(attrs={"class":"form-control"}),
            "body": forms.NumberInput(attrs={"class":"form-control"}),
            "collar": forms.NumberInput(attrs={"class":"form-control"}),

            "pant_length": forms.NumberInput(attrs={"class":"form-control"}),
            "band": forms.NumberInput(attrs={"class":"form-control"}),
            "hip": forms.NumberInput(attrs={"class":"form-control"}),
            "bell": forms.NumberInput(attrs={"class":"form-control"}),
            "loose": forms.NumberInput(attrs={"class":"form-control"}),
            "mutt": forms.NumberInput(attrs={"class":"form-control"}),
            "play": forms.NumberInput(attrs={"class":"form-control"}),

            "notes": forms.Textarea(attrs={
                "class":"form-control",
                "rows":4
            }),
        }