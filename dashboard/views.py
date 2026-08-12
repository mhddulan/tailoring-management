import shutil
from datetime import datetime
from datetime import date
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Sum , Count
from django.shortcuts import render, redirect
from django.utils import timezone
from django.db.models.functions import TruncMonth
from branches.models import Branch
from customers.models import Customer
from daybook.models import DayBook
from orders.models import Order, Payment
@login_required
def home(request):

    if request.user.role != "Admin":
        return redirect("branch_dashboard")

    # ==========================================
    # Date Filter
    # ==========================================

    today = timezone.now().date()

    from_date = request.GET.get(
        "from_date",
        today.strftime("%Y-%m-%d")
    )

    to_date = request.GET.get(
        "to_date",
        today.strftime("%Y-%m-%d")
    )

    payments = Payment.objects.filter(
        payment_date__range=[from_date, to_date]
    )

    orders = Order.objects.filter(
        order_date__range=[from_date, to_date]
    )

    daybooks = DayBook.objects.filter(
        date__range=[from_date, to_date]
    )

    # ==========================================
    # Dashboard Counts
    # ==========================================

    total_branches = Branch.objects.count()

    total_customers = Customer.objects.count()

    total_orders = orders.count()

    pending_orders = orders.filter(
        status="Pending"
    ).count()

    delivered_orders = orders.filter(
        status="Delivered"
    ).count()

    # ==========================================
    # Financial Summary
    # ==========================================

    total_sales = (
        payments.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    total_advance = (
        orders.aggregate(
            total=Sum("advance_paid")
        )["total"] or 0
    )

    total_income = (
        daybooks.filter(
            transaction_type="Income"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    total_purchase = (
        daybooks.filter(
            transaction_type="Expense",
            category="Purchase"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    total_expense = (
        daybooks.exclude(
            category="Purchase"
        ).filter(
            transaction_type="Expense"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    net_profit = (
        total_income
        - total_expense
        - total_purchase
    )

    # ==========================================
    # Payment Summary
    # ==========================================

    cash = (
        payments.filter(
            payment_mode="Cash"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    bank = (
        payments.filter(
            payment_mode="Bank"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    online = (
        payments.filter(
            payment_mode="Online"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    cheque = (
        payments.filter(
            payment_mode="Cheque"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    pos = (
        payments.filter(
            payment_mode="POS"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )
        # ==========================================
    # Today's Summary
    # ==========================================

    today_orders = Order.objects.filter(
        order_date=today
    ).count()

    today_sales = (
        Payment.objects.filter(
            payment_date=today
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    # ==========================================
    # Recent Orders
    # ==========================================

    recent_orders = (
        orders.select_related("customer")
        .order_by("-id")[:10]
    )

    # ==========================================
    # Recent Payments
    # ==========================================

    recent_payments = (
        payments.select_related("order")
        .order_by("-id")[:10]
    )

    # ==========================================
    # Monthly Sales Trend (Last 12 Months)
    # ==========================================

    monthly_sales = (
        Payment.objects
        .annotate(month=TruncMonth("payment_date"))
        .values("month")
        .annotate(total=Sum("amount"))
        .order_by("month")
    )

    months = []
    monthly_sales_data = []

    for row in monthly_sales:

        months.append(
            row["month"].strftime("%b %Y")
        )

        monthly_sales_data.append(
            float(row["total"])
        )

    # ==========================================
    # Branch Performance
    # ==========================================

    branch_performance = []

    for branch in Branch.objects.all():

        branch_sales = (
            Payment.objects.filter(
                order__customer__branch=branch
            ).aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        branch_purchase = (
            DayBook.objects.filter(
                branch=branch,
                transaction_type="Expense",
                category="Purchase"
            ).aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        branch_expense = (
            DayBook.objects.filter(
                branch=branch,
                transaction_type="Expense"
            ).exclude(
                category="Purchase"
            ).aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        branch_profit = (
            branch_sales
            - branch_purchase
            - branch_expense
        )

        branch_orders = (
            Order.objects.filter(
                customer__branch=branch
            ).count()
        )

        branch_performance.append({

            "name": branch.name,

            "sales": branch_sales,

            "orders": branch_orders,

            "profit": branch_profit,

        })
            # ==========================================
    # Context
    # ==========================================

    context = {

        # Date Filter
        "today": today,
        "from_date": from_date,
        "to_date": to_date,

        # Dashboard Counts
        "total_branches": total_branches,
        "total_customers": total_customers,
        "total_orders": total_orders,

        "pending_orders": pending_orders,
        "delivered_orders": delivered_orders,

        # Financial Summary
        "total_income": total_income,
        "total_expense": total_expense,
        "total_purchase": total_purchase,

        "total_sales": total_sales,
        "total_advance": total_advance,

        "net_profit": net_profit,

        # Payment Summary
        "cash": cash,
        "bank": bank,
        "online": online,
        "cheque": cheque,
        "pos": pos,

        # (For old template compatibility)
        "cash_total": cash,
        "bank_total": bank,
        "online_total": online,
        "cheque_total": cheque,
        "pos_total": pos,

        # Today's Summary
        "today_orders": today_orders,
        "today_sales": today_sales,

        # Recent Data
        "recent_orders": recent_orders,
        "recent_payments": recent_payments,

        # Monthly Sales Chart
        "months": months,
        "sales": monthly_sales_data,

        # Branch Performance
        "branch_performance": branch_performance,

    }

    return render(
        request,
        "dashboard/home.html",
        context
    )

@login_required
def backup_database(request):

    if request.user.role != "Admin":
        messages.error(
            request,
            "You are not authorized."
        )
        return redirect("branch_dashboard")

    backup_dir = settings.BASE_DIR / "backups"
    backup_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%d-%m-%Y_%H-%M-%S")

    backup_file = backup_dir / f"db_backup_{timestamp}.sqlite3"

    shutil.copy(
        settings.BASE_DIR / "db.sqlite3",
        backup_file
    )

    messages.success(
        request,
        "Database backup created successfully."
    )

    return redirect("home")