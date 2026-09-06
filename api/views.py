from datetime import datetime, timedelta

from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.http import JsonResponse
from django.utils import timezone

from rest_framework import serializers, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied

from branches.models import Branch

from customers.models import Customer, Measurement

from orders.models import Order, OrderItem, Payment

from products.models import (
    Product,
    ProductCategory,
    Sale,
    SaleItem,
    BranchProduct,
    StockTransfer,
)

from daybook.models import DayBook, OpeningBalance

from employees.models import (
    Employee,
    DailyProduction,
    EmployeeProductRate,
)

from alterations.models import Alteration

from .serializers import (
    BranchSerializer,
    CustomerSerializer,
    MeasurementSerializer,
    OrderSerializer,
    OrderItemSerializer,
    PaymentSerializer,
    SaleSerializer,
    SaleItemSerializer,
    ProductSerializer,
    ProductCategorySerializer,
    DayBookSerializer,
    OpeningBalanceSerializer,
    EmployeeSerializer,
    DailyProductionSerializer,
    EmployeeProductRateSerializer,
    AlterationSerializer,
    BranchProductSerializer,
    StockTransferSerializer,
)

User = get_user_model()
@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {
                "success": False,
                "message": "Username and password are required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return Response(
            {
                "success": False,
                "message": "Invalid username or password.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Superuser → Admin
    if user.is_superuser and user.role not in ("Admin", "Branch"):
        user.role = "Admin"
        user.save(update_fields=["role"])

    token, created = Token.objects.get_or_create(user=user)

    if user.role == "Admin" or user.is_superuser:
        dashboard = "admin"
    elif user.role == "Branch":
        dashboard = "branch"
    else:
        return Response(
            {
                "success": False,
                "message": "Invalid user role.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    response = Response({
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "dashboard": dashboard,
        },
    })

    response.set_cookie(
        key="auth_token",
        value=token.key,
        httponly=True,
        secure=True,
        samesite="None",
        max_age=60 * 60 * 24 * 7,
    )

    return response

def api_test(request):
    return JsonResponse({
        "success": True,
        "message": "Tailoring Management API is working",
    })
from django.http import JsonResponse

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from customers.models import Customer, Measurement
from .serializers import (
    CustomerSerializer,
    MeasurementSerializer,
)
from .serializers import (
    BranchSerializer,
    CustomerSerializer,
    MeasurementSerializer,
)


def api_test(request):
    return JsonResponse({
        "success": True,
        "message": "Tailoring Management API is working",
    })


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("branch").all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]


class MeasurementViewSet(viewsets.ModelViewSet):
    queryset = Measurement.objects.select_related("customer").all()
    serializer_class = MeasurementSerializer
    permission_classes = [IsAuthenticated]

