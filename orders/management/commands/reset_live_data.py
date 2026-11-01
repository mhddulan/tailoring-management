from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


# Only transactional models are included.
# Branch, User, Product, ProductCategory and BranchProduct
# are intentionally excluded.

DELETE_MODEL_NAMES = [
    # Alterations
    "Alteration",

    # Orders
    "Payment",
    "OrderItem",
    "Order",

    # Ready-made sales
    "SaleItem",
    "Sale",

    # Stock movements and processing
    "StockTransfer",
    "StockProcessing",
    "DailyProduction",

    # Employees
    "EmployeeProductRate",
    "Employee",

    # Purchases and suppliers
    "Purchase",
    "Supplier",

    # Day book
    "DayBook",
    "OpeningBalance",

    # Customers
    "Measurement",
    "Customer",
]


class Command(BaseCommand):
    help = "Safely reset transactional data while preserving master data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Actually delete the selected data."
        )

    def handle(self, *args, **options):
        execute = options["execute"]

        # Resolve models from installed Django apps.
        models_to_delete = []

        for model_name in DELETE_MODEL_NAMES:
            matching_models = [
                model
                for model in apps.get_models()
                if model.__name__ == model_name
            ]

            for model in matching_models:
                if model not in models_to_delete:
                    models_to_delete.append(model)

        self.stdout.write("\n========== DATABASE RESET PREVIEW ==========\n")

        total_records = 0

        for model in models_to_delete:
            count = model.objects.count()
            total_records += count

            self.stdout.write(
                f"{model._meta.label}: {count} records"
            )

        self.stdout.write("---------------------------------------------")
        self.stdout.write(f"Total records identified: {total_records}")

        self.stdout.write("\nPRESERVED:")
        self.stdout.write("- Branch")
        self.stdout.write("- User")
        self.stdout.write("- Product")
        self.stdout.write("- ProductCategory")
        self.stdout.write("- BranchProduct")
        self.stdout.write("- BranchProduct stock quantities")
        self.stdout.write("- BranchProduct selling prices")

        if not execute:
            self.stdout.write(
                self.style.WARNING(
                    "\nDRY RUN ONLY. No records were deleted."
                )
            )
            self.stdout.write(
                "\nAfter checking the counts, run with --execute "
                "to perform the deletion."
            )
            return

        self.stdout.write(
            self.style.ERROR(
                "\nWARNING: YOU ARE ABOUT TO DELETE LIVE DATA."
            )
        )

        confirmation = input(
            '\nType DELETE LIVE DATA to continue: '
        )

        if confirmation != "DELETE LIVE DATA":
            raise CommandError("Deletion cancelled.")

        try:
            with transaction.atomic():
                deleted_total = 0

                for model in models_to_delete:
                    count = model.objects.count()

                    if count:
                        _, details = model.objects.all().delete()
                        deleted_total += sum(details.values())

                    self.stdout.write(
                        f"Processed {model._meta.label}: "
                        f"{count} records"
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    f"\nReset completed. "
                    f"Total deleted records, including cascades: "
                    f"{deleted_total}"
                )
            )

        except Exception as error:
            raise CommandError(
                f"Reset failed. Transaction rolled back: {error}"
            )