from rest_framework import serializers

from branches.models import Branch
from customers.models import Customer, Measurement
from orders.models import Order, OrderItem, Payment
from daybook.models import DayBook, OpeningBalance
from decimal import Decimal
from products.models import (
    Sale,
    SaleItem,
    Product,
    ProductCategory,
    BranchProduct,
    StockTransfer,
    StockProcessing,
)
from production_jobs.models import (
    ProductionJob,
    JobPurchase,
    JobPayment,
)

from alterations.models import Alteration

from employees.models import (
    Employee,
    DailyProduction,
    EmployeeProductRate,
)
from django.utils import timezone

# ============================================================
# BRANCH
# ============================================================

class BranchSerializer(serializers.ModelSerializer):

    class Meta:
        model = Branch
        fields = "__all__"


# ============================================================
# CUSTOMER
# ============================================================

class CustomerSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Customer

        fields = [
            "id",
            "branch",
            "branch_name",
            "name",
            "mobile",
            "address",
            "created_at",
        ]


# ============================================================
# MEASUREMENT
# ============================================================

class MeasurementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Measurement
        fields = "__all__"


# ============================================================
# ORDER ITEM
# ============================================================

from django.db import transaction
from rest_framework import serializers

from orders.models import Order, OrderItem, Payment


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "order",
            "product",
            "product_name",
            "quantity",
            "rate",
            "amount",
        ]
        read_only_fields = ["id", "amount", "order"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    customer_mobile = serializers.CharField(
        source="customer.mobile",
        read_only=True
    )

    # Accept order items from React when creating an order.
    items = OrderItemSerializer(
        many=True,
        required=False
    )

    payments = PaymentSerializer(
        many=True,
        read_only=True
    )

    # Initial advance sent by OrderCreate.jsx
    advance_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        default=Decimal("0"),
        write_only=True
    )
    bill_number = serializers.CharField(
    max_length=4,
    required=True,
    allow_blank=False,
    trim_whitespace=True,
    )

    total_amount = serializers.SerializerMethodField()
    total_received = serializers.SerializerMethodField()
    advance_received = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Order

        fields = [
            "id",
            "bill_number",
            "customer",
            "customer_name",
            "customer_mobile",
            "order_date",
            "delivery_date",
            "delivery_time",
            "advance_payment_mode",
            "status",
            "delivered_date",
            "delivered_by",
            "total_amount",
            "total_received",
            "advance_received",
            "balance_due",
            "items",
            "payments",
            "advance_amount",
        ]

        read_only_fields = [
            "id",
            "delivered_date",
            "delivered_by",
        ]

    def validate(self, attrs):
        items = attrs.get("items", [])
        advance = attrs.get(
            "advance_amount",
            Decimal("0")
        )

        if self.instance is None and not items:
            raise serializers.ValidationError({
                "items": "Add at least one item to the order."
            })

        item_total = sum(
            (
                item["quantity"] * item["rate"]
                for item in items
            ),
            Decimal("0")
        )

        if advance < 0:
            raise serializers.ValidationError({
                "advance_amount": "Advance cannot be negative."
            })

        if self.instance is None and advance > item_total:
            raise serializers.ValidationError({
                "advance_amount":
                    "Advance cannot exceed the order total."
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        items_data = validated_data.pop("items", [])
        advance_amount = validated_data.pop(
            "advance_amount",
            Decimal("0")
        )

        order = Order.objects.create(**validated_data)

        # Create all order items.
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                **item_data
            )

        # Record the initial advance as a payment.
        if advance_amount > 0:
            payment = Payment.objects.create(
                order=order,
                amount=advance_amount,
                payment_mode=order.advance_payment_mode,
                payment_type="Advance"
            )

            # Create matching Day Book income.
            from daybook.models import DayBook

            DayBook.objects.create(
                branch=order.customer.branch,
                date=timezone.now().date(),
                transaction_type="Income",
                category="Advance",
                payment_mode=order.advance_payment_mode or "Cash",
                amount=advance_amount,
                description=f"Advance payment for Order #{order.id}",
            )

        return order

    def get_total_amount(self, obj):
        return float(obj.total_amount())

    def get_total_received(self, obj):
        return float(obj.total_received())

    def get_advance_received(self, obj):
        return float(obj.advance_received())

    def get_balance_due(self, obj):
        return float(obj.balance())
    
    def validate_bill_number(self, value):
        value = value.strip()

        if not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError(
                "Bill number must contain exactly 4 digits."
            )

        queryset = Order.objects.filter(bill_number=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "This bill number already exists."
            )

        return value


# ============================================================
# PAYMENT
# ============================================================


# ============================================================
# DAY BOOK
# ============================================================

# ============================================================
# DAY BOOK
# ============================================================

class DayBookSerializer(serializers.ModelSerializer):

    class Meta:
        model = DayBook

        fields = "__all__"

        extra_kwargs = {
            "branch": {
                "required": False,
                "allow_null": True,
            },

        }


# ============================================================
# OPENING BALANCE
# ============================================================

class OpeningBalanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = OpeningBalance
        fields = "__all__"


# ============================================================
# SALE ITEM
# ============================================================

class SaleItemSerializer(serializers.ModelSerializer):

    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        required=False
    )

    product_name = serializers.CharField(
        source="branch_product.product.name",
        read_only=True
    )

    barcode = serializers.CharField(
        source="branch_product.product.barcode",
        read_only=True
    )

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "sale",
            "product",
            "branch_product",
            "product_name",
            "barcode",
            "quantity",
            "rate",
            "amount",
        ]
        read_only_fields = ["amount"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than zero."
            )
        return value