class BranchViewSet(viewsets.ModelViewSet):

    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):

        name = request.data.get("name", "").strip()
        address = request.data.get("address", "").strip()
        phone = request.data.get("phone", "").strip()
        manager_name = request.data.get(
            "manager_name", ""
        ).strip()

        username = request.data.get(
            "username", ""
        ).strip()

        password = request.data.get(
            "password", ""
        )

        # -------------------------
        # VALIDATION
        # -------------------------

        if not name:
            return Response(
                {"error": "Branch name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not phone:
            return Response(
                {"error": "Phone number is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not manager_name:
            return Response(
                {"error": "Manager name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not username:
            return Response(
                {"error": "Manager username is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password:
            return Response(
                {"error": "Manager password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------
        # USERNAME CHECK
        # -------------------------

        if User.objects.filter(
            username=username
        ).exists():

            return Response(
                {
                    "error":
                    "This manager username already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------
        # CREATE BRANCH
        # -------------------------

        branch = Branch.objects.create(
            name=name,
            address=address,
            phone=phone,
            manager_name=manager_name,
        )

        # -------------------------
        # CREATE MANAGER
        # -------------------------

        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=manager_name,
            branch=branch,
            role="Branch",
        )

        # -------------------------
        # RESPONSE
        # -------------------------

        serializer = self.get_serializer(branch)

        return Response(
            {
                "message": "Branch created successfully.",
                "branch": serializer.data,
                "manager": {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_product_price(request):

    product_id = request.GET.get(
        "product_id"
    )

    customer_id = request.GET.get(
        "customer_id"
    )

    if not product_id or not customer_id:

        return Response(
            {
                "success": False,
                "price": 0,
                "message":
                    "product_id and customer_id are required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        customer = Customer.objects.get(
            id=customer_id
        )

        user = request.user

        # ----------------------------------------------------
        # BRANCH SECURITY
        # ----------------------------------------------------

        if user.role != "Admin":

            if (
                not user.branch_id
                or customer.branch_id != user.branch_id
            ):

                return Response(
                    {
                        "success": False,
                        "message":
                            "You cannot access this customer."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ----------------------------------------------------
        # FIND BRANCH PRODUCT
        # ----------------------------------------------------

        branch_product = BranchProduct.objects.get(
            branch=customer.branch,
            product_id=product_id
        )

        return Response({
            "success": True,
            "price": float(
                branch_product.selling_price
            )
        })

    except Customer.DoesNotExist:

        return Response(
            {
                "success": False,
                "price": 0,
                "message": "Customer not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    except BranchProduct.DoesNotExist:

        return Response(
            {
                "success": False,
                "price": 0,
                "message":
                    "Product is not available in this branch."
            },
            status=status.HTTP_404_NOT_FOUND
        )
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_data(request):

    # =====================================================
    # ADMIN ONLY
    # =====================================================

    if request.user.role != "Admin":
        return Response(
            {
                "success": False,
                "message": "Admin access required."
            },
            status=403
        )

    # =====================================================
    # DATE FILTER
    # =====================================================

    today = timezone.localdate()

    filter_type = request.GET.get(
        "filter",
        "today"
    )

    from_date = today
    to_date = today

    if filter_type == "today":

        from_date = today
        to_date = today

    elif filter_type == "yesterday":

        from_date = today - timedelta(days=1)
        to_date = from_date

    elif filter_type == "week":

        from_date = today - timedelta(
            days=today.weekday()
        )
        to_date = today

    elif filter_type == "month":

        from_date = today.replace(day=1)
        to_date = today

    elif filter_type == "custom":

        from_date_string = request.GET.get(
            "from_date"
        )

        to_date_string = request.GET.get(
            "to_date"
        )

        if from_date_string:
            try:
                from_date = datetime.strptime(
                    from_date_string,
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                from_date = today

        if to_date_string:
            try:
                to_date = datetime.strptime(
                    to_date_string,
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                to_date = today

        if from_date > to_date:
            from_date, to_date = (
                to_date,
                from_date
            )

    # =====================================================
    # QUERYSETS
    # =====================================================

    payments = Payment.objects.filter(
        payment_date__range=[
            from_date,
            to_date
        ]
    )

    orders = Order.objects.filter(
        order_date__range=[
            from_date,
            to_date
        ]
    )

    daybooks = DayBook.objects.filter(
        date__range=[
            from_date,
            to_date
        ]
    )

    # =====================================================
    # BASIC COUNTS
    # =====================================================

    total_branches = Branch.objects.count()

    total_customers = Customer.objects.count()

    total_orders = orders.count()

    # =====================================================
    # ORDER STATUS
    # =====================================================

    pending_orders = orders.filter(
        status="Pending"
    ).count()

    cutting_orders = orders.filter(
        status="Cutting"
    ).count()

    stitching_orders = orders.filter(
        status="Stitching"
    ).count()

    ready_orders = orders.filter(
        status="Ready"
    ).count()

    delivery_orders = orders.filter(
        status="Delivery"
    ).count()

    delivered_orders = orders.filter(
        status="Delivered"
    ).count()

    # =====================================================
    # SALES
    # =====================================================

    total_sales = (
        payments.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # ADVANCE
    # =====================================================

    total_advance = (
        payments.filter(
            payment_type="Advance"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # BALANCE PAYMENT
    # =====================================================

    total_balance_payment = (
        payments.filter(
            payment_type="Balance Payment"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # INCOME
    # =====================================================

    total_income = (
        daybooks.filter(
            transaction_type="Income"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # PURCHASE
    # =====================================================

    total_purchase = (
        daybooks.filter(
            transaction_type="Expense",
            category="Purchase"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # OTHER EXPENSE
    # =====================================================

    total_expense = (
        daybooks.filter(
            transaction_type="Expense"
        )
        .exclude(
            category="Purchase"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    total_expense_all = (
        total_purchase +
        total_expense
    )

    # =====================================================
    # PROFIT
    # =====================================================

    net_profit = (
        total_income -
        total_expense_all
    )

    # =====================================================
    # PAYMENT MODES
    # =====================================================

    def payment_total(mode):
        return (
            payments.filter(
                payment_mode=mode
            )
            .aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

    cash = payment_total("Cash")
    bank = payment_total("Bank")
    online = payment_total("Online")
    cheque = payment_total("Cheque")
    pos = payment_total("POS")

    # =====================================================
    # BILLING
    # =====================================================

    filtered_orders = (
        orders
        .prefetch_related(
            "items",
            "payments"
        )
    )

    total_billed = sum(
        order.total_amount()
        for order in filtered_orders
    )

    total_received = sum(
        payment.amount
        for payment in payments
    )

    outstanding_balance = (
        total_billed -
        total_received
    )

    if outstanding_balance < 0:
        outstanding_balance = 0

    # =====================================================
    # RECENT ORDERS
    # =====================================================

    recent_orders = (
        orders
        .select_related("customer")
        .prefetch_related("items")
        .order_by("-id")[:10]
    )

    # =====================================================
    # RECENT PAYMENTS
    # =====================================================

    recent_payments = (
        payments
        .select_related(
            "order",
            "order__customer"
        )
        .order_by("-id")[:10]
    )

    # =====================================================
    # SALES CHART
    # =====================================================

    monthly_sales = (
        payments
        .annotate(
            month=TruncMonth(
                "payment_date"
            )
        )
        .values("month")
        .annotate(
            total=Sum("amount")
        )
        .order_by("month")
    )

    months = []
    sales = []

    for row in monthly_sales:

        if row["month"]:

            months.append(
                row["month"].strftime(
                    "%b %Y"
                )
            )

            sales.append(
                float(row["total"])
            )

    # =====================================================
    # BRANCH PERFORMANCE
    # =====================================================

    branch_performance = []

    for branch in Branch.objects.all():

        branch_payments = Payment.objects.filter(
            order__customer__branch=branch,
            payment_date__range=[
                from_date,
                to_date
            ]
        )

        branch_sales = (
            branch_payments
            .aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        branch_purchase = (
            DayBook.objects.filter(
                branch=branch,
                date__range=[
                    from_date,
                    to_date
                ],
                transaction_type="Expense",
                category="Purchase"
            )
            .aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        branch_expense = (
            DayBook.objects.filter(
                branch=branch,
                date__range=[
                    from_date,
                    to_date
                ],
                transaction_type="Expense"
            )
            .exclude(
                category="Purchase"
            )
            .aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        branch_orders = (
            Order.objects.filter(
                customer__branch=branch,
                order_date__range=[
                    from_date,
                    to_date
                ]
            )
            .count()
        )

        branch_customers = (
            Customer.objects.filter(
                branch=branch
            )
            .count()
        )

        branch_profit = (
            branch_sales -
            branch_purchase -
            branch_expense
        )

        branch_performance.append({
            "id": branch.id,
            "name": branch.name,
            "sales": float(branch_sales),
            "orders": branch_orders,
            "customers": branch_customers,
            "profit": float(branch_profit),
        })

    # =====================================================
    # SERIALIZE RECENT ORDERS
    # =====================================================

    recent_orders_data = []

    for order in recent_orders:

        recent_orders_data.append({
            "id": order.id,
            "customer": (
                order.customer.name
                if order.customer
                else ""
            ),
            "date": str(order.order_date),
            "status": order.status,
            "amount": float(
                order.total_amount()
            ),
        })

    # =====================================================
    # SERIALIZE RECENT PAYMENTS
    # =====================================================

    recent_payments_data = []

    for payment in recent_payments:

        recent_payments_data.append({
            "id": payment.id,
            "customer": (
                payment.order.customer.name
                if payment.order
                and payment.order.customer
                else ""
            ),
            "date": str(
                payment.payment_date
            ),
            "mode": payment.payment_mode,
            "type": payment.payment_type,
            "amount": float(
                payment.amount
            ),
        })

    # =====================================================
    # RESPONSE
    # =====================================================

    return Response({

        "success": True,

        "period": {
            "filter": filter_type,
            "from_date": str(from_date),
            "to_date": str(to_date),
        },

        "statistics": {

            "total_branches": total_branches,

            "total_customers": total_customers,

            "total_orders": total_orders,

            "total_sales": float(total_sales),

            "total_income": float(total_income),

            "total_purchase": float(
                total_purchase
            ),

            "total_expense": float(
                total_expense
            ),

            "total_expense_all": float(
                total_expense_all
            ),

            "net_profit": float(
                net_profit
            ),

        },

        "payments": {

            "cash": float(cash),

            "bank": float(bank),

            "online": float(online),

            "cheque": float(cheque),

            "pos": float(pos),

            "total_advance": float(
                total_advance
            ),

            "total_balance_payment": float(
                total_balance_payment
            ),

            "total_received": float(
                total_received
            ),

            "total_billed": float(
                total_billed
            ),

            "outstanding_balance": float(
                outstanding_balance
            ),

        },

        "order_status": {

            "pending": pending_orders,

            "cutting": cutting_orders,

            "stitching": stitching_orders,

            "ready": ready_orders,

            "delivery": delivery_orders,

            "delivered": delivered_orders,

        },

        "chart": {

            "months": months,

            "sales": sales,

        },

        "branch_performance": (
            branch_performance
        ),

        "recent_orders": (
            recent_orders_data
        ),

        "recent_payments": (
            recent_payments_data
        ),

    })
# ============================================================
# ORDER API
# ============================================================
class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.select_related(
        "order",
        "product"
    ).all()

    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        order_id = self.request.query_params.get("order")

        if order_id:
            queryset = queryset.filter(order_id=order_id)

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            return queryset

        if user.branch_id:
            return queryset.filter(
                order__customer__branch_id=user.branch_id
            )

        return queryset.none()

    def perform_create(self, serializer):
        order = serializer.validated_data["order"]

        user = self.request.user

        if user.role != "Admin" and not user.is_superuser:

            if not user.branch_id:
                raise serializers.ValidationError(
                    {"order": "No branch assigned."}
                )

            if order.customer.branch_id != user.branch_id:
                raise serializers.ValidationError(
                    {"order": "You cannot add items to this order."}
                )

        serializer.save()
        
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related(
        "branch",
        "customer"
    ).prefetch_related(
        "items"
    ).all()

    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            return queryset

        if user.branch_id:
            return queryset.filter(
                branch_id=user.branch_id
            )

        return queryset.none()


class SaleItemViewSet(viewsets.ModelViewSet):
    queryset = SaleItem.objects.select_related(
        "sale",
        "branch_product",
        "branch_product__product"
    ).all()

    serializer_class = SaleItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        sale_id = self.request.query_params.get("sale")

        if sale_id:
            queryset = queryset.filter(
                sale_id=sale_id
            )

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            return queryset

        if user.branch_id:
            return queryset.filter(
                sale__branch_id=user.branch_id
            )

        return queryset.none()
# ============================================================
# ORDER ITEM API
# ============================================================
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related(
        "customer"
    ).prefetch_related(
        "items",
        "payments"
    ).all()

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        customer_id = self.request.query_params.get("customer")
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            return queryset

        if user.branch_id:
            return queryset.filter(
                customer__branch_id=user.branch_id
            )

        return queryset.none()

    def update(self, request, *args, **kwargs):
        order = self.get_object()

        # Branch security
        user = request.user

        if user.role != "Admin" and not user.is_superuser:
            if not user.branch_id:
                return Response(
                    {"error": "No branch assigned."},
                    status=status.HTTP_403_FORBIDDEN
                )

            if order.customer.branch_id != user.branch_id:
                return Response(
                    {"error": "You cannot update this order."},
                    status=status.HTTP_403_FORBIDDEN
                )

        new_status = request.data.get("status")

        # Preserve original status-update behavior
        if new_status:
            allowed_statuses = [
                "Pending",
                "Cutting",
                "Stitching",
                "Ready",
                "Delivery",
                "Delivered",
            ]

            if new_status not in allowed_statuses:
                return Response(
                    {"error": "Invalid status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = new_status

            if new_status == "Delivered":
                from django.utils import timezone

                order.delivered_date = timezone.now()
                order.delivered_by = request.user
            else:
                order.delivered_date = None
                order.delivered_by = None

            order.save()

        serializer = self.get_serializer(order)

        return Response(serializer.data)
        
# ============================================================
# PAYMENT API
# ============================================================
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        "order",
        "order__customer"
    ).all()

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        order_id = self.request.query_params.get("order")

        if order_id:
            queryset = queryset.filter(order_id=order_id)

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            return queryset

        if user.branch_id:
            return queryset.filter(
                order__customer__branch_id=user.branch_id
            )

        return queryset.none()

    def perform_create(self, serializer):

        order = serializer.validated_data["order"]
        amount = serializer.validated_data["amount"]

        user = self.request.user

        # Branch security
        if user.role != "Admin" and not user.is_superuser:

            if not user.branch_id:
                raise serializers.ValidationError(
                    {"order": "No branch assigned."}
                )

            if order.customer.branch_id != user.branch_id:
                raise serializers.ValidationError(
                    {"order": "You cannot add payment to this order."}
                )

        if amount <= 0:
            raise serializers.ValidationError(
                {"amount": "Payment amount must be greater than 0."}
            )

        current_balance = (
            order.total_amount()
            - order.total_received()
        )

        if amount > current_balance:
            raise serializers.ValidationError(
                {
                    "amount":
                    "Payment exceeds the remaining balance."
                }
            )

        payment = serializer.save()

        DayBook.objects.create(
            branch=order.customer.branch,
            entry_type="Income",
            category=payment.payment_type,
            amount=payment.amount,
            description=f"Payment for Order #{order.id}",
        )
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def order_deliver(request, order_id):

    try:
        order = Order.objects.select_related(
            "customer"
        ).get(id=order_id)

    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    user = request.user

    # ---------------------------------------------------------
    # BRANCH SECURITY
    # ---------------------------------------------------------

    if user.role != "Admin" and not user.is_superuser:

        if not user.branch_id:
            return Response(
                {"error": "No branch assigned."},
                status=status.HTTP_403_FORBIDDEN
            )

        if order.customer.branch_id != user.branch_id:
            return Response(
                {"error": "You cannot deliver this order."},
                status=status.HTTP_403_FORBIDDEN
            )

    # ---------------------------------------------------------
    # STATUS CHECK
    # ---------------------------------------------------------

    if order.status not in ["Ready", "Delivery"]:
        return Response(
            {
                "error":
                "Only Ready or Delivery orders can be delivered."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------------------------------------------------------
    # CURRENT BALANCE
    # ---------------------------------------------------------

    total = order.total_amount()
    received = order.total_received()

    balance = total - received

    if balance < 0:
        balance = 0

    # ---------------------------------------------------------
    # PAYMENT DATA
    # ---------------------------------------------------------

    amount = request.data.get("amount", 0)
    payment_mode = request.data.get(
        "payment_mode",
        "Cash"
    )

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return Response(
            {"error": "Invalid payment amount."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------------------------------------------------------
    # PAYMENT VALIDATION
    # ---------------------------------------------------------

    if amount < 0:
        return Response(
            {"error": "Payment amount cannot be negative."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if amount > balance:
        return Response(
            {
                "error":
                "Payment exceeds the remaining balance.",
                "balance": float(balance)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------------------------------------------------------
    # CREATE BALANCE PAYMENT
    # ---------------------------------------------------------

    if amount > 0:

        payment = Payment.objects.create(
            order=order,
            amount=amount,
            payment_mode=payment_mode,
            payment_type="Balance Payment",
        )

        DayBook.objects.create(
            branch=order.customer.branch,
            entry_type="Income",
            category="Balance Payment",
            amount=amount,
            description=f"Payment for Order #{order.id}",
        )

    # ---------------------------------------------------------
    # DELIVER ORDER
    # ---------------------------------------------------------

    order.status = "Delivered"
    order.delivered_date = timezone.now()
    order.delivered_by = user
    order.save(
        update_fields=[
            "status",
            "delivered_date",
            "delivered_by",
        ]
    )

    return Response({
        "success": True,
        "message": "Order delivered successfully.",
        "order_id": order.id,
        "total": float(total),
        "received": float(
            order.total_received()
        ),
        "balance": float(
            max(
                total - order.total_received(),
                0
            )
        ),
        "status": order.status,
    })
class DayBookViewSet(viewsets.ModelViewSet):

    serializer_class = DayBookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        queryset = DayBook.objects.select_related(
            "branch"
        )

        if user.role == "Admin":
            return queryset.order_by(
                "-date",
                "-id"
            )

        return queryset.filter(
            branch_id=user.branch_id
        ).order_by(
            "-date",
            "-id"
        )

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == "Admin":

            if not serializer.validated_data.get("branch"):
                raise serializers.ValidationError({
                    "branch": "Branch is required."
                })

            serializer.save()

        else:

            if not user.branch_id:
                raise PermissionDenied(
                    "User is not assigned to a branch."
                )

            serializer.save(
                branch_id=user.branch_id
            )

    def perform_update(self, serializer):

        user = self.request.user

        if user.role == "Admin":

            serializer.save()

        else:

            serializer.save(
                branch_id=user.branch_id
            )


class OpeningBalanceViewSet(viewsets.ModelViewSet):

    serializer_class = OpeningBalanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        if user.role != "Admin":
            return OpeningBalance.objects.none()

        return OpeningBalance.objects.select_related(
            "branch"
        ).all()

    def check_admin(self):

        if self.request.user.role != "Admin":
            raise PermissionDenied(
                "Only Admin can manage opening balances."
            )

    def perform_create(self, serializer):

        self.check_admin()
        serializer.save()

    def perform_update(self, serializer):

        self.check_admin()
        serializer.save()

    def perform_destroy(self, instance):

        self.check_admin()
        instance.delete()


# ============================================================
# SALE
# ============================================================

from products.models import Sale
from .serializers import SaleSerializer

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related(
        "branch",
        "customer",
    ).prefetch_related(
        "items__branch_product__product"
    ).all().order_by("-sale_date", "-id")

    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            return queryset

        if user.branch_id:
            return queryset.filter(
                branch_id=user.branch_id
            )

        return queryset.none()

    @transaction.atomic
    def create(self, request, *args, **kwargs):

        user = request.user

        branch_id = request.data.get("branch")
        customer_id = request.data.get("customer")
        sale_date = request.data.get("sale_date")
        payment_mode = request.data.get("payment_mode")
        items = request.data.get("items", [])

        # Branch security
        if user.role == "Admin" or user.is_superuser:
            if not branch_id:
                return Response(
                    {"error": "Branch is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            if not user.branch_id:
                return Response(
                    {"error": "User is not assigned to a branch."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            branch_id = user.branch_id

        if not sale_date:
            return Response(
                {"error": "Sale date is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not payment_mode:
            return Response(
                {"error": "Payment mode is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not items:
            return Response(
                {"error": "At least one product is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        branch = Branch.objects.get(id=branch_id)

        customer = None

        if customer_id:
            customer = Customer.objects.filter(
                id=customer_id
            ).first()

            if not customer:
                return Response(
                    {"error": "Customer not found."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Validate all items first
        prepared_items = []
        total = 0

        for item in items:

            branch_product_id = item.get("branch_product")
            quantity = item.get("quantity")
            rate = item.get("rate")

            if not branch_product_id:
                return Response(
                    {"error": "Product is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                quantity = int(quantity)
            except (TypeError, ValueError):
                return Response(
                    {"error": "Invalid quantity."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if quantity <= 0:
                return Response(
                    {"error": "Quantity must be greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            branch_product = BranchProduct.objects.select_related(
                "product",
                "branch"
            ).filter(
                id=branch_product_id
            ).first()

            if not branch_product:
                return Response(
                    {"error": "Selected product was not found."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Product must belong to selected branch
            if branch_product.branch_id != branch.id:
                return Response(
                    {
                        "error":
                        f"{branch_product.product.name} "
                        "does not belong to the selected branch."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Stock validation
            if quantity > branch_product.stock:
                return Response(
                    {
                        "error":
                        f"Insufficient stock for "
                        f"{branch_product.product.name}. "
                        f"Available stock: {branch_product.stock}"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                rate = float(rate)
            except (TypeError, ValueError):
                rate = float(branch_product.selling_price)

            if rate < 0:
                return Response(
                    {"error": "Rate cannot be negative."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            amount = quantity * rate
            total += amount

            prepared_items.append({
                "branch_product": branch_product,
                "quantity": quantity,
                "rate": rate,
                "amount": amount,
            })

        # Create sale
        sale = Sale.objects.create(
            branch=branch,
            customer=customer,
            sale_date=sale_date,
            payment_mode=payment_mode,
            total=total,
        )

        # Create sale items + deduct stock
        for item in prepared_items:

            branch_product = item["branch_product"]

            SaleItem.objects.create(
                sale=sale,
                branch_product=branch_product,
                quantity=item["quantity"],
                rate=item["rate"],
                amount=item["amount"],
            )

            branch_product.stock -= item["quantity"]
            branch_product.save(
                update_fields=["stock"]
            )

        # DayBook entry
        DayBook.objects.create(
            branch=branch,
            date=sale.sale_date,
            transaction_type="Income",
            category="Ready Made Sale",
            payment_mode=sale.payment_mode,
            description=f"Ready Made Sale #{sale.id}",
            amount=total,
        )

        serializer = self.get_serializer(sale)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


# ============================================================
# PRODUCTS
# ============================================================

from products.models import Product, ProductCategory
from .serializers import ProductSerializer
from django.db.models import Sum

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.select_related("category").annotate(
            stock=Sum("branch_products__stock")
        ).order_by("-id")

    def perform_destroy(self, instance):
        if self.request.user.role != "Admin":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only Admin can delete products.")
        
        instance.delete()
class EmployeeViewSet(viewsets.ModelViewSet):

    queryset = Employee.objects.select_related(
        "branch"
    ).all()

    serializer_class = EmployeeSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:

            pass

        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        search = self.request.query_params.get(
            "search",
            ""
        ).strip()

        if search:

            queryset = queryset.filter(
                Q(name__icontains=search)
                |
                Q(mobile__icontains=search)
                |
                Q(designation__icontains=search)
                |
                Q(branch__name__icontains=search)
            )

        return queryset.order_by(
            "branch__name",
            "name"
        )

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch"
            )

            if not branch:

                raise serializers.ValidationError({
                    "branch":
                    "Branch is required."
                })

            serializer.save(
                branch=branch
            )

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            serializer.save(
                branch_id=user.branch_id
            )

    def perform_update(self, serializer):

        user = self.request.user

        employee = self.get_object()

        if user.role == "Admin" or user.is_superuser:

            serializer.save()

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            serializer.save(
                branch_id=user.branch_id
            )

class DailyProductionViewSet(viewsets.ModelViewSet):

    queryset = DailyProduction.objects.select_related(
        "branch",
        "employee",
        "product",
    ).all().order_by(
        "-production_date",
        "employee__name",
        "product__name",
    )

    serializer_class = DailyProductionSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:

            pass

        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        from_date = self.request.query_params.get(
            "from_date"
        )

        to_date = self.request.query_params.get(
            "to_date"
        )

        branch_id = self.request.query_params.get(
            "branch"
        )

        employee_id = self.request.query_params.get(
            "employee"
        )

        product_id = self.request.query_params.get(
            "product"
        )

        if from_date:

            queryset = queryset.filter(
                production_date__gte=from_date
            )

        if to_date:

            queryset = queryset.filter(
                production_date__lte=to_date
            )

        if (
            branch_id
            and (
                user.role == "Admin"
                or user.is_superuser
            )
        ):

            queryset = queryset.filter(
                branch_id=branch_id
            )

        if employee_id:

            queryset = queryset.filter(
                employee_id=employee_id
            )

        if product_id:

            queryset = queryset.filter(
                product_id=product_id
            )

        return queryset

    def perform_create(self, serializer):

        user = self.request.user

        employee = serializer.validated_data.get(
            "employee"
        )

        if not employee:

            raise serializers.ValidationError({
                "employee":
                "Employee is required."
            })

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            if employee.branch_id != user.branch_id:

                raise serializers.ValidationError({
                    "employee":
                    "Employee does not belong to your branch."
                })

        serializer.save(
            branch=employee.branch
        )

    def perform_update(self, serializer):

        user = self.request.user

        employee = serializer.validated_data.get(
            "employee",
            self.get_object().employee
        )

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if employee.branch_id != user.branch_id:

                raise serializers.ValidationError({
                    "employee":
                    "Employee does not belong to your branch."
                })

        serializer.save(
            branch=employee.branch
        )

class EmployeeProductRateViewSet(
    viewsets.ModelViewSet
):

    queryset = EmployeeProductRate.objects.select_related(
        "employee",
        "product",
        "employee__branch",
    ).all()

    serializer_class = EmployeeProductRateSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:

            pass

        elif user.branch_id:

            queryset = queryset.filter(
                employee__branch_id=user.branch_id
            )

        else:

            return queryset.none()

        employee_id = self.request.query_params.get(
            "employee"
        )

        product_id = self.request.query_params.get(
            "product"
        )

        if employee_id:
            queryset = queryset.filter(
                employee_id=employee_id
            )

        if product_id:
            queryset = queryset.filter(
                product_id=product_id
            )

        return queryset

    def create(self, request, *args, **kwargs):

        user = request.user

        employee_id = request.data.get(
            "employee"
        )

        product_id = request.data.get(
            "product"
        )

        rate = request.data.get(
            "rate_per_piece"
        )

        employee = Employee.objects.filter(
            id=employee_id
        ).first()

        product = Product.objects.filter(
            id=product_id
        ).first()

        if not employee:

            return Response(
                {
                    "error":
                    "Employee not found."
                },
                status=400
            )

        if not product:

            return Response(
                {
                    "error":
                    "Product not found."
                },
                status=400
            )

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if employee.branch_id != user.branch_id:

                return Response(
                    {
                        "error":
                        "Employee does not belong to your branch."
                    },
                    status=403
                )

        try:

            rate_value = float(rate)

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error":
                    "Invalid rate."
                },
                status=400
            )

        if rate_value < 0:

            return Response(
                {
                    "error":
                    "Rate cannot be negative."
                },
                status=400
            )

        obj, created = (
            EmployeeProductRate.objects.update_or_create(
                employee=employee,
                product=product,
                defaults={
                    "rate_per_piece":
                    rate_value
                }
            )
        )

        serializer = self.get_serializer(obj)

        return Response(
            serializer.data,
            status=201 if created else 200
        )
# ============================================================
# ALTERATION API
# ============================================================

class AlterationViewSet(viewsets.ModelViewSet):

    queryset = Alteration.objects.select_related(
        "branch",
        "product",
        "assigned_employee",
    ).all().order_by(
        "-alteration_date",
        "-id",
    )

    serializer_class = AlterationSerializer
    permission_classes = [IsAuthenticated]

    # --------------------------------------------------------
    # LIST / FILTER
    # --------------------------------------------------------

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        # Admin → all alterations
        if user.role == "Admin" or user.is_superuser:
            pass

        # Branch → own branch only
        elif user.branch_id:
            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:
            return queryset.none()

        # Search
        search = self.request.query_params.get(
            "search",
            ""
        ).strip()

        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(product__name__icontains=search)
                | Q(item_name__icontains=search)
            )

        # Month filter
        month = self.request.query_params.get("month")

        if month:

            try:
                year, month_number = month.split("-")

                queryset = queryset.filter(
                    alteration_date__year=int(year),
                    alteration_date__month=int(month_number),
                )

            except (ValueError, TypeError):
                pass

        # Employee filter
        employee_id = self.request.query_params.get(
            "assigned_employee"
        )

        if employee_id:
            queryset = queryset.filter(
                assigned_employee_id=employee_id
            )

        return queryset

    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------

    def perform_create(self, serializer):

        user = self.request.user

        # ----------------------------------------------------
        # ADMIN
        # ----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch"
            )

            if not branch:
                raise serializers.ValidationError({
                    "branch":
                    "Branch is required."
                })

        # ----------------------------------------------------
        # BRANCH USER
        # ----------------------------------------------------

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            branch = Branch.objects.get(
                id=user.branch_id
            )

        # ----------------------------------------------------
        # EMPLOYEE CHECK
        # ----------------------------------------------------

        assigned_employee = (
            serializer.validated_data.get(
                "assigned_employee"
            )
        )

        if assigned_employee:

            if assigned_employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "assigned_employee":
                    "Employee must belong to the selected branch."
                })

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        alteration = serializer.save(
            branch=branch
        )

        # ----------------------------------------------------
        # ALTERATION ADVANCE → DAY BOOK
        # ----------------------------------------------------

        advance_amount = (
            alteration.advance_amount or 0
        )

        if advance_amount > 0:

            DayBook.objects.create(
                branch=alteration.branch,
                date=alteration.alteration_date,
                transaction_type="Income",
                category="Alteration Advance",
                payment_mode=(
                    alteration.advance_payment_mode
                ),
                description=(
                    f"Alteration #{alteration.id} - "
                    f"{alteration.customer_name}"
                ),
                amount=advance_amount,
            )

    # --------------------------------------------------------
    # UPDATE
    # --------------------------------------------------------

    def perform_update(self, serializer):

        user = self.request.user

        alteration = self.get_object()

        # ----------------------------------------------------
        # DETERMINE BRANCH
        # ----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch",
                alteration.branch
            )

            if not branch:

                raise serializers.ValidationError({
                    "branch":
                    "Branch is required."
                })

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            branch = Branch.objects.get(
                id=user.branch_id
            )

        # ----------------------------------------------------
        # EMPLOYEE CHECK
        # ----------------------------------------------------

        assigned_employee = (
            serializer.validated_data.get(
                "assigned_employee",
                alteration.assigned_employee
            )
        )

        if assigned_employee:

            if assigned_employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "assigned_employee":
                    "Employee must belong to the selected branch."
                })

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        serializer.save(
            branch=branch
        )
class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all().order_by("name")
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "Admin" and not user.is_superuser:
            raise PermissionDenied(
                "Only Admin can create product categories."
            )

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user

        if user.role != "Admin" and not user.is_superuser:
            raise PermissionDenied(
                "Only Admin can edit product categories."
            )

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "Admin" and not user.is_superuser:
            raise PermissionDenied(
                "Only Admin can delete product categories."
            )

        instance.delete()

class BranchProductViewSet(viewsets.ModelViewSet):
    queryset = BranchProduct.objects.select_related(
        "branch",
        "product",
        "product__category",
    ).all()

    serializer_class = BranchProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            pass
        elif user.branch_id:
            queryset = queryset.filter(
                branch_id=user.branch_id
            )
        else:
            return queryset.none()

        search = self.request.query_params.get(
            "search",
            ""
        ).strip()

        if search:
            queryset = queryset.filter(
                Q(product__name__icontains=search)
                | Q(product__barcode__icontains=search)
            )

        return queryset.order_by(
            "product__name"
        )

class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.select_related(
        "product",
        "branch",
    ).all().order_by("-transfer_date", "-id")

    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == "Admin" or user.is_superuser:
            pass
        elif user.branch_id:
            queryset = queryset.filter(
                branch_id=user.branch_id
            )
        else:
            return queryset.none()

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "Admin" and not user.is_superuser:
            raise PermissionDenied(
                "Only Admin can create stock transfers."
            )

        transfer = serializer.save()

        branch_product, created = BranchProduct.objects.get_or_create(
            branch=transfer.branch,
            product=transfer.product,
            defaults={
                "selling_price": transfer.product.purchase_price
            },
        )

        branch_product.stock += transfer.quantity
        branch_product.save(
            update_fields=["stock"]
        )