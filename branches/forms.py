from django import forms
from .models import Branch

class BranchForm(forms.ModelForm):
    username = forms.CharField(max_length=150)
    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = Branch
        fields = [
            'name',
            'address',
            'phone',
            'manager_name',
            'username',
            'password',
        ]