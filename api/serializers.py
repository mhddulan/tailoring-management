from rest_framework import serializers

from branches.models import Branch
from customers.models import Customer, Measurement
from orders.models import Order, OrderItem, Payment
from daybook.models import DayBook, OpeningBalance

from products.models import (
    Sale,
    SaleItem,
    Product,
    ProductCategory,
    BranchProduct,
    StockTransfer,
    StockProcessing,
)

from alterations.models import Alteration

from employees.models import (
    Employee,
    DailyProduction,
    EmployeeProductRate,
)


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


# ============================================================
# PAYMENT
# ============================================================

class PaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment
        fields = "__all__"


# ============================================================
# ORDER
# ============================================================

class OrderSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    customer_mobile = serializers.CharField(
        source="customer.mobile",
        read_only=True
    )

    items = OrderItemSerializer(
        many=True,
        read_only=True
    )

    payments = PaymentSerializer(
        many=True,
        read_only=True
    )

    total_amount = serializers.SerializerMethodField()
    total_received = serializers.SerializerMethodField()
    advance_received = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Order

        fields = [
            "id",
            "customer",
            "customer_name",
            "customer_mobile",

            "order_date",
            "delivery_date",

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
        ]

    def get_total_amount(self, obj):
        return float(obj.total_amount())

    def get_total_received(self, obj):
        return float(obj.total_received())

    def get_advance_received(self, obj):
        return float(
            sum(
                payment.amount
                for payment in obj.payments.all()
                if payment.payment_type == "Advance"
            )
        )

    def get_balance_due(self, obj):
        return float(
            obj.total_amount()
            - obj.total_received()
        )


# ============================================================
# DAY BOOK
# ============================================================

class DayBookSerializer(serializers.ModelSerializer):

    class Meta:
        model = DayBook
        fields = "__all__"


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
            "branch_product",
            "product_name",
            "barcode",
            "quantity",
            "rate",
            "amount",
        ]


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
        read_only=True
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

class StockProcessingSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    input_product_name = serializers.CharField(
        source="input_product.name",
        read_only=True
    )

    output_product_name = serializers.CharField(
        source="output_product.name",
        read_only=True,
        allow_null=True
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

    remaining_to_issue = serializers.IntegerField(
        read_only=True
    )

    pending_quantity = serializers.IntegerField(
        read_only=True
    )

    is_fully_issued = serializers.BooleanField(
        read_only=True
    )

    is_fully_returned = serializers.BooleanField(
        read_only=True
    )

    class Meta:
        model = StockProcessing

        fields = [
            "id",

            # Branch
            "branch",
            "branch_name",

            # Processing
            "process_type",
            "process_type_display",
            "status",
            "status_display",

            # Input
            "input_product",
            "input_product_name",
            "input_quantity",
            "issued_quantity",
            "remaining_to_issue",

            # Output
            "output_product",
            "output_product_name",
            "output_quantity",
            "returned_quantity",
            "pending_quantity",

            # Employee
            "employee",
            "employee_name",

            # Dates
            "issue_date",
            "expected_date",
            "completed_date",

            # Notes
            "remarks",

            # System
            "created_at",
            "updated_at",

            # Calculated
            "is_fully_issued",
            "is_fully_returned",
        ]

        read_only_fields = [
            "issued_quantity",
            "returned_quantity",
            "remaining_to_issue",
            "pending_quantity",
            "is_fully_issued",
            "is_fully_returned",
            "issue_date",
            "completed_date",
            "created_at",
            "updated_at",
        ]

    def validate_input_quantity(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Input quantity must be greater than 0."
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

    class Meta:
        model = Alteration

        fields = [
            "id",

            "branch",
            "branch_name",

            "customer_name",
            "phone",

            "alteration_date",

            "product",
            "product_name",

            "item_name",

            "custom_size",

            "notes",

            "advance_amount",
            "advance_payment_mode",

            "assigned_employee",
            "assigned_employee_name",
        ]

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

class StockTransferSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    class Meta:
        model = StockTransfer
        fields = [
            "id",
            "product",
            "product_name",
            "branch",
            "branch_name",
            "quantity",
            "transfer_date",
            "remarks",
            "created_at",
        ]
        read_only_fields = ["created_at"]

