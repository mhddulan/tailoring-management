from datetime import date
from reportlab.lib.pagesizes import A4
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from products.models import Product
from branches.models import Branch
from reportlab.lib import colors
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)
from django.http import HttpResponse
from reportlab.lib.enums import TA_CENTER
from django.db.models import (
    Q,
    Sum,
    Avg,
    DecimalField,
    ExpressionWrapper,
    F,
    Case,
    When,
    Value,
)
from .models import Employee, DailyProduction,EmployeeProductRate
from .forms import (
    EmployeeForm,
    DailyProductionFormSet
    
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from django.http import HttpResponse
from django.template.loader import get_template

from django.db.models import Q
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Case, When, Value
from django.utils import timezone

# ============================================================
# EMPLOYEE LIST
# ============================================================
@login_required
def employee_list(request):

    search = request.GET.get("search", "").strip()

    if request.user.role == "Admin":

        employees = Employee.objects.select_related(
            "branch"
        ).order_by(
            "branch__name",
            "name"
        )

    else:

        employees = Employee.objects.filter(
            branch=request.user.branch
        ).select_related(
            "branch"
        ).order_by(
            "name"
        )

    # Search
    if search:

        employees = employees.filter(
            Q(name__icontains=search) |
            Q(mobile__icontains=search) |
            Q(designation__icontains=search) |
            Q(branch__name__icontains=search)
        )

    return render(
        request,
        "employees/employee_list.html",
        {
            "employees": employees,
            "search": search,
        }
    )

# ============================================================
# ADD EMPLOYEE
# ============================================================

@login_required
def employee_create(request):

    # ----------------------------------------
    # ADMIN
    # ----------------------------------------

    if request.user.role == "Admin":

        branches = Branch.objects.all()

        if request.method == "POST":

            form = EmployeeForm(request.POST)

            branch_id = request.POST.get("branch")

            if form.is_valid() and branch_id:

                employee = form.save(
                    commit=False
                )

                employee.branch = get_object_or_404(
                    Branch,
                    id=branch_id
                )

                employee.save()

                messages.success(
                    request,
                    "Employee added successfully."
                )

                return redirect(
                    "employee_list"
                )

            if not branch_id:

                messages.error(
                    request,
                    "Please select a branch."
                )

        else:

            form = EmployeeForm()

        return render(
            request,
            "employees/employee_form.html",
            {
                "form": form,
                "branches": branches,
                "title": "Add Employee",
            }
        )


    # ----------------------------------------
    # BRANCH
    # ----------------------------------------

    if not request.user.branch:

        messages.error(
            request,
            "No branch is assigned to your account."
        )

        return redirect(
            "branch_dashboard"
        )


    if request.method == "POST":

        form = EmployeeForm(
            request.POST
        )

        if form.is_valid():

            employee = form.save(
                commit=False
            )

            employee.branch = request.user.branch

            employee.save()

            messages.success(
                request,
                "Employee added successfully."
            )

            return redirect(
                "employee_list"
            )

    else:

        form = EmployeeForm()


    return render(
        request,
        "employees/employee_form.html",
        {
            "form": form,
            "title": "Add Employee",
        }
    )


# ============================================================
# EDIT EMPLOYEE
# ============================================================

@login_required
def employee_edit(request, id):

    employee = get_object_or_404(
        Employee,
        id=id
    )


    # Branch can edit only its own employees

    if request.user.role != "Admin":

        if employee.branch != request.user.branch:

            messages.error(
                request,
                "You cannot edit this employee."
            )

            return redirect(
                "employee_list"
            )


    # ----------------------------------------
    # POST
    # ----------------------------------------

    if request.method == "POST":

        form = EmployeeForm(
            request.POST,
            instance=employee
        )

        if form.is_valid():

            updated_employee = form.save(
                commit=False
            )


            # Admin can change branch

            if request.user.role == "Admin":

                branch_id = request.POST.get(
                    "branch"
                )

                if branch_id:

                    updated_employee.branch = get_object_or_404(
                        Branch,
                        id=branch_id
                    )

            else:

                # Branch cannot move employee
                # to another branch

                updated_employee.branch = (
                    request.user.branch
                )


            updated_employee.save()


            messages.success(
                request,
                "Employee updated successfully."
            )

            return redirect(
                "employee_list"
            )

    else:

        form = EmployeeForm(
            instance=employee
        )


    # Admin needs branch list

    branches = None

    if request.user.role == "Admin":

        branches = Branch.objects.all()


    return render(
        request,
        "employees/employee_form.html",
        {
            "form": form,
            "employee": employee,
            "branches": branches,
            "title": "Edit Employee",
        }
    )


# ============================================================
# DELETE EMPLOYEE
# ============================================================

@login_required
def employee_delete(request, id):

    employee = get_object_or_404(
        Employee,
        id=id
    )


    # Branch can delete only its own employee

    if request.user.role != "Admin":

        if employee.branch != request.user.branch:

            messages.error(
                request,
                "You cannot delete this employee."
            )

            return redirect(
                "employee_list"
            )


    if request.method == "POST":

        employee.delete()

        messages.success(
            request,
            "Employee deleted successfully."
        )

        return redirect(
            "employee_list"
        )


    return render(
        request,
        "employees/employee_delete.html",
        {
            "employee": employee
        }
    )


# ============================================================
# DAILY PRODUCTION LIST
# ============================================================
# ============================================================
# DAILY PRODUCTION LIST
# ============================================================
# ============================================================
# DAILY PRODUCTION LIST
# ============================================================
@login_required
def production_list(request):

    # ============================================================
    # DATE FILTER
    # ============================================================

    from_date = request.GET.get("from_date")
    to_date = request.GET.get("to_date")

    if not from_date:
        from_date = date.today().strftime("%Y-%m-%d")

    if not to_date:
        to_date = date.today().strftime("%Y-%m-%d")


    # ============================================================
    # FILTER VALUES
    # ============================================================

    branch_id = request.GET.get("branch")
    employee_id = request.GET.get("employee")
    product_id = request.GET.get("product")


    # ============================================================
    # BASE QUERY
    # ============================================================

    productions = DailyProduction.objects.filter(
        production_date__gte=from_date,
        production_date__lte=to_date
    ).select_related(
        "branch",
        "employee",
        "product"
    )


    # ============================================================
    # BRANCH SECURITY
    # ============================================================

    if request.user.role != "Admin":

        productions = productions.filter(
            branch=request.user.branch
        )

        branch_id = str(request.user.branch_id)


    # ============================================================
    # ADMIN BRANCH FILTER
    # ============================================================

    elif branch_id:

        productions = productions.filter(
            branch_id=branch_id
        )


    # ============================================================
    # EMPLOYEE FILTER
    # ============================================================

    if employee_id:

        productions = productions.filter(
            employee_id=employee_id
        )


    # ============================================================
    # PRODUCT FILTER
    # ============================================================

    if product_id:

        productions = productions.filter(
            product_id=product_id
        )


    productions = productions.order_by(
        "production_date",
        "employee__name",
        "product__name"
    )


    # ============================================================
    # BRANCHES
    # ============================================================

    if request.user.role == "Admin":

        branches = Branch.objects.all().order_by(
            "name"
        )

    else:

        branches = Branch.objects.filter(
            id=request.user.branch_id
        )


    # ============================================================
    # EMPLOYEES
    # ============================================================

    if request.user.role == "Admin":

        employees = Employee.objects.filter(
            active=True
        ).select_related(
            "branch"
        ).order_by(
            "name"
        )

    else:

        employees = Employee.objects.filter(
            branch=request.user.branch,
            active=True
        ).order_by(
            "name"
        )


    # ============================================================
    # PRODUCTS
    # ============================================================

    products = Product.objects.filter(
        active=True
    ).order_by(
        "name"
    )


    # ============================================================
    # OVERALL TOTAL
    # ============================================================

    overall = productions.aggregate(

        total_pieces=Sum(
            "quantity"
        ),

        total_amount=Sum(
            "total_amount"
        )
    )


    total_pieces = overall["total_pieces"] or 0
    total_amount = overall["total_amount"] or 0


    # ============================================================
    # EMPLOYEE-WISE REPORT
    # ============================================================

    employee_report = productions.values(
    "employee_id",
    "employee__name",
    "employee__designation",
    "employee__branch__name",

    ).annotate(

        total_pieces=Sum(
            "quantity"
        ),

        total_amount=Sum(
            "total_amount"
        )

    ).order_by(
        "-total_pieces"
    )


    # ============================================================
    # ITEM-WISE REPORT
    # ============================================================
    item_report = productions.values(
        "product_id",
        "product__name"
    ).annotate(
        total_pieces=Sum("quantity"),

        total_amount=Sum(
            "total_amount"
        ),

        average_rate=Case(
            When(
                quantity__gt=0,
                then=ExpressionWrapper(
                    F("total_amount") / F("quantity"),
                    output_field=DecimalField(
                        max_digits=10,
                        decimal_places=2
                    )
                )
            ),
            default=Value(0),
            output_field=DecimalField(
                max_digits=10,
                decimal_places=2
            )
        )

    ).order_by(
        "-total_pieces"
    )


    # ============================================================
    # EMPLOYEE → ITEM REPORT
    # ============================================================

    employee_item_report = productions.values(
        "employee_id",
        "employee__name",
        "product_id",
        "product__name"
    ).annotate(

        total_pieces=Sum(
            "quantity"
        ),

        total_amount=Sum(
            "total_amount"
        )

    ).order_by(
        "employee__name",
        "-total_pieces"
    )


    # ============================================================
    # ITEM → EMPLOYEE REPORT
    # ============================================================

    item_employee_report = productions.values(
        "product_id",
        "product__name",
        "employee_id",
        "employee__name"
    ).annotate(

        total_pieces=Sum(
            "quantity"
        ),

        total_amount=Sum(
            "total_amount"
        )

    ).order_by(
        "product__name",
        "-total_pieces"
    )


    # ============================================================
    # DAILY DETAIL
    # ============================================================

    daily_report = productions.values(
        "production_date",
        "employee__name",
        "product__name",
        "quantity",
        "rate_per_piece",
        "total_amount",
        "branch__name"
    ).order_by(
        "-production_date"
    )


    # ============================================================
    # RENDER
    # ============================================================

    return render(
        request,
        "employees/production_list.html",
        {
            "productions": productions,

            "branches": branches,
            "employees": employees,
            "products": products,

            "employee_report": employee_report,
            "item_report": item_report,
            "employee_item_report": employee_item_report,
            "item_employee_report": item_employee_report,
            "daily_report": daily_report,

            "total_pieces": total_pieces,
            "total_amount": total_amount,

            "from_date": from_date,
            "to_date": to_date,

            "selected_branch": branch_id,
            "selected_employee": employee_id,
            "selected_product": product_id,
        }
    )

# ============================================================
# ADD DAILY PERFORMANCE
# ============================================================

@login_required
def production_create(request):

    # ========================================================
    # EMPLOYEES
    # ========================================================

    if request.user.role == "Admin":

        employees = Employee.objects.filter(
            active=True
        ).select_related(
            "branch"
        ).order_by(
            "branch__name",
            "name"
        )

    else:

        employees = Employee.objects.filter(
            branch=request.user.branch,
            active=True
        ).order_by("name")

    # ========================================================
    # POST
    # ========================================================

    if request.method == "POST":

        employee_id = request.POST.get("employee")
        production_date = request.POST.get("production_date")

        # ----------------------------------------------------
        # Employee validation
        # ----------------------------------------------------

        if not employee_id:

            messages.error(
                request,
                "Please select an employee."
            )

            formset = DailyProductionFormSet(
                request.POST
            )

            return render(
                request,
                "employees/production_form.html",
                {
                    "formset": formset,
                    "employees": employees,
                    "today": date.today(),
                    "title": "Employee Performance",
                }
            )

        # ----------------------------------------------------
        # Get employee safely
        # ----------------------------------------------------

        if request.user.role == "Admin":

            employee = get_object_or_404(
                Employee,
                id=employee_id,
                active=True
            )

        else:

            employee = get_object_or_404(
                Employee,
                id=employee_id,
                branch=request.user.branch,
                active=True
            )

        # ----------------------------------------------------
        # Formset
        # ----------------------------------------------------

        formset = DailyProductionFormSet(
            request.POST
        )

        if formset.is_valid():

            saved_count = 0

            for form in formset:

                # Skip completely empty rows
                if not form.cleaned_data:
                    continue

                product = form.cleaned_data.get(
                    "product"
                )

                quantity = form.cleaned_data.get(
                    "quantity"
                )

                rate = form.cleaned_data.get(
                    "rate_per_piece"
                )

                remarks = form.cleaned_data.get(
                    "remarks"
                )

                if not product or not quantity:
                    continue

                # ------------------------------------------------
                # CREATE PRODUCTION
                # ------------------------------------------------

                DailyProduction.objects.create(

                    branch=employee.branch,

                    employee=employee,

                    product=product,

                    production_date=production_date,

                    quantity=quantity,

                    rate_per_piece=rate,

                    remarks=remarks
                )

                saved_count += 1

            if saved_count > 0:

                messages.success(
                    request,
                    f"{saved_count} production item(s) added successfully."
                )

                return redirect(
                    "production_list"
                )

            messages.error(
                request,
                "Please add at least one production item."
            )

    else:

        formset = DailyProductionFormSet()

    return render(
        request,
        "employees/production_form.html",
        {
            "formset": formset,
            "employees": employees,
            "today": date.today(),
            "title": "Employee Performance",
        }
    )


# ============================================================
# EDIT DAILY PRODUCTION
# ============================================================

@login_required
def production_edit(request, id):

    production = get_object_or_404(
        DailyProduction,
        id=id
    )

    # ========================================================
    # SECURITY
    # ========================================================

    if request.user.role != "Admin":

        if production.branch != request.user.branch:

            messages.error(
                request,
                "You cannot edit this production."
            )

            return redirect(
                "production_list"
            )

    # ========================================================
    # EMPLOYEES
    # ========================================================

    if request.user.role == "Admin":

        employees = Employee.objects.filter(
            active=True
        ).select_related(
            "branch"
        ).order_by(
            "branch__name",
            "name"
        )

    else:

        employees = Employee.objects.filter(
            branch=request.user.branch,
            active=True
        ).order_by("name")

    # ========================================================
    # POST
    # ========================================================

    if request.method == "POST":

        employee_id = request.POST.get(
            "employee"
        )

        production_date = request.POST.get(
            "production_date"
        )

        if request.user.role == "Admin":

            employee = get_object_or_404(
                Employee,
                id=employee_id,
                active=True
            )

        else:

            employee = get_object_or_404(
                Employee,
                id=employee_id,
                branch=request.user.branch,
                active=True
            )

        formset = DailyProductionFormSet(
            request.POST
        )

        if formset.is_valid():

            form = next(
                iter(formset)
            )

            product = form.cleaned_data.get(
                "product"
            )

            quantity = form.cleaned_data.get(
                "quantity"
            )

            rate = form.cleaned_data.get(
                "rate_per_piece"
            )

            remarks = form.cleaned_data.get(
                "remarks"
            )

            if product and quantity:

                production.branch = employee.branch

                production.employee = employee

                production.product = product

                production.production_date = (
                    production_date
                )

                production.quantity = quantity

                production.rate_per_piece = rate

                production.remarks = remarks

                production.save()

                messages.success(
                    request,
                    "Production updated successfully."
                )

                return redirect(
                    "production_list"
                )

    else:

        formset = DailyProductionFormSet(
            initial=[
                {
                    "product": production.product,
                    "quantity": production.quantity,
                    "rate_per_piece": production.rate_per_piece,
                    "remarks": production.remarks,
                }
            ]
        )

    return render(
        request,
        "employees/production_form.html",
        {
            "formset": formset,
            "employees": employees,
            "production": production,
            "selected_employee": production.employee_id,
            "selected_date": production.production_date,
            "today": date.today(),
            "edit": True,
            "title": "Edit Employee Performance",
        }
    )


# ============================================================
# DELETE DAILY PRODUCTION
# ============================================================

@login_required
def production_delete(request, id):

    production = get_object_or_404(
        DailyProduction,
        id=id
    )

    # ========================================================
    # SECURITY
    # ========================================================

    if request.user.role != "Admin":

        if production.branch != request.user.branch:

            messages.error(
                request,
                "You cannot delete this production."
            )

            return redirect(
                "production_list"
            )

    # ========================================================
    # DELETE
    # ========================================================

    if request.method == "POST":

        production.delete()

        messages.success(
            request,
            "Production record deleted successfully."
        )

    return redirect(
        "production_list"
    )
@login_required
def employee_performance(request, employee_id):

    employee = get_object_or_404(
        Employee,
        id=employee_id
    )

    # ============================================================
    # SECURITY
    # ============================================================

    if request.user.role != "Admin":

        if employee.branch_id != request.user.branch_id:
            return redirect("production_list")


    # ============================================================
    # DATE FILTER
    # ============================================================

    from_date = request.GET.get("from_date")

    to_date = request.GET.get("to_date")

    from datetime import date

    if not from_date:
        from_date = date.today().strftime("%Y-%m-%d")

    if not to_date:
        to_date = date.today().strftime("%Y-%m-%d")


    # ============================================================
    # UPDATE RATES
    # ============================================================

    if request.method == "POST":

        products = Product.objects.filter(
            active=True
        ).order_by("name")

        for product in products:

            rate_value = request.POST.get(
                f"rate_{product.id}"
            )

            if rate_value is None:
                continue

            try:
                rate_value = float(rate_value)
            except (ValueError, TypeError):
                rate_value = 0

            if rate_value < 0:
                rate_value = 0


            # ----------------------------------------------------
            # SAVE EMPLOYEE + PRODUCT RATE
            # ----------------------------------------------------

            EmployeeProductRate.objects.update_or_create(

                employee=employee,

                product=product,

                defaults={
                    "rate_per_piece": rate_value
                }
            )


            # ----------------------------------------------------
            # UPDATE EXISTING PRODUCTION RECORDS
            # ----------------------------------------------------

            production_records = DailyProduction.objects.filter(
                employee=employee,
                product=product
            )

            for production in production_records:

                production.rate_per_piece = rate_value

                production.total_amount = (
                    production.quantity * rate_value
                )

                production.save(
                    update_fields=[
                        "rate_per_piece",
                        "total_amount"
                    ]
                )


            # ----------------------------------------------------
            # CORRECT AMOUNT INDIVIDUALLY
            # ----------------------------------------------------

            production_records = DailyProduction.objects.filter(
                employee=employee,
                product=product
            )

            for production in production_records:

                production.rate_per_piece = rate_value

                production.total_amount = (
                    production.quantity *
                    rate_value
                )

                production.save(
                    update_fields=[
                        "rate_per_piece",
                        "total_amount"
                    ]
                )


        messages.success(
            request,
            f"Rates updated successfully for {employee.name}."
        )

        return redirect(
            "employee_performance",
            employee_id=employee.id
        )


    # ============================================================
    # PRODUCTION
    # ============================================================

    productions = DailyProduction.objects.filter(

        employee=employee,

        production_date__gte=from_date,

        production_date__lte=to_date

    ).select_related(
        "product"
    )


    # ============================================================
    # ITEM-WISE BREAKDOWN
    # ============================================================

    item_report = productions.values(

        "product_id",

        "product__name"

    ).annotate(

        total_pieces=Sum(
            "quantity"
        ),

        total_salary=Sum(
            "total_amount"
        )

    ).order_by(
        "product__name"
    )


    # ============================================================
    # ADD CURRENT RATE
    # ============================================================

    rates = EmployeeProductRate.objects.filter(
        employee=employee
    )

    rate_map = {
        rate.product_id: rate.rate_per_piece
        for rate in rates
    }


    for item in item_report:

        item["rate_per_piece"] = rate_map.get(
            item["product_id"],
            0
        )


    # ============================================================
    # TOTAL
    # ============================================================

    totals = productions.aggregate(

        total_pieces=Sum(
            "quantity"
        ),

        total_salary=Sum(
            "total_amount"
        )
    )


    total_pieces = totals["total_pieces"] or 0

    total_salary = totals["total_salary"] or 0


    # ============================================================
    # PRODUCTS FOR RATE EDITING
    # ============================================================

    products = Product.objects.filter(
        active=True
    ).order_by(
        "name"
    )


    for product in products:

        product.employee_rate = rate_map.get(
            product.id,
            0
        )


    # ============================================================
    # RENDER
    # ============================================================

    return render(
        request,
        "employees/employee_performance.html",
        {
            "employee": employee,

            "item_report": item_report,

            "products": products,

            "productions": productions,

            "total_pieces": total_pieces,

            "total_salary": total_salary,

            "from_date": from_date,

            "to_date": to_date,
        }
    )
@login_required
def employee_performance_pdf(request, employee_id):

    employee = get_object_or_404(
        Employee,
        id=employee_id
    )

    # =====================================================
    # SECURITY
    # =====================================================

    if request.user.role != "Admin":

        if employee.branch_id != request.user.branch_id:

            return redirect(
                "production_list"
            )


    # =====================================================
    # DATE FILTER
    # =====================================================

    from_date = request.GET.get(
        "from_date"
    )

    to_date = request.GET.get(
        "to_date"
    )


    # Default = Today

    from datetime import date

    if not from_date:

        from_date = date.today().strftime(
            "%Y-%m-%d"
        )

    if not to_date:

        to_date = date.today().strftime(
            "%Y-%m-%d"
        )


    # =====================================================
    # DAILY PRODUCTION
    # =====================================================

    productions = DailyProduction.objects.filter(

        employee=employee,

        production_date__gte=from_date,

        production_date__lte=to_date

    ).select_related(

        "product",

        "branch"

    ).order_by(

        "-production_date",

        "product__name"

    )


    # =====================================================
    # TOTAL PIECES
    # =====================================================

    totals = productions.aggregate(

        total_pieces=Sum(
            "quantity"
        ),

        total_salary=Sum(
            "total_amount"
        )

    )


    total_pieces = (
        totals["total_pieces"]
        or 0
    )


    total_salary = (
        totals["total_salary"]
        or 0
    )


    # =====================================================
    # ITEM-WISE REPORT
    # =====================================================

    item_report = productions.values(

        "product_id",

        "product__name"

    ).annotate(

        total_pieces=Sum(
            "quantity"
        ),

        total_salary=Sum(
            "total_amount"
        )

    ).order_by(

        "product__name"

    )


    # =====================================================
    # PDF RESPONSE
    # =====================================================

    response = HttpResponse(
        content_type="application/pdf"
    )


    response[
        "Content-Disposition"
    ] = (

        f'attachment; '
        f'filename="'
        f'{employee.name}_'
        f'performance.pdf"'

    )


    # =====================================================
    # PDF DOCUMENT
    # =====================================================

    doc = SimpleDocTemplate(

        response,

        pagesize=A4,

        rightMargin=12 * mm,

        leftMargin=12 * mm,

        topMargin=12 * mm,

        bottomMargin=12 * mm,

    )


    # =====================================================
    # STYLES
    # =====================================================

    styles = getSampleStyleSheet()


    title_style = ParagraphStyle(

        "EmployeeTitle",

        parent=styles["Title"],

        fontSize=20,

        leading=24,

        alignment=TA_CENTER,

        spaceAfter=4,

    )


    subtitle_style = ParagraphStyle(

        "EmployeeSubtitle",

        parent=styles["Normal"],

        fontSize=11,

        alignment=TA_CENTER,

        textColor=colors.HexColor(
            "#64748b"
        ),

        spaceAfter=15,

    )


    normal_style = ParagraphStyle(

        "EmployeeNormal",

        parent=styles["Normal"],

        fontSize=9,

        leading=12,

    )


    heading_style = ParagraphStyle(

        "EmployeeHeading",

        parent=styles["Heading2"],

        fontSize=12,

        leading=15,

        spaceBefore=12,

        spaceAfter=7,

    )


    # =====================================================
    # STORY
    # =====================================================

    story = []


    # =====================================================
    # HEADER
    # =====================================================

    story.append(

        Paragraph(
            "STITCHING PRO",
            title_style
        )

    )


    story.append(

        Paragraph(
            "Employee Performance Report",
            subtitle_style
        )

    )


    # =====================================================
    # EMPLOYEE DETAILS
    # =====================================================

    employee_details = [

        [
            Paragraph(
                "<b>Employee</b>",
                normal_style
            ),

            Paragraph(
                employee.name,
                normal_style
            ),

            Paragraph(
                "<b>Designation</b>",
                normal_style
            ),

            Paragraph(
                employee.designation or "-",
                normal_style
            ),
        ],

        [
            Paragraph(
                "<b>Branch</b>",
                normal_style
            ),

            Paragraph(
                employee.branch.name
                if employee.branch
                else "-",
                normal_style
            ),

            Paragraph(
                "<b>Period</b>",
                normal_style
            ),

            Paragraph(
                f"{from_date} to {to_date}",
                normal_style
            ),
        ],

    ]


    employee_table = Table(

        employee_details,

        colWidths=[

            28 * mm,

            55 * mm,

            30 * mm,

            62 * mm,

        ]

    )


    employee_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                colors.HexColor(
                    "#f1f5f9"
                )
            ),

            (
                "BACKGROUND",
                (2, 0),
                (2, -1),
                colors.HexColor(
                    "#f1f5f9"
                )
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor(
                    "#cbd5e1"
                )
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

        ])

    )


    story.append(
        employee_table
    )


    story.append(
        Spacer(1, 10)
    )


    # =====================================================
    # PERFORMANCE SUMMARY
    # =====================================================

    story.append(

        Paragraph(
            "Performance Summary",
            heading_style
        )

    )


    summary_data = [

        [
            Paragraph(
                "<b>TOTAL PIECES STITCHED</b>",
                normal_style
            ),

            Paragraph(
                "<b>TOTAL SALARY EARNED</b>",
                normal_style
            ),

        ],

        [

            Paragraph(
                f"<b>{total_pieces}</b>",
                ParagraphStyle(
                    "PiecesValue",
                    parent=normal_style,
                    fontSize=18,
                    alignment=TA_CENTER,
                    textColor=colors.HexColor(
                        "#059669"
                    )
                )
            ),

            Paragraph(
                f"<b>SAR {total_salary:.2f}</b>",
                ParagraphStyle(
                    "SalaryValue",
                    parent=normal_style,
                    fontSize=18,
                    alignment=TA_CENTER,
                    textColor=colors.HexColor(
                        "#7c3aed"
                    )
                )
            ),

        ],

    ]


    summary_table = Table(

        summary_data,

        colWidths=[

            85 * mm,

            85 * mm,

        ]

    )


    summary_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor(
                    "#f8fafc"
                )
            ),

            (
                "BACKGROUND",
                (0, 1),
                (-1, 1),
                colors.white
            ),

            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "CENTER"
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.7,
                colors.HexColor(
                    "#cbd5e1"
                )
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                10
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                10
            ),

        ])

    )


    story.append(
        summary_table
    )


    # =====================================================
    # ITEM-WISE PERFORMANCE
    # =====================================================

    story.append(

        Paragraph(
            "Item-wise Performance",
            heading_style
        )

    )


    item_data = [

        [

            "Item",

            "Pieces",

            "Rate / Piece",

            "Total Earned",

        ]

    ]


    # Get current employee rates

    rates = EmployeeProductRate.objects.filter(

        employee=employee

    )


    rate_map = {

        rate.product_id:
        rate.rate_per_piece

        for rate in rates

    }


    for item in item_report:

        rate = rate_map.get(

            item["product_id"],

            0

        )


        item_data.append([

            item["product__name"],

            str(
                item["total_pieces"]
            ),

            f"SAR {rate:.2f}",

            f"SAR {item['total_salary']:.2f}",

        ])


    if len(item_data) == 1:

        item_data.append([

            "No production records",

            "0",

            "SAR 0.00",

            "SAR 0.00",

        ])


    item_table = Table(

        item_data,

        repeatRows=1,

        colWidths=[

            65 * mm,

            30 * mm,

            35 * mm,

            40 * mm,

        ]

    )


    item_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor(
                    "#f1f5f9"
                )
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor(
                    "#cbd5e1"
                )
            ),

            (
                "ALIGN",
                (1, 1),
                (-1, -1),
                "RIGHT"
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8.5
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

        ])

    )


    story.append(
        item_table
    )


    # =====================================================
    # DETAILED PRODUCTION
    # =====================================================

    story.append(

        Paragraph(
            "Production Details",
            heading_style
        )

    )


    production_data = [

        [

            "Date",

            "Item",

            "Pieces",

            "Rate",

            "Amount",

        ]

    ]


    for production in productions:

        production_data.append([

            production.production_date.strftime(
                "%d-%m-%Y"
            ),

            production.product.name,

            str(
                production.quantity
            ),

            f"SAR {production.rate_per_piece:.2f}",

            f"SAR {production.total_amount:.2f}",

        ])


    if len(production_data) == 1:

        production_data.append([

            "-",

            "No production records",

            "0",

            "SAR 0.00",

            "SAR 0.00",

        ])


    production_table = Table(

        production_data,

        repeatRows=1,

        colWidths=[

            27 * mm,

            55 * mm,

            25 * mm,

            30 * mm,

            33 * mm,

        ]

    )


    production_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor(
                    "#f1f5f9"
                )
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor(
                    "#cbd5e1"
                )
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8
            ),

            (
                "ALIGN",
                (2, 1),
                (-1, -1),
                "RIGHT"
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                5
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5
            ),

        ])

    )


    story.append(
        production_table
    )


    # =====================================================
    # FINAL TOTAL
    # =====================================================

    story.append(
        Spacer(
            1,
            12
        )
    )


    final_total = Table(

        [

            [

                Paragraph(
                    "<b>Total Pieces Stitched</b>",
                    normal_style
                ),

                Paragraph(
                    f"<b>{total_pieces}</b>",
                    normal_style
                ),

            ],

            [

                Paragraph(
                    "<b>Total Salary Earned</b>",
                    normal_style
                ),

                Paragraph(
                    f"<b>SAR {total_salary:.2f}</b>",
                    normal_style
                ),

            ],

        ],

        colWidths=[

            120 * mm,

            50 * mm,

        ]

    )


    final_total.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                colors.HexColor(
                    "#f8fafc"
                )
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.6,
                colors.HexColor(
                    "#cbd5e1"
                )
            ),

            (
                "ALIGN",
                (1, 0),
                (1, -1),
                "RIGHT"
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

        ])

    )


    story.append(
        final_total
    )


    # =====================================================
    # FOOTER
    # =====================================================

    story.append(
        Spacer(
            1,
            15
        )
    )


    story.append(

        Paragraph(

            "This report is generated from "
            "Stitching Pro employee production records.",

            ParagraphStyle(

                "Footer",

                parent=normal_style,

                fontSize=7,

                alignment=TA_CENTER,

                textColor=colors.HexColor(
                    "#64748b"
                )

            )

        )

    )


    # =====================================================
    # BUILD
    # =====================================================

    doc.build(
        story
    )


    return response