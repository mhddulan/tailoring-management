from django.contrib.auth.models import AbstractUser
from django.db import models
from branches.models import Branch


class User(AbstractUser):

    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Branch', 'Branch'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='Branch'
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.username