# ============================================================
# SALE
# ============================================================

class SaleSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True,
        allow_null=True
    )

    items = SaleItemSerializer(
        many=True,
        required=False
    )

    class Meta:
        model = Sale
        fields = [
            "id",
            "branch",
            "branch_name",
            "customer",
            "customer_name",
            "sale_date",
            "payment_mode",
            "total",
            "items",
        ]

    @transaction.atomic
    def create(self, validated_data):

        items_data = validated_data.pop("items", [])

        sale = Sale.objects.create(
            **validated_data
        )

        total_amount = 0

        for item_data in items_data:

            product = item_data.pop("product", None)
            branch_product = item_data.pop(
                "branch_product", None
            )

            # Get product from existing BranchProduct
            if product is None and branch_product:
                product = branch_product.product

            if product is None:
                raise serializers.ValidationError({
                    "items": "Each sale item must contain a product."
                })

            # A branch must use its own BranchProduct record.
            if branch_product and branch_product.branch_id != sale.branch_id:
                raise serializers.ValidationError({
                    "items": f"{product.name} does not belong to the selected branch."
                })

            # Automatically create branch product if missing.
            if branch_product is None:
                branch_product, created = BranchProduct.objects.get_or_create(
                    branch=sale.branch,
                    product=product,
                    defaults={
                        "stock": 0,
                        "selling_price": item_data.get("rate", 0),
                    }
                )

            # Use existing selling price if rate was not supplied.
            rate = item_data.get(
                "rate",
                branch_product.selling_price
            )

            quantity = item_data["quantity"]

            # Create the sale item with the FULL sold quantity.
            sale_item = SaleItem.objects.create(
                sale=sale,
                branch_product=branch_product,
                quantity=quantity,
                rate=rate,
                **{
                    key: value
                    for key, value in item_data.items()
                    if key not in ["quantity", "rate"]
                }
            )

            total_amount += sale_item.amount

            # Deduct only available stock. Never allow negative stock.
            branch_product = BranchProduct.objects.select_for_update().get(
                pk=branch_product.pk
            )

            deducted_stock = min(
                branch_product.stock,
                quantity
            )

            branch_product.stock -= deducted_stock
            branch_product.save(update_fields=["stock"])

        sale.total = total_amount
        sale.save(update_fields=["total"])

        return sale

# ============================================================
# PRODUCT CATEGORY
# ============================================================

class ProductCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductCategory
        fields = "__all__"


# ============================================================
# PRODUCT
# ============================================================

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )

    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = "__all__"

    def get_stock(self, obj):
        return sum(
            branch_product.stock
            for branch_product in obj.branch_products.all()
        )

# ============================================================
# STOCK PROCESSING / PRODUCTION
# ============================================================
# ============================================================
# STOCK PROCESSING
# ============================================================

class StockProcessingSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    employee_name = serializers.CharField(
        source="employee.name",
        read_only=True,
        allow_null=True
    )

    process_type_display = serializers.CharField(
        source="get_process_type_display",
        read_only=True
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )

    class Meta:
        model = StockProcessing

        fields = [
            "id",

            # ------------------------------------------------
            # BRANCH
            # ------------------------------------------------
            "branch",
            "branch_name",

            # ------------------------------------------------
            # STOCK
            # ------------------------------------------------
            "product",
            "product_name",
            "purchase_date",
            "quantity",

            # ------------------------------------------------
            # SELLING PRICE
            # ------------------------------------------------
            "selling_price",

            # ------------------------------------------------
            # PROCESS
            # ------------------------------------------------
            "process_type",
            "process_type_display",

            # ------------------------------------------------
            # EMPLOYEE
            # ------------------------------------------------
            "employee",
            "employee_name",

            # ------------------------------------------------
            # EXPECTED DELIVERY
            # ------------------------------------------------
            "expected_date",
            "expected_time",

            # ------------------------------------------------
            # STATUS
            # ------------------------------------------------
            "status",
            "status_display",

            # ------------------------------------------------
            # NOTES
            # ------------------------------------------------
            "remarks",

            # ------------------------------------------------
            # SYSTEM
            # ------------------------------------------------
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "branch_name",
            "product_name",
            "employee_name",
            "process_type_display",
            "status_display",
            "created_at",
            "updated_at",
        ]

    # ========================================================
    # VALIDATION
    # ========================================================

    def validate_quantity(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than 0."
            )

        return value

    def validate_selling_price(self, value):

        if value < 0:
            raise serializers.ValidationError(
                "Selling price cannot be negative."
            )

        return value

# ============================================================
# EMPLOYEE
# ============================================================

class EmployeeSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    class Meta:
        model = Employee

        fields = [
            "id",
            "branch",
            "branch_name",
            "name",
            "mobile",
            "designation",
            "salary",
            "joining_date",
            "active",
        ]


# ============================================================
# DAILY PRODUCTION
# ============================================================

class DailyProductionSerializer(serializers.ModelSerializer):

    employee_name = serializers.CharField(
        source="employee.name",
        read_only=True
    )

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    class Meta:
        model = DailyProduction

        fields = [
            "id",
            "branch",
            "branch_name",

            "employee",
            "employee_name",

            "product",
            "product_name",

            "production_date",

            "quantity",
            "rate_per_piece",
            "total_amount",

            "remarks",
            "created_at",
        ]

        read_only_fields = [
            "branch",
            "branch_name",
            "employee_name",
            "product_name",
            "total_amount",
            "created_at",
        ]


# ============================================================
# EMPLOYEE PRODUCT RATE
# ============================================================

class EmployeeProductRateSerializer(serializers.ModelSerializer):

    employee_name = serializers.CharField(
        source="employee.name",
        read_only=True
    )

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    class Meta:
        model = EmployeeProductRate

        fields = [
            "id",
            "employee",
            "employee_name",
            "product",
            "product_name",
            "rate_per_piece",
        ]


# ============================================================
# ALTERATION
# ============================================================
# ============================================================
# ALTERATION
# ============================================================
# ============================================================
# ALTERATION
# ============================================================

class AlterationSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    assigned_employee_name = serializers.CharField(
        source="assigned_employee.name",
        read_only=True
    )
    commission_rate = serializers.DecimalField(
    max_digits=5,
    decimal_places=2,
    read_only=True
    )

    commission_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Alteration

        fields = [
            # ------------------------------------------------
            # BASIC
            # ------------------------------------------------
            "id",

            "branch",
            "branch_name",

            "customer_name",
            "phone",

            "alteration_date",

            # ------------------------------------------------
            # EXPECTED DELIVERY
            # ------------------------------------------------
            "expected_delivery_date",
            "expected_delivery_time",

            # ------------------------------------------------
            # PRODUCT
            # ------------------------------------------------
            "product",
            "product_name",

            "item_name",

            # ------------------------------------------------
            # ALTERATION DETAILS
            # ------------------------------------------------
            "custom_size",
            "notes",

            # ------------------------------------------------
            # EMPLOYEE
            # ------------------------------------------------
            "assigned_employee",
            "assigned_employee_name",

            # ------------------------------------------------
            # AMOUNTS
            # ------------------------------------------------
            "total_amount",
            "advance_amount",
            "advance_payment_mode",
            "balance_amount",

            # ------------------------------------------------
            # DELIVERY PAYMENT
            # ------------------------------------------------
            "delivered_amount",
            "delivery_payment_mode",

            # ------------------------------------------------
            # ACTUAL DELIVERY
            # ------------------------------------------------
            "delivery_date",
            "delivery_time",
            "delivered_at",

            # ------------------------------------------------
            # STATUS
            # ------------------------------------------------
            "status",

            # ------------------------------------------------
            # SYSTEM
            # ------------------------------------------------
            "created_at",
            "updated_at",
            "commission_rate",
            "commission_amount",
        ]

        read_only_fields = [
            "id",
            "branch_name",
            "product_name",
            "assigned_employee_name",

            # Automatically calculated
            "balance_amount",

            # System generated
            "delivered_at",
            "created_at",
            "updated_at",
            "commission_rate",
            "commission_amount",
        ]

    # ========================================================
    # VALIDATION
    # ========================================================

    def validate(self, attrs):

        total_amount = attrs.get(
            "total_amount",
            getattr(self.instance, "total_amount", 0)
        )

        advance_amount = attrs.get(
            "advance_amount",
            getattr(self.instance, "advance_amount", 0)
        )

        delivered_amount = attrs.get(
            "delivered_amount",
            getattr(self.instance, "delivered_amount", 0)
        )

        # -----------------------------------------------
        # Negative amount validation
        # -----------------------------------------------

        if total_amount < 0:
            raise serializers.ValidationError({
                "total_amount": "Total amount cannot be negative."
            })

        if advance_amount < 0:
            raise serializers.ValidationError({
                "advance_amount": "Advance amount cannot be negative."
            })

        if delivered_amount < 0:
            raise serializers.ValidationError({
                "delivered_amount": "Delivered amount cannot be negative."
            })

        # -----------------------------------------------
        # Payment cannot exceed total
        # -----------------------------------------------

        if advance_amount + delivered_amount > total_amount:
            raise serializers.ValidationError({
                "advance_amount": (
                    "Advance + delivered amount "
                    "cannot exceed total amount."
                )
            })

        return attrs
    
class BranchProductSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    barcode = serializers.CharField(
        source="product.barcode",
        read_only=True
    )

    category_name = serializers.CharField(
        source="product.category.name",
        read_only=True
    )

    total_value = serializers.SerializerMethodField()

    def get_total_value(self, obj):
        return float(obj.stock * obj.selling_price)

    class Meta:
        model = BranchProduct
        fields = [
            "id",
            "branch",
            "branch_name",
            "product",
            "product_name",
            "barcode",
            "category_name",
            "stock",
            "selling_price",
            "total_value",
        ]
# ============================================================
# STOCK TRANSFER / STOCK MOVEMENT
# ============================================================

class StockTransferSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    employee_name = serializers.CharField(
        source="employee.name",
        read_only=True,
        allow_null=True
    )

    movement_type_display = serializers.CharField(
        source="get_movement_type_display",
        read_only=True
    )

    class Meta:
        model = StockTransfer

        fields = [
            "id",

            # Product
            "product",
            "product_name",

            # Branch
            "branch",
            "branch_name",

            # Employee
            "employee",
            "employee_name",

            # Movement
            "movement_type",
            "movement_type_display",

            # Quantity / Date
            "quantity",
            "transfer_date",

            # Notes
            "remarks",

            # System
            "created_at",
        ]

        read_only_fields = [
            "id",
            "product_name",
            "branch_name",
            "employee_name",
            "movement_type_display",
            "created_at",
        ]

# ============================================================
# PRODUCTION JOB
# ============================================================

class JobPurchaseSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    class Meta:
        model = JobPurchase

        fields = [
            "id",
            "job",
            "product",
            "product_name",
            "quantity",
            "rate",
            "total",
            "supplier",
            "purchase_date",
            "payment_mode",
            "created_at",
        ]

        read_only_fields = [
            "total",
            "product_name",
            "created_at",
        ]


class JobPaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = JobPayment

        fields = [
            "id",
            "job",
            "amount",
            "payment_type",
            "payment_mode",
            "payment_date",
            "remarks",
            "created_at",
        ]

        read_only_fields = [
            "created_at",
        ]


class ProductionJobSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    customer_mobile = serializers.CharField(
        source="customer.mobile",
        read_only=True
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )

    purchases = JobPurchaseSerializer(
        many=True,
        read_only=True
    )

    payments = JobPaymentSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = ProductionJob

        fields = [
            "id",

            "branch",
            "branch_name",

            "customer",
            "customer_name",
            "customer_mobile",

            "job_type",
            "job_date",
            "expected_delivery",

            "quantity",

            "total_amount",
            "advance",
            "balance",

            "status",
            "status_display",

            "remarks",

            "purchases",
            "payments",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "branch",
            "branch_name",

            "customer_name",
            "customer_mobile",

            "balance",

            "status_display",

            "purchases",
            "payments",

            "created_at",
            "updated_at",
        ]