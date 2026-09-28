from django.db import models
from branches.models import Branch
from customers.models import Customer


# =========================================================
# PRODUCT CATEGORY
# =========================================================

class ProductCategory(models.Model):

    name = models.CharField(
        max_length=100
    )

    def __str__(self):
        return self.name


# =========================================================
# PRODUCT
# =========================================================

class Product(models.Model):

    SIZE_CHOICES = [
        ("XS", "XS"),
        ("S", "S"),
        ("M", "M"),
        ("L", "L"),
        ("XL", "XL"),
        ("XXL", "XXL"),
        ("XXXL", "XXXL"),
        ("XXXXL", "XXXXL"),
        ("XXXXXL", "XXXXXL"),
        ("OTHER", "Other"),
    ]

    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.CASCADE,
        related_name="products"
    )

    name = models.CharField(
        max_length=100
    )

    barcode = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True
    )

    # Sizes available for this product
    available_sizes = models.CharField(
        max_length=200,
        blank=True
    )

    color = models.CharField(
        max_length=50,
        blank=True
    )

    purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name


# =========================================================
# BRANCH PRODUCT
# =========================================================

class BranchProduct(models.Model):

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="branch_products"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="branch_products"
    )

    stock = models.PositiveIntegerField(
        default=0
    )

    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    class Meta:
        unique_together = ("branch", "product")

    def __str__(self):
        return f"{self.branch.name} - {self.product.name}"


# =========================================================
# SALE
# =========================================================

class Sale(models.Model):

    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="sales"
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales"
    )

    sale_date = models.DateField()

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES
    )

    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Sale #{self.id}"


# =========================================================
# SALE ITEM
# =========================================================

class SaleItem(models.Model):

    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name="items"
    )

    branch_product = models.ForeignKey(
        BranchProduct,
        on_delete=models.CASCADE,
        related_name="sale_items"
    )

    quantity = models.PositiveIntegerField(
        default=1
    )

    rate = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    def save(self, *args, **kwargs):

        self.amount = self.quantity * self.rate

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.branch_product.product.name} - {self.quantity}"


# =========================================================
# STOCK TRANSFER
# =========================================================

class StockTransfer(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_transfers"
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="stock_transfers"
    )

    quantity = models.PositiveIntegerField()

    transfer_date = models.DateField()

    remarks = models.CharField(
        max_length=200,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.product.name} -> {self.branch.name}"
# =========================================================
# STOCK PROCESSING / PRODUCTION
# =========================================================

class StockProcessing(models.Model):

    PROCESS_TYPE_CHOICES = [
        ("STITCHING", "Stitching"),
        ("EMBROIDERY", "Embroidery"),
        ("ALTERATION", "Alteration"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    # -----------------------------------------------------
    # BASIC DETAILS
    # -----------------------------------------------------

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="stock_processings"
    )

    process_type = models.CharField(
        max_length=20,
        choices=PROCESS_TYPE_CHOICES
    )

    # -----------------------------------------------------
    # INPUT PRODUCT
    # -----------------------------------------------------

    input_product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="processing_inputs"
    )

    input_quantity = models.PositiveIntegerField(
        default=0
    )

    # Actual quantity taken from branch stock
    issued_quantity = models.PositiveIntegerField(
        default=0
    )

    # -----------------------------------------------------
    # OUTPUT PRODUCT
    # -----------------------------------------------------

    output_product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="processing_outputs",
        null=True,
        blank=True
    )

    output_quantity = models.PositiveIntegerField(
        default=0
    )

    # Actual quantity returned to branch stock
    returned_quantity = models.PositiveIntegerField(
        default=0
    )

    # -----------------------------------------------------
    # EMPLOYEE
    # -----------------------------------------------------

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_processings"
    )

    # -----------------------------------------------------
    # STATUS
    # -----------------------------------------------------

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    # -----------------------------------------------------
    # DATES
    # -----------------------------------------------------

    issue_date = models.DateTimeField(
        auto_now_add=True
    )

    expected_date = models.DateTimeField(
        null=True,
        blank=True
    )

    completed_date = models.DateTimeField(
        null=True,
        blank=True
    )

    # -----------------------------------------------------
    # NOTES
    # -----------------------------------------------------

    remarks = models.TextField(
        blank=True
    )

    # -----------------------------------------------------
    # SYSTEM
    # -----------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # =====================================================
    # CALCULATED VALUES
    # =====================================================

    @property
    def remaining_to_issue(self):

        return max(
            self.input_quantity - self.issued_quantity,
            0
        )

    @property
    def pending_quantity(self):

        return max(
            self.issued_quantity - self.returned_quantity,
            0
        )

    @property
    def is_fully_issued(self):

        return self.issued_quantity >= self.input_quantity

    @property
    def is_fully_returned(self):

        return self.returned_quantity >= self.output_quantity

    # =====================================================
    # DISPLAY
    # =====================================================

    def __str__(self):

        return (
            f"{self.get_process_type_display()} - "
            f"{self.input_product.name} - "
            f"{self.input_quantity}"
        )