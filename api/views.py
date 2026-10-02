from datetime import datetime, timedelta
from decimal import Decimal
from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
    action,
)
from production_jobs.models import (
    ProductionJob,
    JobPurchase,
    JobPayment,
)
from rest_framework.authentication import TokenAuthentication
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
    StockProcessing,
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
    StockProcessingSerializer,
    ProductionJobSerializer,
    JobPurchaseSerializer,
    JobPaymentSerializer,
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

    # Create / get DRF token
    token, created = Token.objects.get_or_create(user=user)

    # Determine dashboard
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

    return Response(
        {
            "success": True,
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "dashboard": dashboard,
            },
        },
        status=status.HTTP_200_OK,
    )
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):

    user = request.user

    # ============================================================
    # DASHBOARD
    # ============================================================

    if user.is_superuser:
        dashboard = "admin"

    elif user.role == "Admin":
        dashboard = "admin"

    elif user.role == "Branch":
        dashboard = "branch"

    else:
        dashboard = None

    # ============================================================
    # BRANCH INFORMATION
    # ============================================================

    branch_id = None
    branch_name = None

    if user.branch:
        branch_id = user.branch.id
        branch_name = user.branch.name

    # ============================================================
    # RESPONSE
    # ============================================================

    return Response({

        "success": True,

        "user": {

            "id":
                user.id,

            "username":
                user.username,

            "role":
                user.role,

            "branch_id":
                branch_id,

            "branch_name":
                branch_name,

            "dashboard":
                dashboard,
        },
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

    queryset = Customer.objects.select_related(
        "branch"
    ).all()

    serializer_class = CustomerSerializer

    permission_classes = [
        IsAuthenticated
    ]

    # ========================================================
    # LIST
    # ========================================================

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        # ADMIN → ALL CUSTOMERS
        if user.role == "Admin" or user.is_superuser:

            return queryset.order_by("-id")

        # BRANCH USER → OWN BRANCH ONLY
        if user.branch_id:

            return queryset.filter(
                branch_id=user.branch_id
            ).order_by("-id")

        # NO BRANCH → NO CUSTOMERS
        return queryset.none()

    # ========================================================
    # CREATE
    # ========================================================

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

            serializer.save(
                branch=branch
            )

            return

        # ----------------------------------------------------
        # BRANCH USER
        # ----------------------------------------------------

        if not user.branch_id:

            raise serializers.ValidationError({
                "branch":
                "User is not assigned to a branch."
            })

        # Ignore whatever branch comes from frontend.
        # Always use logged-in user's branch.

        serializer.save(
            branch_id=user.branch_id
        )

    # ========================================================
    # UPDATE
    # ========================================================

    def perform_update(self, serializer):

        user = self.request.user

        # ADMIN
        if user.role == "Admin" or user.is_superuser:

            serializer.save()

            return

        # BRANCH USER
        if not user.branch_id:

            raise serializers.ValidationError({
                "branch":
                "User is not assigned to a branch."
            })

        serializer.save(
            branch_id=user.branch_id
        )

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

    user = request.user
    user_role = str(getattr(user, "role", "")).strip().lower()

    is_admin = (
        user.is_superuser
        or user_role == "admin"
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

    # Normal tailoring order payments
    payments = Payment.objects.filter(
        payment_date__range=[
            from_date,
            to_date
        ]
    )

    # Tailoring orders
    orders = Order.objects.filter(
        order_date__range=[
            from_date,
            to_date
        ]
    )

    # Ready-made sales
    sales = Sale.objects.filter(
        sale_date__range=[
            from_date,
            to_date
        ]
    )

    # DayBook
    daybooks = DayBook.objects.filter(
        date__range=[
            from_date,
            to_date
        ]
    )

    # =====================================================
    # BRANCH FILTERING
    # =====================================================

    if not is_admin:

        if not user.branch_id:

            payments = payments.none()

            orders = orders.none()

            sales = sales.none()

            daybooks = daybooks.none()

            total_branches = 0

            total_customers = 0

        else:

            # Tailoring order payments
            payments = payments.filter(
                order__customer__branch_id=user.branch_id
            )

            # Tailoring orders
            orders = orders.filter(
                customer__branch_id=user.branch_id
            )

            # Ready-made sales
            sales = sales.filter(
                branch_id=user.branch_id
            )

            # DayBook
            daybooks = daybooks.filter(
                branch_id=user.branch_id
            )

            total_branches = 1

            total_customers = Customer.objects.filter(
                branch_id=user.branch_id
            ).count()

    else:

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

    # Tailoring order payments
    order_sales = (
        payments
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # Ready-made sales
    ready_made_sales = (
        sales
        .aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    # Total sales = Order payments + Ready-made sales
    total_sales = (
        order_sales +
        ready_made_sales
    )

    # =====================================================
    # ADVANCE
    # =====================================================

    total_advance = (
        payments
        .filter(
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
        payments
        .filter(
            payment_type="Balance Payment"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # INCOME
    # =====================================================

    # IMPORTANT:
    # Ready-made Sale already creates DayBook Income.
    # Therefore DO NOT add Sale total here again.
    #
    # Otherwise income will be double counted.

    total_income = (
        daybooks
        .filter(
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
        daybooks
        .filter(
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
        daybooks
        .filter(
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

        # Tailoring order payments
        order_total = (
            payments
            .filter(
                payment_mode=mode
            )
            .aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        # Ready-made sales
        ready_made_total = (
            sales
            .filter(
                payment_mode=mode
            )
            .aggregate(
                total=Sum("total")
            )["total"] or 0
        )

        return (
            order_total +
            ready_made_total
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

    # Total tailoring order billing
    order_billed = sum(
        order.total_amount()
        for order in filtered_orders
    )

    # Total ready-made billing
    ready_made_billed = (
        sales
        .aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    # Total billed
    total_billed = (
        order_billed +
        ready_made_billed
    )

    # Total tailoring payments received
    order_received = sum(
        payment.amount
        for payment in payments
    )

    # Ready-made sales are paid at sale time
    ready_made_received = (
        sales
        .aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    # Total received
    total_received = (
        order_received +
        ready_made_received
    )

    # Outstanding balance
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
        .select_related(
            "customer"
        )
        .prefetch_related(
            "items"
        )
        .order_by("-id")[:10]
    )

    # =====================================================
    # RECENT PAYMENTS
    # =====================================================

    # Tailoring payments
    recent_order_payments = (
        payments
        .select_related(
            "order",
            "order__customer"
        )
        .order_by(
            "-payment_date",
            "-id"
        )[:10]
    )

    # Ready-made sales
    recent_ready_made_sales = (
        sales
        .select_related(
            "customer"
        )
        .order_by(
            "-sale_date",
            "-id"
        )[:10]
    )

    # =====================================================
    # SALES CHART
    # =====================================================

    # Tailoring payment monthly data
    payment_monthly = (
        payments
        .annotate(
            month=TruncMonth(
                "payment_date"
            )
        )
        .values(
            "month"
        )
        .annotate(
            total=Sum("amount")
        )
        .order_by("month")
    )

    # Ready-made monthly data
    sale_monthly = (
        sales
        .annotate(
            month=TruncMonth(
                "sale_date"
            )
        )
        .values(
            "month"
        )
        .annotate(
            total=Sum("total")
        )
        .order_by("month")
    )

    # Combine both sources
    monthly_totals = {}

    for row in payment_monthly:

        if row["month"]:

            month_key = row["month"].strftime(
                "%Y-%m"
            )

            monthly_totals[month_key] = (
                monthly_totals.get(
                    month_key,
                    0
                )
                +
                float(
                    row["total"] or 0
                )
            )

    for row in sale_monthly:

        if row["month"]:

            month_key = row["month"].strftime(
                "%Y-%m"
            )

            monthly_totals[month_key] = (
                monthly_totals.get(
                    month_key,
                    0
                )
                +
                float(
                    row["total"] or 0
                )
            )

    months = []

    sales_chart = []

    for month_key in sorted(
        monthly_totals.keys()
    ):

        month_date = datetime.strptime(
            month_key,
            "%Y-%m"
        )

        months.append(
            month_date.strftime(
                "%b %Y"
            )
        )

        sales_chart.append(
            monthly_totals[month_key]
        )

    # =====================================================
    # BRANCH PERFORMANCE
    # =====================================================

    branch_performance = []

    for branch in Branch.objects.all():

        # Tailoring order payments
        branch_payments = Payment.objects.filter(
            order__customer__branch=branch,
            payment_date__range=[
                from_date,
                to_date
            ]
        )

        # Ready-made sales
        branch_ready_made_sales = Sale.objects.filter(
            branch=branch,
            sale_date__range=[
                from_date,
                to_date
            ]
        )

        # Tailoring sales
        branch_order_sales = (
            branch_payments
            .aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        # Ready-made sales
        branch_ready_made_total = (
            branch_ready_made_sales
            .aggregate(
                total=Sum("total")
            )["total"] or 0
        )

        # Combined sales
        branch_sales = (
            branch_order_sales +
            branch_ready_made_total
        )

        # =================================================
        # BRANCH PURCHASE
        # =================================================

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

        # =================================================
        # BRANCH OTHER EXPENSE
        # =================================================

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

        # =================================================
        # BRANCH ORDERS
        # =================================================

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

        # =================================================
        # BRANCH CUSTOMERS
        # =================================================

        branch_customers = (
            Customer.objects.filter(
                branch=branch
            )
            .count()
        )

        # =================================================
        # BRANCH PROFIT
        # =================================================

        branch_profit = (
            branch_sales -
            branch_purchase -
            branch_expense
        )

        branch_performance.append({

            "id": branch.id,

            "name": branch.name,

            "sales": float(
                branch_sales
            ),

            "orders": branch_orders,

            "customers": branch_customers,

            "profit": float(
                branch_profit
            ),

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

            "date": str(
                order.order_date
            ),

            "status": order.status,

            "amount": float(
                order.total_amount()
            ),

        })

    # =====================================================
    # SERIALIZE RECENT PAYMENTS
    # =====================================================

    recent_payments_data = []

    # -----------------------------------------------------
    # NORMAL TAILORING PAYMENTS
    # -----------------------------------------------------

    for payment in recent_order_payments:

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

            "source": "Order",

        })

    # -----------------------------------------------------
    # READY-MADE SALES
    # -----------------------------------------------------

    for sale in recent_ready_made_sales:

        recent_payments_data.append({

            "id": sale.id,

            "customer": (
                sale.customer.name
                if sale.customer
                else "Walk-in Customer"
            ),

            "date": str(
                sale.sale_date
            ),

            "mode": sale.payment_mode,

            "type": "Ready Made Sale",

            "amount": float(
                sale.total
            ),

            "source": "Sale",

        })

    # -----------------------------------------------------
    # SORT RECENT PAYMENTS
    # -----------------------------------------------------

    recent_payments_data.sort(
        key=lambda x: x["date"],
        reverse=True
    )

    recent_payments_data = (
        recent_payments_data[:10]
    )

    # =====================================================
    # RESPONSE
    # =====================================================

    return Response({

        "success": True,

        # =================================================
        # PERIOD
        # =================================================

        "period": {

            "filter": filter_type,

            "from_date": str(
                from_date
            ),

            "to_date": str(
                to_date
            ),

        },

        # =================================================
        # STATISTICS
        # =================================================

        "statistics": {

            "total_branches": (
                total_branches
            ),

            "total_customers": (
                total_customers
            ),

            "total_orders": (
                total_orders
            ),

            "total_sales": float(
                total_sales
            ),

            "total_income": float(
                total_income
            ),

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

        # =================================================
        # PAYMENTS
        # =================================================

        "payments": {

            "cash": float(
                cash
            ),

            "bank": float(
                bank
            ),

            "online": float(
                online
            ),

            "cheque": float(
                cheque
            ),

            "pos": float(
                pos
            ),

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

        # =================================================
        # ORDER STATUS
        # =================================================

        "order_status": {

            "pending": (
                pending_orders
            ),

            "cutting": (
                cutting_orders
            ),

            "stitching": (
                stitching_orders
            ),

            "ready": (
                ready_orders
            ),

            "delivery": (
                delivery_orders
            ),

            "delivered": (
                delivered_orders
            ),

        },

        # =================================================
        # SALES CHART
        # =================================================

        "chart": {

            "months": months,

            "sales": sales_chart,

        },

        # =================================================
        # BRANCH PERFORMANCE
        # =================================================

        "branch_performance": (
            branch_performance
        ),

        # =================================================
        # RECENT ORDERS
        # =================================================

        "recent_orders": (
            recent_orders_data
        ),

        # =================================================
        # RECENT PAYMENTS
        # =================================================

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

    # =========================================================
    # GET ORDERS
    # =========================================================

    def get_queryset(self):

        queryset = super().get_queryset()

        customer_id = self.request.query_params.get(
            "customer"
        )

        if customer_id:
            queryset = queryset.filter(
                customer_id=customer_id
            )

        user = self.request.user

        # -----------------------------------------------------
        # ADMIN
        # -----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:
            return queryset

        # -----------------------------------------------------
        # BRANCH USER
        # -----------------------------------------------------

        if user.branch_id:
            return queryset.filter(
                customer__branch_id=user.branch_id
            )

        return queryset.none()

    # =========================================================
    # CREATE ORDER
    # =========================================================

    def perform_create(self, serializer):

        user = self.request.user

        customer = serializer.validated_data.get(
            "customer"
        )

        if not customer:
            raise serializers.ValidationError({
                "customer": "Customer is required."
            })

        # -----------------------------------------------------
        # ADMIN
        # -----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            serializer.save()

            return

        # -----------------------------------------------------
        # BRANCH USER
        # -----------------------------------------------------

        if not user.branch_id:

            raise serializers.ValidationError({
                "customer":
                "User is not assigned to a branch."
            })

        # Customer must belong to user's branch

        if customer.branch_id != user.branch_id:

            raise serializers.ValidationError({
                "customer":
                "Customer does not belong to your branch."
            })

        serializer.save()

    # =========================================================
    # UPDATE ORDER
    # =========================================================

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        order = self.get_object()

        user = request.user

        # =====================================================
        # BRANCH SECURITY
        # =====================================================

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if not user.branch_id:

                return Response(
                    {
                        "error":
                        "No branch assigned."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if (
                order.customer.branch_id
                != user.branch_id
            ):

                return Response(
                    {
                        "error":
                        "You cannot update this order."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # =====================================================
        # STATUS VALIDATION
        # =====================================================

        new_status = request.data.get(
            "status"
        )

        allowed_statuses = [
            "Pending",
            "Ready",
            "Delivered",
            "Cancel",
        ]

        if (
            new_status
            and new_status not in allowed_statuses
        ):

            return Response(
                {
                    "error":
                    "Invalid status. Allowed statuses are: "
                    "Pending, Ready, Delivered, Cancel."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # SERIALIZER UPDATE
        # =====================================================

        partial = kwargs.pop(
            "partial",
            False
        )

        serializer = self.get_serializer(
            order,
            data=request.data,
            partial=partial
        )

        serializer.is_valid(
            raise_exception=True
        )

        updated_order = serializer.save()

        # =====================================================
        # DELIVERY INFORMATION
        # =====================================================

        if new_status == "Delivered":

            from django.utils import timezone

            updated_order.delivered_date = timezone.now()

            updated_order.delivered_by = request.user

            updated_order.save(
                update_fields=[
                    "delivered_date",
                    "delivered_by",
                ]
            )

        elif new_status:

            updated_order.delivered_date = None

            updated_order.delivered_by = None

            updated_order.save(
                update_fields=[
                    "delivered_date",
                    "delivered_by",
                ]
            )

        # =====================================================
        # RESPONSE
        # =====================================================

        return Response(
            self.get_serializer(
                updated_order
            ).data
        )

        
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

    # ========================================================
    # LIST / FILTER
    # ========================================================

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        # ----------------------------------------------------
        # ADMIN → ALL BRANCHES
        # ----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:
            pass

        # ----------------------------------------------------
        # BRANCH USER → OWN BRANCH ONLY
        # ----------------------------------------------------

        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        # ----------------------------------------------------
        # SEARCH
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # MONTH FILTER
        # ----------------------------------------------------

        month = self.request.query_params.get(
            "month"
        )

        if month:

            try:

                year, month_number = month.split("-")

                queryset = queryset.filter(
                    alteration_date__year=int(year),
                    alteration_date__month=int(month_number),
                )

            except (
                ValueError,
                TypeError
            ):

                pass

        # ----------------------------------------------------
        # STATUS FILTER
        # ----------------------------------------------------

        status_filter = self.request.query_params.get(
            "status"
        )

        if status_filter:

            queryset = queryset.filter(
                status=status_filter
            )

        # ----------------------------------------------------
        # EMPLOYEE FILTER
        # ----------------------------------------------------

        employee_id = self.request.query_params.get(
            "assigned_employee"
        )

        if employee_id:

            queryset = queryset.filter(
                assigned_employee_id=employee_id
            )

        return queryset

    # ========================================================
    # CREATE
    # ========================================================

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        # ----------------------------------------------------
        # DETERMINE BRANCH
        # ----------------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch"
            )

            if not branch:

                raise serializers.ValidationError({
                    "branch": "Branch is required."
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
                "assigned_employee"
            )
        )

        if assigned_employee:

            if assigned_employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "assigned_employee":
                    "Employee must belong to this branch."
                })

        # ----------------------------------------------------
        # AMOUNT VALIDATION
        # ----------------------------------------------------

        total_amount = serializer.validated_data.get(
            "total_amount",
            Decimal("0")
        )

        advance_amount = serializer.validated_data.get(
            "advance_amount",
            Decimal("0")
        )

        if total_amount < 0:

            raise serializers.ValidationError({
                "total_amount":
                "Total amount cannot be negative."
            })

        if advance_amount < 0:

            raise serializers.ValidationError({
                "advance_amount":
                "Advance amount cannot be negative."
            })

        if advance_amount > total_amount:

            raise serializers.ValidationError({
                "advance_amount":
                "Advance cannot be greater than total amount."
            })

        # ----------------------------------------------------
        # SAVE ALTERATION
        # ----------------------------------------------------

        alteration = serializer.save(
            branch=branch,
            delivered_amount=Decimal("0"),
            status="Pending",
        )

        # ----------------------------------------------------
        # ADVANCE → DAY BOOK
        # ----------------------------------------------------

        if alteration.advance_amount > 0:

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

                amount=alteration.advance_amount,
            )

    # ========================================================
    # UPDATE
    # ========================================================

    @transaction.atomic
    def perform_update(self, serializer):

        user = self.request.user

        alteration = self.get_object()

        # ----------------------------------------------------
        # DO NOT EDIT CANCELLED / DELIVERY RECORD
        # ----------------------------------------------------

        if alteration.status == "Delivery":

            raise serializers.ValidationError({
                "status":
                "Delivered alterations cannot be edited."
            })

        if alteration.status == "Cancel":

            raise serializers.ValidationError({
                "status":
                "Cancelled alterations cannot be edited."
            })

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
                    "Employee must belong to this branch."
                })

        # ----------------------------------------------------
        # AMOUNT CHECK
        # ----------------------------------------------------

        total_amount = serializer.validated_data.get(
            "total_amount",
            alteration.total_amount
        )

        advance_amount = serializer.validated_data.get(
            "advance_amount",
            alteration.advance_amount
        )

        if total_amount < 0:

            raise serializers.ValidationError({
                "total_amount":
                "Total amount cannot be negative."
            })

        if advance_amount < 0:

            raise serializers.ValidationError({
                "advance_amount":
                "Advance cannot be negative."
            })

        if advance_amount > total_amount:

            raise serializers.ValidationError({
                "advance_amount":
                "Advance cannot be greater than total amount."
            })

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        serializer.save(
            branch=branch
        )

    # ========================================================
    # DELIVER ALTERATION
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="deliver"
    )
    @transaction.atomic
    def deliver(self, request, pk=None):

        alteration = self.get_object()

        user = request.user

        # ----------------------------------------------------
        # BRANCH SECURITY
        # ----------------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if alteration.branch_id != user.branch_id:

                return Response(
                    {
                        "error":
                        "You cannot deliver an alteration "
                        "from another branch."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ----------------------------------------------------
        # ALREADY DELIVERY
        # ----------------------------------------------------

        if alteration.status == "Delivery":

            return Response(
                {
                    "error":
                    "This alteration is already delivered."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CANCELLED
        # ----------------------------------------------------

        if alteration.status == "Cancel":

            return Response(
                {
                    "error":
                    "Cancelled alteration cannot be delivered."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CURRENT BALANCE
        # ----------------------------------------------------

        current_balance = (
            alteration.total_amount
            - alteration.advance_amount
            - alteration.delivered_amount
        )

        if current_balance < 0:

            current_balance = Decimal("0")

        # ----------------------------------------------------
        # DELIVERY AMOUNT
        # ----------------------------------------------------

        delivered_amount = request.data.get(
            "delivered_amount"
        )

        if delivered_amount in [
            None,
            "",
        ]:

            delivered_amount = current_balance

        try:

            delivered_amount = Decimal(
                str(delivered_amount)
            )

        except (
            InvalidOperation,
            ValueError,
            TypeError
        ):

            return Response(
                {
                    "error":
                    "Invalid delivery amount."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # NEGATIVE CHECK
        # ----------------------------------------------------

        if delivered_amount < 0:

            return Response(
                {
                    "error":
                    "Delivery amount cannot be negative."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # FULL BALANCE REQUIRED
        # ----------------------------------------------------

        if delivered_amount != current_balance:

            return Response(
                {
                    "error":
                    "The full balance amount must be "
                    "received before delivery.",
                    "balance_due":
                    str(current_balance),
                    "entered_amount":
                    str(delivered_amount),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # PAYMENT MODE
        # ----------------------------------------------------

        payment_mode = request.data.get(
            "delivery_payment_mode",
            "Cash"
        )

        valid_payment_modes = [
            choice[0]
            for choice in Alteration.PAYMENT_CHOICES
        ]

        if payment_mode not in valid_payment_modes:

            return Response(
                {
                    "error":
                    "Invalid delivery payment mode."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # DELIVERY DATE
        # ----------------------------------------------------

        delivery_date = request.data.get(
            "delivery_date"
        )

        if delivery_date:

            try:

                from datetime import datetime

                delivery_date = datetime.strptime(
                    delivery_date,
                    "%Y-%m-%d"
                ).date()

            except ValueError:

                return Response(
                    {
                        "error":
                        "Invalid delivery date. "
                        "Use YYYY-MM-DD."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        else:

            delivery_date = timezone.localdate()

        # ----------------------------------------------------
        # DELIVERY TIME
        # ----------------------------------------------------

        delivery_time = request.data.get(
            "delivery_time"
        )

        if delivery_time:

            try:

                delivery_time = time.fromisoformat(
                    delivery_time
                )

            except ValueError:

                return Response(
                    {
                        "error":
                        "Invalid delivery time. "
                        "Use HH:MM or HH:MM:SS."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        else:

            delivery_time = timezone.localtime().time()

        # ----------------------------------------------------
        # UPDATE ALTERATION
        # ----------------------------------------------------

        alteration.delivered_amount = (
            delivered_amount
        )

        alteration.delivery_payment_mode = (
            payment_mode
        )

        alteration.delivery_date = (
            delivery_date
        )

        alteration.delivery_time = (
            delivery_time
        )

        alteration.delivered_at = (
            timezone.now()
        )

        alteration.status = "Delivery"

        alteration.save()

        # ----------------------------------------------------
        # BALANCE PAYMENT → DAY BOOK
        # ----------------------------------------------------

        if delivered_amount > 0:

            DayBook.objects.create(

                branch=alteration.branch,

                date=delivery_date,

                transaction_type="Income",

                category="Balance Payment",

                payment_mode=payment_mode,

                description=(
                    f"Alteration #{alteration.id} "
                    f"Balance Payment - "
                    f"{alteration.customer_name}"
                ),

                amount=delivered_amount,
            )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return Response(
            {
                "success": True,

                "message":
                "Alteration delivered successfully.",

                "alteration_id":
                alteration.id,

                "total_amount":
                str(alteration.total_amount),

                "advance_amount":
                str(alteration.advance_amount),

                "delivered_amount":
                str(alteration.delivered_amount),

                "balance_amount":
                str(alteration.balance_amount),

                "delivery_payment_mode":
                alteration.delivery_payment_mode,

                "delivery_date":
                alteration.delivery_date,

                "delivery_time":
                alteration.delivery_time,

                "status":
                alteration.status,
            },
            status=status.HTTP_200_OK
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
@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def branch_dashboard_data(request):

    if request.user.role != "Branch":
        return Response(
            {
                "success": False,
                "message": "Branch access required."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    branch = request.user.branch

    if not branch:
        return Response(
            {
                "success": False,
                "message": "No branch is assigned to this user."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    today = timezone.localdate()

    filter_type = request.GET.get("filter", "today")

    from_date = today
    to_date = today

    # =====================================================
    # DATE FILTER
    # =====================================================

    if filter_type == "yesterday":

        from_date = today - timedelta(days=1)
        to_date = from_date

    elif filter_type == "week":

        from_date = today - timedelta(days=today.weekday())
        to_date = today

    elif filter_type == "month":

        from_date = today.replace(day=1)
        to_date = today

    elif filter_type == "custom":

        from_date_string = request.GET.get("from_date")
        to_date_string = request.GET.get("to_date")

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
            from_date, to_date = to_date, from_date

    # =====================================================
    # BRANCH DATA
    # =====================================================

    # Normal tailoring orders
    branch_orders = Order.objects.filter(
        customer__branch=branch,
        order_date__range=[from_date, to_date]
    )

    # Normal order payments
    branch_payments = Payment.objects.filter(
        order__customer__branch=branch,
        payment_date__range=[from_date, to_date]
    )

    # READY-MADE SALES
    branch_sales = Sale.objects.filter(
        branch=branch,
        sale_date__range=[from_date, to_date]
    )

    # DayBook
    branch_daybook = DayBook.objects.filter(
        branch=branch,
        date__range=[from_date, to_date]
    )

    # =====================================================
    # COUNTS
    # =====================================================

    customers = Customer.objects.filter(
        branch=branch
    ).count()

    orders = branch_orders.count()

    pending = branch_orders.filter(
        status="Pending"
    ).count()

    cutting = branch_orders.filter(
        status="Cutting"
    ).count()

    stitching = branch_orders.filter(
        status="Stitching"
    ).count()

    ready = branch_orders.filter(
        status="Ready"
    ).count()

    delivery = branch_orders.filter(
        status="Delivery"
    ).count()

    delivered = branch_orders.filter(
        status="Delivered"
    ).count()

    # =====================================================
    # FINANCIAL
    # =====================================================

    # -----------------------------------------------------
    # ORDER PAYMENTS
    # -----------------------------------------------------

    order_payment_sales = (
        branch_payments.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # -----------------------------------------------------
    # READY-MADE SALES
    # -----------------------------------------------------

    ready_made_sales = (
        branch_sales.aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    # -----------------------------------------------------
    # TOTAL SALES
    # -----------------------------------------------------

    total_sales = (
        order_payment_sales +
        ready_made_sales
    )

    # =====================================================
    # PURCHASE
    # =====================================================

    total_purchase = (
        branch_daybook
        .filter(
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
        branch_daybook
        .filter(
            transaction_type="Expense"
        )
        .exclude(
            category="Purchase"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # TOTAL INCOME
    # =====================================================

    # IMPORTANT:
    # Ready-made Sale already creates a DayBook Income entry.
    # Therefore we DO NOT add branch_sales here again.

    total_income = (
        branch_daybook
        .filter(
            transaction_type="Income"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # TOTAL EXPENSE
    # =====================================================

    total_expense_all = (
        total_purchase +
        total_expense
    )

    # =====================================================
    # NET PROFIT
    # =====================================================

    net_profit = (
        total_income -
        total_expense_all
    )

    # =====================================================
    # PAYMENT MODES
    # =====================================================

    def payment_total(mode):

        # Normal tailoring order payments
        order_total = (
            branch_payments
            .filter(
                payment_mode=mode
            )
            .aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        # Ready-made sales
        sale_total = (
            branch_sales
            .filter(
                payment_mode=mode
            )
            .aggregate(
                total=Sum("total")
            )["total"] or 0
        )

        return (
            order_total +
            sale_total
        )

    cash = payment_total("Cash")

    bank = payment_total("Bank")

    online = payment_total("Online")

    cheque = payment_total("Cheque")

    pos = payment_total("POS")

    # =====================================================
    # PAYMENT SUMMARY
    # =====================================================

    # Normal tailoring order advances
    total_advance = (
        branch_payments
        .filter(
            payment_type="Advance"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # Normal tailoring order balance payments
    total_balance_payment = (
        branch_payments
        .filter(
            payment_type="Balance Payment"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # -----------------------------------------------------
    # TOTAL RECEIVED
    # -----------------------------------------------------

    order_received = (
        branch_payments.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    sale_received = (
        branch_sales.aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    total_received = (
        order_received +
        sale_received
    )

    # =====================================================
    # BILLING
    # =====================================================

    filtered_orders = branch_orders.prefetch_related(
        "items",
        "payments"
    )

    # Normal tailoring order billing
    order_billed = sum(
        order.total_amount()
        for order in filtered_orders
    )

    # Ready-made sale billing
    sale_billed = (
        branch_sales.aggregate(
            total=Sum("total")
        )["total"] or 0
    )

    # Total billed
    total_billed = (
        order_billed +
        sale_billed
    )

    # =====================================================
    # OUTSTANDING BALANCE
    # =====================================================

    outstanding_balance = max(
        total_billed - total_received,
        0
    )

    # =====================================================
    # RECENT ORDERS
    # =====================================================

    recent_orders = (
        branch_orders
        .select_related("customer")
        .order_by("-id")[:10]
    )

    recent_orders_data = [
        {
            "id": order.id,
            "customer": order.customer.name,
            "order_date": order.order_date,
            "status": order.status,
            "total_amount": float(
                order.total_amount()
            ),
        }
        for order in recent_orders
    ]

    # =====================================================
    # RECENT PAYMENTS
    # =====================================================

    # Normal order payments
    recent_order_payments = (
        branch_payments
        .select_related(
            "order",
            "order__customer"
        )
        .order_by("-id")[:10]
    )

    recent_payments_data = []

    for payment in recent_order_payments:

        recent_payments_data.append(
            {
                "id": payment.id,
                "customer": payment.order.customer.name,
                "payment_date": payment.payment_date,
                "payment_mode": payment.payment_mode,
                "payment_type": payment.payment_type,
                "amount": float(payment.amount),
                "source": "Order",
            }
        )

    # -----------------------------------------------------
    # READY-MADE SALE PAYMENTS
    # -----------------------------------------------------

    recent_sales = (
        branch_sales
        .select_related(
            "customer"
        )
        .order_by("-id")[:10]
    )

    for sale in recent_sales:

        customer_name = "Walk-in Customer"

        if sale.customer:
            customer_name = sale.customer.name

        recent_payments_data.append(
            {
                "id": f"sale-{sale.id}",
                "customer": customer_name,
                "payment_date": sale.sale_date,
                "payment_mode": sale.payment_mode,
                "payment_type": "Ready Made Sale",
                "amount": float(sale.total),
                "source": "Sale",
            }
        )

    # -----------------------------------------------------
    # SORT RECENT PAYMENTS
    # -----------------------------------------------------

    recent_payments_data = sorted(
        recent_payments_data,
        key=lambda x: str(
            x["payment_date"]
        ),
        reverse=True
    )[:10]

    # =====================================================
    # RESPONSE
    # =====================================================

    return Response(
        {
            "success": True,

            "branch": {
                "id": branch.id,
                "name": branch.name,
            },

            "filter": {
                "type": filter_type,
                "from_date": str(from_date),
                "to_date": str(to_date),
            },

            # =================================================
            # COUNTS
            # =================================================

            "counts": {

                "customers": customers,

                "orders": orders,

                "pending": pending,

                "cutting": cutting,

                "stitching": stitching,

                "ready": ready,

                "delivery": delivery,

                "delivered": delivered,
            },

            # =================================================
            # FINANCIAL
            # =================================================

            "financial": {

                "total_sales": float(
                    total_sales
                ),

                "total_income": float(
                    total_income
                ),

                "total_purchase": float(
                    total_purchase
                ),

                "total_expense": float(
                    total_expense
                ),

                "net_profit": float(
                    net_profit
                ),
            },

            # =================================================
            # PAYMENTS
            # =================================================

            "payments": {

                "cash": float(
                    cash
                ),

                "bank": float(
                    bank
                ),

                "online": float(
                    online
                ),

                "cheque": float(
                    cheque
                ),

                "pos": float(
                    pos
                ),

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

            # =================================================
            # RECENT DATA
            # =================================================

            "recent_orders": recent_orders_data,

            "recent_payments": recent_payments_data,
        }
    )
# ============================================================
# STOCK PROCESSING API
# ============================================================

class StockProcessingViewSet(viewsets.ModelViewSet):

    queryset = StockProcessing.objects.select_related(
        "branch",
        "input_product",
        "output_product",
        "employee",
    ).all().order_by(
        "-created_at",
        "-id",
    )

    serializer_class = StockProcessingSerializer
    permission_classes = [IsAuthenticated]

    # --------------------------------------------------------
    # LIST / FILTER
    # --------------------------------------------------------

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        # Admin → all branches
        if user.role == "Admin" or user.is_superuser:
            pass

        # Branch → own branch only
        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        # Optional filters
        process_type = self.request.query_params.get(
            "process_type"
        )

        status_filter = self.request.query_params.get(
            "status"
        )

        employee_id = self.request.query_params.get(
            "employee"
        )

        if process_type:
            queryset = queryset.filter(
                process_type=process_type
            )

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        if employee_id:
            queryset = queryset.filter(
                employee_id=employee_id
            )

        return queryset

    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        # -----------------------------------------------
        # DETERMINE BRANCH
        # -----------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch"
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

        # -----------------------------------------------
        # INPUT PRODUCT
        # -----------------------------------------------

        input_product = (
            serializer.validated_data.get(
                "input_product"
            )
        )

        input_quantity = (
            serializer.validated_data.get(
                "input_quantity"
            )
        )

        if not input_product:

            raise serializers.ValidationError({
                "input_product":
                "Input product is required."
            })

        if not input_quantity or input_quantity <= 0:

            raise serializers.ValidationError({
                "input_quantity":
                "Input quantity must be greater than 0."
            })

        # -----------------------------------------------
        # OUTPUT PRODUCT
        # -----------------------------------------------

        output_product = (
            serializer.validated_data.get(
                "output_product"
            )
        )

        if not output_product:

            raise serializers.ValidationError({
                "output_product":
                "Output product is required."
            })

        # -----------------------------------------------
        # EMPLOYEE
        # -----------------------------------------------

        employee = serializer.validated_data.get(
            "employee"
        )

        if employee:

            if employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "employee":
                    "Employee must belong to the selected branch."
                })

        # -----------------------------------------------
        # CHECK BRANCH STOCK
        # -----------------------------------------------

        branch_product = (
            BranchProduct.objects
            .select_for_update()
            .filter(
                branch=branch,
                product=input_product,
            )
            .first()
        )

        if not branch_product:

            raise serializers.ValidationError({
                "input_product":
                "Input product is not available in this branch."
            })

        if branch_product.stock < input_quantity:

            raise serializers.ValidationError({
                "input_quantity":
                f"Insufficient stock for "
                f"{input_product.name}. "
                f"Available stock: "
                f"{branch_product.stock}"
            })

        # -----------------------------------------------
        # SAVE PROCESSING
        # -----------------------------------------------

        processing = serializer.save(
            branch=branch
        )

        # -----------------------------------------------
        # IMPORTANT
        # -----------------------------------------------
        #
        # We DO NOT deduct stock here.
        #
        # Stock is deducted only when the user
        # clicks "Issue".
        #

        return processing

    # --------------------------------------------------------
    # UPDATE
    # --------------------------------------------------------

    def perform_update(self, serializer):

        processing = self.get_object()

        user = self.request.user

        if (
            processing.issued_quantity > 0
            or processing.returned_quantity > 0
        ):

            raise serializers.ValidationError({
                "error":
                "Processing cannot be edited after stock has been issued or returned."
            })

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch",
                processing.branch
            )

        else:

            if not user.branch_id:

                raise serializers.ValidationError({
                    "branch":
                    "User is not assigned to a branch."
                })

            branch = Branch.objects.get(
                id=user.branch_id
            )

        employee = serializer.validated_data.get(
            "employee",
            processing.employee
        )

        if employee:

            if employee.branch_id != branch.id:

                raise serializers.ValidationError({
                    "employee":
                    "Employee must belong to the selected branch."
                })

        serializer.save(
            branch=branch
        )

    # ========================================================
    # ISSUE STOCK
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="issue"
    )
    @transaction.atomic
    def issue(self, request, pk=None):

        processing = self.get_object()

        user = request.user

        # -----------------------------------------------
        # BRANCH SECURITY
        # -----------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if not user.branch_id:

                return Response(
                    {
                        "error":
                        "User is not assigned to a branch."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if processing.branch_id != user.branch_id:

                return Response(
                    {
                        "error":
                        "You cannot issue stock for this branch."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------
        # STATUS CHECK
        # -----------------------------------------------

        if processing.status == "CANCELLED":

            return Response(
                {
                    "error":
                    "Cancelled processing cannot receive stock."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if processing.status == "COMPLETED":

            return Response(
                {
                    "error":
                    "Completed processing cannot receive more stock."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # QUANTITY
        # -----------------------------------------------

        quantity = request.data.get(
            "quantity"
        )

        try:

            quantity = int(quantity)

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error":
                    "Invalid issue quantity."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:

            return Response(
                {
                    "error":
                    "Issue quantity must be greater than 0."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # REMAINING QUANTITY
        # -----------------------------------------------

        remaining = (
            processing.input_quantity
            - processing.issued_quantity
        )

        if quantity > remaining:

            return Response(
                {
                    "error":
                    "Issue quantity exceeds remaining quantity.",
                    "remaining":
                    remaining
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # LOCK BRANCH STOCK
        # -----------------------------------------------

        branch_product = (
            BranchProduct.objects
            .select_for_update()
            .filter(
                branch_id=processing.branch_id,
                product_id=processing.input_product_id,
            )
            .first()
        )

        if not branch_product:

            return Response(
                {
                    "error":
                    "Input product is not available in branch stock."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # STOCK CHECK
        # -----------------------------------------------

        if branch_product.stock < quantity:

            return Response(
                {
                    "error":
                    f"Insufficient stock. "
                    f"Available stock: "
                    f"{branch_product.stock}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # DEDUCT STOCK
        # -----------------------------------------------

        branch_product.stock -= quantity

        branch_product.save(
            update_fields=["stock"]
        )

        # -----------------------------------------------
        # UPDATE PROCESSING
        # -----------------------------------------------

        processing.issued_quantity += quantity

        if processing.issued_quantity > 0:

            processing.status = "IN_PROGRESS"

        processing.save(
            update_fields=[
                "issued_quantity",
                "status",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(
            processing
        )

        return Response(
            {
                "success": True,
                "message":
                    "Stock issued successfully.",
                "issued_quantity":
                    processing.issued_quantity,
                "remaining_to_issue":
                    processing.remaining_to_issue,
                "branch_stock":
                    branch_product.stock,
                "processing":
                    serializer.data,
            },
            status=status.HTTP_200_OK
        )

    # ========================================================
    # COMPLETE / RETURN STOCK
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="complete"
    )
    @transaction.atomic
    def complete(self, request, pk=None):

        processing = self.get_object()

        user = request.user

        # -----------------------------------------------
        # BRANCH SECURITY
        # -----------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if not user.branch_id:

                return Response(
                    {
                        "error":
                        "User is not assigned to a branch."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if processing.branch_id != user.branch_id:

                return Response(
                    {
                        "error":
                        "You cannot complete this processing."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------
        # STATUS
        # -----------------------------------------------

        if processing.status == "CANCELLED":

            return Response(
                {
                    "error":
                    "Cancelled processing cannot be completed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # MUST HAVE ISSUED STOCK
        # -----------------------------------------------

        if processing.issued_quantity <= 0:

            return Response(
                {
                    "error":
                    "No stock has been issued for this processing."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # QUANTITY RETURNED
        # -----------------------------------------------

        quantity = request.data.get(
            "quantity"
        )

        try:

            quantity = int(quantity)

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error":
                    "Invalid return quantity."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:

            return Response(
                {
                    "error":
                    "Return quantity must be greater than 0."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # PENDING QUANTITY
        # -----------------------------------------------

        pending = (
            processing.issued_quantity
            - processing.returned_quantity
        )

        if quantity > pending:

            return Response(
                {
                    "error":
                    "Return quantity exceeds pending quantity.",
                    "pending":
                    pending
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # OUTPUT PRODUCT
        # -----------------------------------------------

        if not processing.output_product_id:

            return Response(
                {
                    "error":
                    "Output product is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------------
        # LOCK / CREATE BRANCH STOCK
        # -----------------------------------------------

        branch_product = (
            BranchProduct.objects
            .select_for_update()
            .filter(
                branch_id=processing.branch_id,
                product_id=processing.output_product_id,
            )
            .first()
        )

        if not branch_product:

            branch_product = BranchProduct.objects.create(
                branch_id=processing.branch_id,
                product_id=processing.output_product_id,
                stock=0,
                selling_price=processing.output_product.purchase_price,
            )

        # -----------------------------------------------
        # ADD RETURNED STOCK
        # -----------------------------------------------

        branch_product.stock += quantity

        branch_product.save(
            update_fields=["stock"]
        )

        # -----------------------------------------------
        # UPDATE PROCESSING
        # -----------------------------------------------

        processing.returned_quantity += quantity

        processing.status = "IN_PROGRESS"

        # Complete when all issued quantity has returned
        if (
            processing.returned_quantity
            >= processing.issued_quantity
        ):

            processing.status = "COMPLETED"
            processing.completed_date = timezone.now()

        processing.save(
            update_fields=[
                "returned_quantity",
                "status",
                "completed_date",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(
            processing
        )

        return Response(
            {
                "success": True,
                "message":
                    "Stock returned successfully.",
                "returned_quantity":
                    processing.returned_quantity,
                "pending_quantity":
                    processing.pending_quantity,
                "branch_stock":
                    branch_product.stock,
                "status":
                    processing.status,
                "processing":
                    serializer.data,
            },
            status=status.HTTP_200_OK
        )
# ============================================================
# PRODUCTION JOB API
# ============================================================

class ProductionJobViewSet(viewsets.ModelViewSet):

    queryset = ProductionJob.objects.select_related(
        "branch",
        "customer",
    ).prefetch_related(
        "purchases__product",
        "payments",
    ).all().order_by(
        "-job_date",
        "-id",
    )

    serializer_class = ProductionJobSerializer

    permission_classes = [
        IsAuthenticated
    ]

    # --------------------------------------------------------
    # LIST / FILTER
    # --------------------------------------------------------

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        # ADMIN → all branches
        if user.role == "Admin" or user.is_superuser:
            pass

        # BRANCH USER → own branch only
        elif user.branch_id:

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:

            return queryset.none()

        # Optional status filter

        status_filter = self.request.query_params.get(
            "status"
        )

        if status_filter:

            queryset = queryset.filter(
                status=status_filter
            )

        # Optional customer filter

        customer_id = self.request.query_params.get(
            "customer"
        )

        if customer_id:

            queryset = queryset.filter(
                customer_id=customer_id
            )

        return queryset

    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        # ---------------------------------------------
        # ADMIN
        # ---------------------------------------------

        if user.role == "Admin" or user.is_superuser:

            branch = serializer.validated_data.get(
                "branch"
            )

            if not branch:

                raise serializers.ValidationError({
                    "branch":
                    "Branch is required."
                })

        # ---------------------------------------------
        # BRANCH USER
        # ---------------------------------------------

        else:

            if not user.branch_id:

                raise PermissionDenied(
                    "User is not assigned to a branch."
                )

            # IMPORTANT:
            # Ignore any branch sent from frontend

            branch = user.branch

        # ---------------------------------------------
        # CUSTOMER
        # ---------------------------------------------

        customer = serializer.validated_data.get(
            "customer"
        )

        if not customer:

            raise serializers.ValidationError({
                "customer":
                "Customer is required."
            })

        # Branch user can only use own branch customers

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if customer.branch_id != user.branch_id:

                raise PermissionDenied(
                    "You cannot use a customer "
                    "from another branch."
                )

        # ---------------------------------------------
        # SAVE JOB
        # ---------------------------------------------

        serializer.save(
            branch=branch
        )
# ============================================================
# JOB PURCHASE API
# ============================================================

class JobPurchaseViewSet(viewsets.ModelViewSet):

    queryset = JobPurchase.objects.select_related(
        "job",
        "job__branch",
        "job__customer",
        "product",
    ).all().order_by(
        "-purchase_date",
        "-id",
    )

    serializer_class = JobPurchaseSerializer

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
                job__branch_id=user.branch_id
            )

        else:

            return queryset.none()

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        job = serializer.validated_data.get(
            "job"
        )

        if not job:

            raise serializers.ValidationError({
                "job":
                "Production job is required."
            })

        # ---------------------------------------------
        # BRANCH SECURITY
        # ---------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if job.branch_id != user.branch_id:

                raise PermissionDenied(
                    "You cannot add a purchase "
                    "to another branch's job."
                )

        # ---------------------------------------------
        # CREATE PURCHASE
        # ---------------------------------------------

        purchase = serializer.save()

        # ---------------------------------------------
        # DAY BOOK EXPENSE
        # ---------------------------------------------

        DayBook.objects.create(

            branch=job.branch,

            date=purchase.purchase_date,

            transaction_type="Expense",

            category="Purchase",

            payment_mode=purchase.payment_mode,

            description=(
                f"Purchase for Job #{job.id} - "
                f"{purchase.product.name}"
            ),

            amount=purchase.total,
        )
# ============================================================
# JOB PAYMENT API
# ============================================================

class JobPaymentViewSet(viewsets.ModelViewSet):

    queryset = JobPayment.objects.select_related(
        "job",
        "job__branch",
        "job__customer",
    ).all().order_by(
        "-payment_date",
        "-id",
    )

    serializer_class = JobPaymentSerializer

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
                job__branch_id=user.branch_id
            )

        else:

            return queryset.none()

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        job = serializer.validated_data.get(
            "job"
        )

        amount = serializer.validated_data.get(
            "amount"
        )

        payment_type = serializer.validated_data.get(
            "payment_type"
        )

        # ---------------------------------------------
        # JOB REQUIRED
        # ---------------------------------------------

        if not job:

            raise serializers.ValidationError({
                "job":
                "Production job is required."
            })

        # ---------------------------------------------
        # BRANCH SECURITY
        # ---------------------------------------------

        if (
            user.role != "Admin"
            and not user.is_superuser
        ):

            if job.branch_id != user.branch_id:

                raise PermissionDenied(
                    "You cannot add payment "
                    "to another branch's job."
                )

        # ---------------------------------------------
        # PAYMENT VALIDATION
        # ---------------------------------------------

        if amount <= 0:

            raise serializers.ValidationError({
                "amount":
                "Payment amount must be greater than zero."
            })

        # ---------------------------------------------
        # CHECK TOTAL
        # ---------------------------------------------

        current_received = sum(
            payment.amount
            for payment in job.payments.all()
        )

        if (
            current_received + amount
            > job.total_amount
        ):

            raise serializers.ValidationError({
                "amount":
                "Payment cannot exceed "
                "the remaining balance."
            })

        # ---------------------------------------------
        # CREATE PAYMENT
        # ---------------------------------------------

        payment = serializer.save()

        # ---------------------------------------------
        # UPDATE JOB PAYMENT TOTAL
        # ---------------------------------------------

        if payment.payment_type == "Advance":

            job.advance += payment.amount

        job.save()

        # ---------------------------------------------
        # DAY BOOK
        # ---------------------------------------------

        category = payment.payment_type

        DayBook.objects.create(

            branch=job.branch,

            date=payment.payment_date,

            transaction_type="Income",

            category=category,

            payment_mode=payment.payment_mode,

            description=(
                f"{payment.payment_type} "
                f"for Job #{job.id}"
            ),

            amount=payment.amount,
        )