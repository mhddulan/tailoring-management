from django.shortcuts import render, redirect, get_object_or_404
from .models import Branch
from .forms import BranchForm
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib import messages
from django.db.models import Sum
from customers.models import Customer
from orders.models import Order, Payment
from daybook.models import DayBook

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

    # Counts
    customers = Customer.objects.filter(
        branch=branch
    ).count()

    orders = Order.objects.filter(
        customer__branch=branch
    ).count()

    pending = Order.objects.filter(
        customer__branch=branch,
        status="Pending"
    ).count()

    delivered = Order.objects.filter(
        customer__branch=branch,
        status="Delivered"
    ).count()

    # Sales
    total_sales = Payment.objects.filter(
        order__customer__branch=branch
    ).aggregate(
        Sum("amount")
    )["amount__sum"] or 0

    # Purchase
    total_purchase = DayBook.objects.filter(
        branch=branch,
        transaction_type="Expense",
        category="Purchase"
    ).aggregate(
        Sum("amount")
    )["amount__sum"] or 0

    # Other Expenses
    total_expense = DayBook.objects.filter(
        branch=branch,
        transaction_type="Expense"
    ).exclude(
        category="Purchase"
    ).aggregate(
        Sum("amount")
    )["amount__sum"] or 0

    # Net Profit
    net_profit = total_sales - total_purchase - total_expense

    context = {
        "customers": customers,
        "orders": orders,
        "pending": pending,
        "delivered": delivered,

        "total_sales": total_sales,
        "total_purchase": total_purchase,
        "total_expense": total_expense,
        "net_profit": net_profit,
    }

    return render(
        request,
        "branches/branch_dashboard.html",
        context
    )