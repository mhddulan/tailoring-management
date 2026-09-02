from django.shortcuts import render, redirect, get_object_or_404
from .models import Branch
from .forms import BranchForm
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib import messages
from django.db.models import Sum , Q
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta

from customers.models import Customer
from orders.models import Order, Payment
from daybook.models import DayBook
from django.utils import timezone
from employees.models import Employee, DailyProduction
User = get_user_model()


@login_required
def branch_list(request):
    if request.user.role != "Admin":
        messages.error(request, "Only Admin can view branches.")
        return redirect("home")

    branches = Branch.objects.all()

    branch_data = []

    for branch in branches:
        user = User.objects.filter(branch=branch).first()

        branch_data.append({
            "id": branch.id,
            "name": branch.name,
            "phone": branch.phone,
            "manager": branch.manager_name,
            "username": user.username if user else "",
        })

    return render(
        request,
        "branches/branch_list.html",
        {"branch_data": branch_data},
    )


@login_required
def branch_create(request):
    if request.method == "POST":
        form = BranchForm(request.POST)

        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]
            print("Username entered:", username)

            if User.objects.filter(username=username).exists():
                messages.error(request, "Username already exists.")
                return render(request, "branches/create.html", {"form": form})

            try:
                with transaction.atomic():
                    branch = form.save()

                    User.objects.create_user(
                        username=username,
                        password=password,
                        role="Branch",
                        branch=branch,
                        first_name=branch.manager_name,
                    )

                messages.success(request, "Branch created successfully.")
                return redirect("branch_list")

            except Exception as e:
                messages.error(request, str(e))

    else:
        if request.user.role != "Admin":
            messages.error(request, "Only Admin can create branches.")
            return redirect("home")
        form = BranchForm()

    return render(request, "branches/create.html", {"form": form})


