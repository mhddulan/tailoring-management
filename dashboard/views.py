import shutil

from datetime import datetime, timedelta

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import render, redirect
from django.utils import timezone

from branches.models import Branch
from customers.models import Customer
from daybook.models import DayBook
from orders.models import Order, Payment


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@login_required
def home(request):

    # -----------------------------------------------------
    # Admin only
    # -----------------------------------------------------

    if request.user.role != "Admin":
        return redirect("branch_dashboard")

    # =====================================================
    # DATE FILTER
    # =====================================================

    today = timezone.localdate()

    filter_type = request.GET.get(
        "filter",
        "today"
    )

    # Default = Today
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
    # Monday -> Today
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

        # Prevent reversed date range
        if from_date > to_date:

            from_date, to_date = (
                to_date,
                from_date
            )

    # =====================================================
    # BASE QUERYSETS
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

    # Current total customers
    total_customers = Customer.objects.count()

    # Orders in selected period
    total_orders = orders.count()

    # =====================================================
    # ORDER STATUS COUNTS
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
    # FINANCIAL SUMMARY
    # =====================================================

    # Total payments received during selected period
    total_sales = (
        payments.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # ADVANCE PAYMENTS
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
    # BALANCE PAYMENTS
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
    # DAYBOOK INCOME
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
    # OTHER EXPENSES
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
    # PAYMENT MODE SUMMARY
    # =====================================================

    cash = (
        payments.filter(
            payment_mode="Cash"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    bank = (
        payments.filter(
            payment_mode="Bank"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    online = (
        payments.filter(
            payment_mode="Online"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    cheque = (
        payments.filter(
            payment_mode="Cheque"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    pos = (
        payments.filter(
            payment_mode="POS"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # =====================================================
    # SELECTED PERIOD SUMMARY
    # =====================================================

    selected_orders = total_orders

    selected_sales = total_sales

    selected_income = total_income

    selected_expense = total_expense_all

    selected_profit = net_profit

    # =====================================================
    # BILLING / OUTSTANDING
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
        total_billed
        - total_received
    )

    # Prevent negative display
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
        .order_by(
            "-id"
        )[:10]
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
        .order_by(
            "-id"
        )[:10]
    )

    # =====================================================
    # MONTHLY SALES
    # IMPORTANT:
    # Uses filtered payments
    # =====================================================

    monthly_sales = (
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
    # BRANCH PERFORMANCE
    # FILTERED BY SELECTED DATE RANGE
    # =====================================================

    branch_performance = []

    for branch in Branch.objects.all():

        # -------------------------------------------------
        # Branch payments
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Branch purchases
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Branch other expenses
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Branch profit
        # -------------------------------------------------

        branch_profit = (
            branch_sales
            - branch_purchase
            - branch_expense
        )

        # -------------------------------------------------
        # Branch orders
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Current branch customers
        # -------------------------------------------------

        branch_customers = (
            Customer.objects.filter(
                branch=branch
            )
            .count()
        )

        branch_performance.append({

            "name": branch.name,

            "sales": branch_sales,

            "orders": branch_orders,

            "customers": branch_customers,

            "profit": branch_profit,

        })

    # =====================================================
    # TODAY'S DATA
    #
    # Kept separately for compatibility with your
    # existing dashboard template.
    # =====================================================

    today_orders = Order.objects.filter(
        order_date=today
    ).count()

    today_sales = (
        Payment.objects.filter(
            payment_date=today
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    today_income = (
        DayBook.objects.filter(
            date=today,
            transaction_type="Income"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    today_expense = (
        DayBook.objects.filter(
            date=today,
            transaction_type="Expense"
        )
        .aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    today_profit = (
        today_income
        - today_expense
    )

    # =====================================================
    # CONTEXT
    # =====================================================

    context = {

        # -------------------------------------------------
        # Date filter
        # -------------------------------------------------

        "today": today,

        "from_date": from_date,

        "to_date": to_date,

        "filter_type": filter_type,

        # -------------------------------------------------
        # Basic counts
        # -------------------------------------------------

        "total_branches": total_branches,

        "total_customers": total_customers,

        "total_orders": total_orders,

        # -------------------------------------------------
        # Order statuses
        # -------------------------------------------------

        "pending_orders": pending_orders,

        "cutting_orders": cutting_orders,

        "stitching_orders": stitching_orders,

        "ready_orders": ready_orders,

        "delivery_orders": delivery_orders,

        "delivered_orders": delivered_orders,

        # -------------------------------------------------
        # Financial
        # -------------------------------------------------

        "total_sales": total_sales,

        "total_billed": total_billed,

        "total_received": total_received,

        "outstanding_balance": outstanding_balance,

        "total_income": total_income,

        "total_expense": total_expense,

        "total_purchase": total_purchase,

        "total_expense_all": total_expense_all,

        "total_advance": total_advance,

        "total_balance_payment": (
            total_balance_payment
        ),

        "net_profit": net_profit,

        # -------------------------------------------------
        # Selected-period compatibility
        # -------------------------------------------------

        "selected_orders": selected_orders,

        "selected_sales": selected_sales,

        "selected_income": selected_income,

        "selected_expense": selected_expense,

        "selected_profit": selected_profit,

        # -------------------------------------------------
        # Payment modes
        # -------------------------------------------------

        "cash": cash,

        "bank": bank,

        "online": online,

        "cheque": cheque,

        "pos": pos,

        # Old template compatibility
        "cash_total": cash,

        "bank_total": bank,

        "online_total": online,

        "cheque_total": cheque,

        "pos_total": pos,

        # -------------------------------------------------
        # Today's data
        # -------------------------------------------------

        "today_orders": today_orders,

        "today_sales": today_sales,

        "today_income": today_income,

        "today_expense": today_expense,

        "today_profit": today_profit,

        # -------------------------------------------------
        # Recent
        # -------------------------------------------------

        "recent_orders": recent_orders,

        "recent_payments": recent_payments,

        # -------------------------------------------------
        # Chart
        # -------------------------------------------------

        "months": months,

        "sales": monthly_sales_data,

        # -------------------------------------------------
        # Branches
        # -------------------------------------------------

        "branch_performance": (
            branch_performance
        ),

    }

    return render(
        request,
        "dashboard/home.html",
        context
    )


# =========================================================
# DATABASE BACKUP
# =========================================================

@login_required
def backup_database(request):

    # -----------------------------------------------------
    # Admin only
    # -----------------------------------------------------

    if request.user.role != "Admin":

        messages.error(
            request,
            "You are not authorized."
        )

        return redirect(
            "branch_dashboard"
        )

    # -----------------------------------------------------
    # Backup directory
    # -----------------------------------------------------

    backup_dir = (
        settings.BASE_DIR
        / "backups"
    )

    backup_dir.mkdir(
        exist_ok=True
    )

    # -----------------------------------------------------
    # Timestamp
    # -----------------------------------------------------

    timestamp = datetime.now().strftime(
        "%d-%m-%Y_%H-%M-%S"
    )

    # -----------------------------------------------------
    # Backup file
    # -----------------------------------------------------

    backup_file = (
        backup_dir
        / f"db_backup_{timestamp}.sqlite3"
    )

    # -----------------------------------------------------
    # Create backup
    # -----------------------------------------------------

    shutil.copy(
        settings.BASE_DIR
        / "db.sqlite3",
        backup_file
    )

    # -----------------------------------------------------
    # Message
    # -----------------------------------------------------

    messages.success(
        request,
        "Database backup created successfully."
    )

    return redirect("home")