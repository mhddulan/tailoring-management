from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from products.models import BranchProduct, StockProcessing


@transaction.atomic
def issue_processing(processing, quantity):
    """
    Move products from Branch Stock to Processing.
    """

    if processing.status == "CANCELLED":
        raise ValidationError(
            "Cancelled processing cannot receive stock."
        )

    if quantity <= 0:
        raise ValidationError(
            "Issue quantity must be greater than zero."
        )

    remaining = processing.input_quantity - processing.issued_quantity

    if quantity > remaining:
        raise ValidationError(
            f"Only {remaining} quantity is remaining to issue."
        )

    branch_product = (
        BranchProduct.objects
        .select_for_update()
        .filter(
            branch=processing.branch,
            product=processing.input_product
        )
        .first()
    )

    if not branch_product:
        raise ValidationError(
            "This product is not available in the selected branch."
        )

    if branch_product.stock < quantity:
        raise ValidationError(
            f"Insufficient stock. "
            f"Available stock: {branch_product.stock}"
        )

    # Remove from branch stock
    branch_product.stock -= quantity
    branch_product.save(update_fields=["stock"])

    # Update processing
    processing.issued_quantity += quantity

    if processing.issued_quantity >= processing.input_quantity:
        processing.status = "IN_PROGRESS"

    processing.save(
        update_fields=[
            "issued_quantity",
            "status",
            "updated_at",
        ]
    )

    return processing


@transaction.atomic
def complete_processing(processing, quantity):
    """
    Return completed products back to Branch Stock.
    """

    if processing.status == "CANCELLED":
        raise ValidationError(
            "Cancelled processing cannot be completed."
        )

    if not processing.output_product:
        raise ValidationError(
            "Please select an output product."
        )

    if quantity <= 0:
        raise ValidationError(
            "Completed quantity must be greater than zero."
        )

    pending = (
        processing.issued_quantity
        - processing.returned_quantity
    )

    if quantity > pending:
        raise ValidationError(
            f"Only {pending} quantity is pending."
        )

    # Find output product in branch stock
    branch_product, created = (
        BranchProduct.objects
        .select_for_update()
        .get_or_create(
            branch=processing.branch,
            product=processing.output_product,
            defaults={
                "stock": 0,
            }
        )
    )

    # Add completed quantity
    branch_product.stock += quantity
    branch_product.save(update_fields=["stock"])

    # Update processing
    processing.returned_quantity += quantity
    processing.output_quantity = processing.returned_quantity

    if (
        processing.returned_quantity
        >= processing.issued_quantity
    ):
        processing.status = "COMPLETED"
        processing.completed_date = timezone.now()

    else:
        processing.status = "IN_PROGRESS"

    processing.save(
        update_fields=[
            "returned_quantity",
            "output_quantity",
            "status",
            "completed_date",
            "updated_at",
        ]
    )

    return processing