@login_required
def branch_dashboard(request):

    if request.user.role != "Branch":
        return redirect("home")

    branch = request.user.branch

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

    # -----------------------------------------------------
    # TODAY
    # -----------------------------------------------------

    if filter_type == "today":

        from_date = today
        to_date = today

    # -----------------------------------------------------
    # YESTERDAY
    # -----------------------------------------------------

    elif filter_type == "yesterday":

        from_date = today - timedelta(days=1)
        to_date = from_date

    # -----------------------------------------------------
    # THIS WEEK
    # -----------------------------------------------------

    elif filter_type == "week":

        from_date = today - timedelta(
            days=today.weekday()
        )

        to_date = today

    # -----------------------------------------------------
    # THIS MONTH
    # -----------------------------------------------------

    elif filter_type == "month":

        from_date = today.replace(day=1)
        to_date = today

    # -----------------------------------------------------
    # CUSTOM
    # -----------------------------------------------------

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

        # Prevent reversed dates

        if from_date > to_date:

            from_date, to_date = (
                to_date,
                from_date
            )

    # =====================================================
    # BASE QUERYSETS
    # =====================================================

    branch_orders = Order.objects.filter(
        customer__branch=branch,
        order_date__range=[
            from_date,
            to_date
        ]
    )

    branch_payments = Payment.objects.filter(
        order__customer__branch=branch,
        payment_date__range=[
            from_date,
            to_date
        ]
    )

    branch_daybook = DayBook.objects.filter(
        branch=branch,
        date__range=[
            from_date,
            to_date
        ]
    )

    # =====================================================
    # CUSTOMERS
    # =====================================================

    # Keep total customers for the branch.
    # This represents current branch customers.

    customers = Customer.objects.filter(
        branch=branch
    ).count()

    # =====================================================
    # ORDERS
    # =====================================================

    orders = branch_orders.count()

    # =====================================================
    # PENDING
    # =====================================================

    pending = branch_orders.filter(
        status="Pending"
    ).count()

    # =====================================================
    # DELIVERED
    # =====================================================

    delivered = branch_orders.filter(
        status="Delivered"
    ).count()

    # =====================================================
    # SALES / PAYMENTS
    # =====================================================

    total_sales = (
        branch_payments
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
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
    # OTHER EXPENSES
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
        total_purchase
        + total_expense
    )

    # =====================================================
    # NET PROFIT
    # =====================================================

    net_profit = (
        total_income
        - total_expense_all
    )

    # =====================================================
    # PAYMENT MODES
    # =====================================================

    cash = (
        branch_payments
        .filter(
            payment_mode="Cash"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    bank = (
        branch_payments
        .filter(
            payment_mode="Bank"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    online = (
        branch_payments
        .filter(
            payment_mode="Online"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    cheque = (
        branch_payments
        .filter(
            payment_mode="Cheque"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    pos = (
        branch_payments
        .filter(
            payment_mode="POS"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # ADVANCE
    # =====================================================

    total_advance = (
        branch_payments
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
        branch_payments
        .filter(
            payment_type="Balance Payment"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # TOTAL RECEIVED
    # =====================================================

    total_received = (
        branch_payments
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # ORDER BILLING
    # =====================================================

    filtered_orders = (
        branch_orders
        .prefetch_related(
            "items",
            "payments"
        )
    )

    total_billed = sum(
        order.total_amount()
        for order in filtered_orders
    )

    outstanding_balance = (
        total_billed
        - total_received
    )

    if outstanding_balance < 0:
        outstanding_balance = 0

    # =====================================================
    # ORDER STATUS
    # =====================================================

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

    # =====================================================
    # RECENT ORDERS
    # =====================================================

    recent_orders = (
        branch_orders
        .select_related(
            "customer"
        )
        .order_by(
            "-id"
        )[:10]
    )

    # =====================================================
    # RECENT PAYMENTS
    # =====================================================

    recent_payments = (
        branch_payments
        .select_related(
            "order",
            "order__customer"
        )
        .order_by(
            "-id"
        )[:10]
    )

    # =====================================================
    # MONTHLY SALES CHART
    # =====================================================

    monthly_sales = (
        branch_payments
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
        .order_by(
            "month"
        )
    )

    months = []

    sales_data = []

    for row in monthly_sales:

        if row["month"]:

            months.append(
                row["month"].strftime(
                    "%b %Y"
                )
            )

            sales_data.append(
                float(
                    row["total"]
                )
            )

    # =====================================================
    # CONTEXT
    # =====================================================

    context = {

        # -------------------------------------------------
        # Branch
        # -------------------------------------------------

        "branch": branch,

        # -------------------------------------------------
        # Date
        # -------------------------------------------------

        "today": today,

        "from_date": from_date,

        "to_date": to_date,

        "filter_type": filter_type,

        # -------------------------------------------------
        # Counts
        # -------------------------------------------------

        "customers": customers,

        "orders": orders,

        "pending": pending,

        "cutting": cutting,

        "stitching": stitching,

        "ready": ready,

        "delivery": delivery,

        "delivered": delivered,

        # -------------------------------------------------
        # Financial
        # -------------------------------------------------

        "total_sales": total_sales,

        "total_income": total_income,

        "total_purchase": total_purchase,

        "total_expense": total_expense,

        "total_expense_all": total_expense_all,

        "net_profit": net_profit,

        # -------------------------------------------------
        # Payments
        # -------------------------------------------------

        "cash": cash,

        "bank": bank,

        "online": online,

        "cheque": cheque,

        "pos": pos,

        "total_advance": total_advance,

        "total_balance_payment": (
            total_balance_payment
        ),

        "total_received": total_received,

        # -------------------------------------------------
        # Billing
        # -------------------------------------------------

        "total_billed": total_billed,

        "outstanding_balance": (
            outstanding_balance
        ),

        # -------------------------------------------------
        # Recent
        # -------------------------------------------------

        "recent_orders": recent_orders,

        "recent_payments": recent_payments,

        # -------------------------------------------------
        # Chart
        # -------------------------------------------------

        "months": months,

        "sales_data": sales_data,

        # Compatibility with possible existing chart
        "sales": sales_data,

    }

    return render(
        request,
        "branches/branch_dashboard.html",
        context
    )
# =========================================================
# ADMIN - BRANCH PERFORMANCE
# =========================================================

@login_required
def branch_performance(request, branch_id):

    # =====================================================
    # ADMIN ONLY
    # =====================================================

    if request.user.role != "Admin":
        return redirect("home")


    # =====================================================
    # GET BRANCH
    # =====================================================

    branch = get_object_or_404(
        Branch,
        id=branch_id
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


    # -----------------------------------------------------
    # TODAY
    # -----------------------------------------------------

    if filter_type == "today":

        from_date = today
        to_date = today


    # -----------------------------------------------------
    # YESTERDAY
    # -----------------------------------------------------

    elif filter_type == "yesterday":

        from_date = today - timedelta(days=1)
        to_date = from_date


    # -----------------------------------------------------
    # THIS WEEK
    # -----------------------------------------------------

    elif filter_type == "week":

        from_date = (
            today -
            timedelta(days=today.weekday())
        )

        to_date = today


    # -----------------------------------------------------
    # THIS MONTH
    # -----------------------------------------------------

    elif filter_type == "month":

        from_date = today.replace(day=1)
        to_date = today


    # -----------------------------------------------------
    # CUSTOM
    # -----------------------------------------------------

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
    # BASE QUERYSETS
    # =====================================================

    branch_orders = Order.objects.filter(
        customer__branch=branch,
        order_date__range=[
            from_date,
            to_date
        ]
    )


    branch_payments = Payment.objects.filter(
        order__customer__branch=branch,
        payment_date__range=[
            from_date,
            to_date
        ]
    )


    branch_daybook = DayBook.objects.filter(
        branch=branch,
        date__range=[
            from_date,
            to_date
        ]
    )


    # =====================================================
    # CUSTOMERS
    # =====================================================

    customers = Customer.objects.filter(
        branch=branch
    ).count()


    # =====================================================
    # ORDERS
    # =====================================================

    total_orders = branch_orders.count()


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
    # DAYBOOK INCOME
    # =====================================================

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
    # SALES
    # =====================================================

    total_sales = total_income


    # =====================================================
    # COLLECTION
    # =====================================================

    collection = (
        branch_payments
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )


    # =====================================================
    # ADVANCE
    # =====================================================

    total_advance = (
        branch_payments
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
        branch_payments
        .filter(
            payment_type="Balance Payment"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )


    # =====================================================
    # PAYMENT MODES
    # =====================================================

    cash = (
        branch_payments
        .filter(
            payment_mode="Cash"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )


    bank = (
        branch_payments
        .filter(
            payment_mode="Bank"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )


    online = (
        branch_payments
        .filter(
            payment_mode="Online"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )


    cheque = (
        branch_payments
        .filter(
            payment_mode="Cheque"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )


    pos = (
        branch_payments
        .filter(
            payment_mode="POS"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )


    # =====================================================
    # TOTAL BILLED
    # =====================================================

    filtered_orders = (
        branch_orders
        .prefetch_related(
            "items",
            "payments"
        )
    )


    total_billed = 0


    for order in filtered_orders:

        try:

            total_billed += order.total_amount()

        except Exception:

            pass


    # =====================================================
    # OUTSTANDING
    # =====================================================

    outstanding_balance = (
        total_billed -
        collection
    )


    if outstanding_balance < 0:

        outstanding_balance = 0


    # =====================================================
    # EMPLOYEE PERFORMANCE
    # =====================================================

    performance_employees = (
        Employee.objects
        .filter(
            branch=branch,
            active=True
        )
        .annotate(
            total_pieces=Sum(
                "productions__quantity",
                filter=Q(
                    productions__production_date__gte=from_date,
                    productions__production_date__lte=to_date
                )
            )
        )
        .order_by(
            "-total_pieces",
            "name"
        )
    )


    # =====================================================
    # TOTAL PRODUCTION
    # =====================================================

    total_pieces = (
        DailyProduction.objects
        .filter(
            branch=branch,
            production_date__range=[
                from_date,
                to_date
            ]
        )
        .aggregate(
            total=Sum("quantity")
        )["total"] or 0
    )


    # =====================================================
    # MONTHLY SALES
    # =====================================================

    monthly_sales = (
        branch_payments
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
        .order_by(
            "month"
        )
    )


    months = []
    monthly_sales_data = []


    for row in monthly_sales:

        if row["month"]:

            months.append(
                row["month"].strftime(
                    "%b %Y"
                )
            )

            monthly_sales_data.append(
                float(
                    row["total"]
                )
            )


    # =====================================================
    # RECENT ORDERS
    # =====================================================

    recent_orders = (
        branch_orders
        .select_related(
            "customer"
        )
        .order_by(
            "-id"
        )[:10]
    )


    # =====================================================
    # RECENT PAYMENTS
    # =====================================================

    recent_payments = (
        branch_payments
        .select_related(
            "order",
            "order__customer"
        )
        .order_by(
            "-id"
        )[:10]
    )


    # =====================================================
    # CONTEXT
    # =====================================================

    context = {

        "branch": branch,

        # Date
        "today": today,
        "from_date": from_date,
        "to_date": to_date,
        "filter_type": filter_type,

        # Customers
        "customers": customers,

        # Orders
        "orders": total_orders,
        "total_orders": total_orders,

        "pending": pending,
        "cutting": cutting,
        "stitching": stitching,
        "ready": ready,
        "delivery": delivery,
        "delivered": delivered,

        # Financial
        "total_sales": total_sales,
        "total_income": total_income,
        "total_purchase": total_purchase,
        "total_expense": total_expense,
        "total_expense_all": total_expense_all,
        "net_profit": net_profit,

        # Collection
        "collection": collection,
        "total_received": collection,
        "total_billed": total_billed,
        "outstanding_balance": outstanding_balance,

        # Payments
        "total_advance": total_advance,
        "total_balance_payment": total_balance_payment,

        # Payment modes
        "cash": cash,
        "bank": bank,
        "online": online,
        "cheque": cheque,
        "pos": pos,

        # Employees
        "performance_employees": performance_employees,
        "total_pieces": total_pieces,

        # Charts
        "months": months,
        "monthly_sales": monthly_sales_data,

        # Recent
        "recent_orders": recent_orders,
        "recent_payments": recent_payments,
    }


    return render(
        request,
        "branches/branch_performance.html",
        context
    )