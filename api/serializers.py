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

            # Customer
            "customer",
            "customer_name",
            "customer_mobile",

            # Order
            "order_date",

            # Expected Delivery
            "delivery_date",
            "delivery_time",

            # Payment
            "advance_payment_mode",

            # Status
            "status",

            # Actual Delivery
            "delivered_date",
            "delivered_by",

            # Payment Summary
            "total_amount",
            "total_received",
            "advance_received",
            "balance_due",

            # Details
            "items",
            "payments",
        ]

    # =========================================================
    # TOTAL ORDER AMOUNT
    # =========================================================

    def get_total_amount(self, obj):

        return float(
            obj.total_amount()
        )

    # =========================================================
    # TOTAL RECEIVED
    # =========================================================

    def get_total_received(self, obj):

        return float(
            obj.total_received()
        )

    # =========================================================
    # ADVANCE RECEIVED
    # =========================================================

    def get_advance_received(self, obj):

        return float(
            sum(
                payment.amount
                for payment in obj.payments.all()
                if payment.payment_type == "Advance"
            )
        )

    # =========================================================
    # BALANCE DUE
    # =========================================================

    def get_balance_due(self, obj):

        return float(
            obj.total_amount()
            - obj.total_received()
        )
    
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