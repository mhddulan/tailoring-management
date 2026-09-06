import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Reset Adiladmin password using ADMIN_RESET_PASSWORD environment variable"

    def handle(self, *args, **options):
        password = os.getenv("ADMIN_RESET_PASSWORD")

        if not password:
            self.stdout.write(
                self.style.ERROR(
                    "ADMIN_RESET_PASSWORD environment variable is not set."
                )
            )
            return

        User = get_user_model()

        try:
            user = User.objects.get(username="Adiladmin")
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR("User Adiladmin does not exist.")
            )
            return

        user.set_password(password)
        user.save(update_fields=["password"])

        self.stdout.write(
            self.style.SUCCESS("Adiladmin password reset successfully.")
        )