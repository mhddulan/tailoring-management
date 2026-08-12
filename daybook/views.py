from urllib import request

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from datetime import date, datetime
from .models import DayBook
from django.contrib import messages
from branches.models import Branch
from .forms import DayBookForm
from openpyxl import Workbook
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Table
from reportlab.lib import colors
from django.db.models import Sum
@login_required
def daybook_list(request):

    # Get filtered entries for Admin and Branch
    entries = get_filtered_entries(request)

    # Daily Summary
    income = entries.filter(
        transaction_type="Income"
    ).aggregate(
        Sum("amount")
    )["amount__sum"] or 0

    expense = entries.filter(
        transaction_type="Expense"
    ).aggregate(
        Sum("amount")
    )["amount__sum"] or 0

    profit = income - expense

    # Current Month
    current_month = datetime.now().month
    current_year = datetime.now().year

    # Monthly Summary
    monthly_income = entries.filter(
        transaction_type="Income",
        date__month=current_month,
        date__year=current_year
    ).aggregate(
        Sum("amount")
    )["amount__sum"] or 0

    monthly_expense = entries.filter(
        transaction_type="Expense",
        date__month=current_month,
        date__year=current_year
    ).aggregate(
        Sum("amount")
    )["amount__sum"] or 0

    monthly_profit = monthly_income - monthly_expense

    # Opening & Closing Balance
    opening_balance = 0
    closing_balance = opening_balance + income - expense

    # Branch List (Admin Only)
    branches = Branch.objects.all() if request.user.role == "Admin" else None

    context = {
        "entries": entries,

        "income": income,
        "expense": expense,
        "profit": profit,

        "monthly_income": monthly_income,
        "monthly_expense": monthly_expense,
        "monthly_profit": monthly_profit,

        "opening_balance": opening_balance,
        "closing_balance": closing_balance,

        "branches": branches,

        # Default today's date for filter inputs
        "today": date.today(),
    }

    return render(
        request,
        "daybook/daybook_list.html",
        context
    )

@login_required
def daybook_create(request):

    if request.method == "POST":

        form = DayBookForm(request.POST)

        # Branch users don't select a branch
        if request.user.role != "Admin":
            form.fields["branch"].required = False

        if form.is_valid():

            entry = form.save(commit=False)

            if request.user.role != "Admin":
                entry.branch = request.user.branch

            entry.save()

            messages.success(
                request,
                "DayBook entry added successfully."
            )

            return redirect("daybook_list")

        else:
            print(form.errors)

    else:

        form = DayBookForm()

        # Hide branch field for branch users
        if request.user.role != "Admin":
            form.fields.pop("branch")

    return render(
        request,
        "daybook/daybook_form.html",
        {
            "form": form
        }
    )


@login_required
def daybook_edit(request, id):

    if request.user.role == "Admin":
        entry = get_object_or_404(DayBook, id=id)
    else:
        entry = get_object_or_404(
        DayBook,
        id=id,
        branch=request.user.branch
    )

    if request.method == 'POST':
        form = DayBookForm(request.POST, instance=entry)

        if form.is_valid():
            form.save()
            return redirect('daybook_list')

    else:
        form = DayBookForm(instance=entry )

    return render(
        request,
        'daybook/daybook_form.html',
        {'form': form}
    )


@login_required
def daybook_delete(request, id):

    entry = get_object_or_404(DayBook, id=id)

    if request.method == 'POST':
        entry.delete()
        return redirect('daybook_list')

    return render(
        request,
        'daybook/daybook_delete.html',
        {'entry': entry}
    )
@login_required
def daybook_excel(request):

    wb = Workbook()

    ws = wb.active

    ws.title = "DayBook"

    ws.append([
        "Date",
        "Branch",
        "Type",
        "Category",
        "Payment",
        "Description",
        "Amount"
    ])

    if request.user.role == "Admin":
        entries = DayBook.objects.all()
    else:
        entries = DayBook.objects.filter(
            branch=request.user.branch
        )

    for e in entries:

        ws.append([
            str(e.date),
            str(e.branch),
            e.transaction_type,
            e.category,
            e.payment_mode,
            e.description,
            float(e.amount)
        ])

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    response[
        "Content-Disposition"
    ] = 'attachment; filename="DayBook.xlsx"'

    wb.save(response)

    return response
@login_required
def daybook_pdf(request):

    response = HttpResponse(
        content_type="application/pdf"
    )

    response[
        "Content-Disposition"
    ] = 'attachment; filename="DayBook.pdf"'

    pdf = SimpleDocTemplate(response)

    data = [[
        "Date",
        "Branch",
        "Type",
        "Category",
        "Payment",
        "Amount"
    ]]

    if request.user.role == "Admin":
        entries = DayBook.objects.all()
    else:
        entries = DayBook.objects.filter(
            branch=request.user.branch
        )

    for e in entries:

        data.append([
            str(e.date),
            str(e.branch),
            e.transaction_type,
            e.category,
            e.payment_mode,
            f"₹ {e.amount}"
        ])

    table = Table(data)

    table.setStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.grey),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black),
        ("BACKGROUND",(0,1),(-1,-1),colors.beige),
    ])

    pdf.build([table])

    return response
def get_filtered_entries(request):

    if request.user.role == "Admin":
        entries = DayBook.objects.all()
    else:
        entries = DayBook.objects.filter(
            branch=request.user.branch
        )

    branch = request.GET.get("branch")
    from_date = request.GET.get("from_date")
    to_date = request.GET.get("to_date")
    transaction_type = request.GET.get("transaction_type")
    payment_mode = request.GET.get("payment_mode")
    category = request.GET.get("category")

    if branch:
        entries = entries.filter(branch_id=branch)

    if from_date:
        entries = entries.filter(date__gte=from_date)

    if to_date:
        entries = entries.filter(date__lte=to_date)

    if transaction_type:
        entries = entries.filter(
            transaction_type=transaction_type
        )

    if payment_mode:
        entries = entries.filter(
            payment_mode=payment_mode
        )

    if category:
        entries = entries.filter(
            category=category
        )

    return entries.order_by("-date")