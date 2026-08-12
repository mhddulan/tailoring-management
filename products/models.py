from django.db import models
from branches.models import Branch
from customers.models import Customer


# ==========================
# Product Category
# ==========================

class ProductCategory(models.Model):

    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# ==========================
# Product
# ==========================

class Product(models.Model):

    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.CASCADE
    )

    name = models.CharField(
        max_length=100
    )

    barcode = models.CharField(
        max_length=100,
        unique=True
    )

    size = models.CharField(
        max_length=50,
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

    def __str__(self):
        return self.name

class BranchProduct(models.Model):

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
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

# ==========================
# Sale
# ==========================

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
        on_delete=models.CASCADE
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
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

    def __str__(self):

        return f"Sale #{self.id}"


# ==========================
# Sale Item
# ==========================
class SaleItem(models.Model):

    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name="items"
    )

    branch_product = models.ForeignKey(
        BranchProduct,
        on_delete=models.CASCADE
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
class StockTransfer(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE
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
