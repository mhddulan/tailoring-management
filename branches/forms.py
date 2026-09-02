from django import forms
from .models import Branch


class BranchForm(forms.ModelForm):

    username = forms.CharField(
        max_length=150,
        label="Manager Username",
        widget=forms.TextInput(
            attrs={
                "class": "form-control",
                "placeholder": "Enter manager username",
                "autocomplete": "username",
            }
        )
    )

    password = forms.CharField(
        label="Manager Password",
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control",
                "placeholder": "Enter manager password",
                "autocomplete": "new-password",
            }
        )
    )

    class Meta:

        model = Branch

        fields = [
            "name",
            "address",
            "phone",
            "manager_name",
            "username",
            "password",
        ]

        widgets = {

            "name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Enter branch name",
                }
            ),

            "address": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3,
                    "placeholder": "Enter complete branch address",
                }
            ),

            "phone": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Enter branch phone number",
                    "inputmode": "tel",
                }
            ),

            "manager_name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Enter branch manager name",
                }
            ),
        }

        labels = {
            "name": "Branch Name",
            "address": "Branch Address",
            "phone": "Branch Phone",
            "manager_name": "Manager Name",
        }

        help_texts = {
            "name": "Enter the official name of the branch.",
            "address": "Enter the complete branch location.",
            "phone": "Enter the contact number for this branch.",
            "manager_name": "Name of the person managing this branch.",
        }


    def clean_name(self):

        name = self.cleaned_data["name"].strip()

        if not name:
            raise forms.ValidationError(
                "Branch name is required."
            )

        return name


    def clean_phone(self):

        phone = self.cleaned_data["phone"].strip()

        if not phone:
            raise forms.ValidationError(
                "Phone number is required."
            )

        return phone


    def clean_manager_name(self):

        name = self.cleaned_data["manager_name"].strip()

        if not name:
            raise forms.ValidationError(
                "Manager name is required."
            )

        return name


    def clean_username(self):

        username = self.cleaned_data["username"].strip()

        if not username:
            raise forms.ValidationError(
                "Manager username is required."
            )

        return username