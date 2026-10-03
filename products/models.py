from django.db import models
from branches.models import Branch
from customers.models import Customer
from django.utils import timezone


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
# BRANCH PRODUCT / STOCK
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
        return (
            f"{self.branch_product.product.name} - "
            f"{self.quantity}"
        )


# =========================================================
# STOCK TRANSFER
# =========================================================
# =========================================================
# STOCK TRANSFER / STOCK MOVEMENT HISTORY
# =========================================================

class StockTransfer(models.Model):

    MOVEMENT_TYPE_CHOICES = [
        ("TRANSFER", "Stock Transfer"),
        ("PRODUCTION", "Production"),
        ("SALE", "Sale"),
        ("ADJUSTMENT", "Adjustment"),
    ]

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

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements"
    )

    quantity = models.PositiveIntegerField()

    movement_type = models.CharField(
        max_length=20,
        choices=MOVEMENT_TYPE_CHOICES,
        default="TRANSFER"
    )

    transfer_date = models.DateField()

    remarks = models.CharField(
        max_length=200,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        employee_name = (
            self.employee.name
            if self.employee
            else "System"
        )

        return (
            f"{self.movement_type} - "
            f"{self.product.name} - "
            f"{self.branch.name} - "
            f"{employee_name} - "
            f"{self.quantity}"
        )
# =========================================================
# STOCK PROCESSING / STOCK PURCHASE
# =========================================================

class StockProcessing(models.Model):

    # =====================================================
    # PROCESS TYPES
    # =====================================================

    PROCESS_TYPE_CHOICES = [
        ("PURCHASE", "Purchase"),
        ("EMBROIDERY", "Embroidery"),
        ("PRINTING", "Printing"),
        ("STITCHING", "Stitching"),
        ("ALTERATION", "Alteration"),
        ("OTHER", "Other"),
    ]

    # =====================================================
    # PAYMENT MODES
    # =====================================================

    PAYMENT_MODES = [
        ("Cash", "Cash"),
        ("Bank", "Bank"),
        ("Online", "Online"),
        ("Cheque", "Cheque"),
        ("POS", "POS"),
    ]

    # =====================================================
    # STATUS
    # =====================================================

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    # =====================================================
    # BRANCH
    # =====================================================

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="stock_processings"
    )

    # =====================================================
    # PRODUCT
    # =====================================================

    product = models.ForeignKey(
    Product,
    on_delete=models.PROTECT,
    related_name="stock_processings",
    null=True,
    blank=True
    )

    # =====================================================
    # PURCHASE DATE
    # =====================================================

    purchase_date = models.DateField(
        default=timezone.now
    )

    # =====================================================
    # QUANTITY
    # =====================================================

    quantity = models.PositiveIntegerField(
        default=1
    )

    # =====================================================
    # PURCHASE PRICE
    # =====================================================

    purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # =====================================================
    # TOTAL PURCHASE AMOUNT
    # =====================================================

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    # =====================================================
    # PROCESS TYPE
    # =====================================================

    process_type = models.CharField(
        max_length=20,
        choices=PROCESS_TYPE_CHOICES,
        default="PURCHASE"
    )

    # =====================================================
    # EMPLOYEE / VENDOR
    # =====================================================

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_processings"
    )

    # =====================================================
    # PAYMENT MODE
    # =====================================================

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_MODES,
        default="Cash"
    )

    # =====================================================
    # EXPECTED DATE
    # =====================================================

    expected_date = models.DateField(
        null=True,
        blank=True
    )

    # =====================================================
    # EXPECTED TIME
    # =====================================================

    expected_time = models.TimeField(
        null=True,
        blank=True
    )

    # =====================================================
    # STATUS
    # =====================================================

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    # =====================================================
    # REMARKS
    # =====================================================

    remarks = models.TextField(
        blank=True
    )

    # =====================================================
    # SYSTEM DATES
    # =====================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # =====================================================
    # AUTO CALCULATE TOTAL
    # =====================================================

    def save(self, *args, **kwargs):

        self.total_amount = (
            self.quantity *
            self.purchase_price
        )

        super().save(*args, **kwargs)

    # =====================================================
    # STRING
    # =====================================================

    def __str__(self):

        return (
            f"{self.product.name} - "
            f"{self.quantity}"
        )