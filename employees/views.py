from datetime import date

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from products.models import Product
from branches.models import Branch
from django.db.models import Q, Sum
from .models import Employee, DailyProduction
from .forms import EmployeeForm, DailyProductionForm


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

@login_required
def production_list(request):

    # ========================================================
    # DATE RANGE
    # ========================================================

    from_date = request.GET.get("from_date")
    to_date = request.GET.get("to_date")

    # Default: today
    if not from_date:
        from_date = date.today().strftime("%Y-%m-%d")

    if not to_date:
        to_date = from_date

    # ========================================================
    # ADMIN
    # ========================================================

    if request.user.role == "Admin":

        productions = (
            DailyProduction.objects
            .filter(
                production_date__gte=from_date,
                production_date__lte=to_date
            )
            .select_related(
                "branch",
                "employee",
                "product"
            )
            .order_by(
                "production_date",
                "branch__name",
                "employee__name"
            )
        )

        employee_totals = (
            Employee.objects
            .filter(active=True)
            .annotate(
                total_pieces=Sum(
                    "productions__quantity",
                    filter=Q(
                        productions__production_date__gte=from_date,
                        productions__production_date__lte=to_date
                    )
                )
            )
            .select_related("branch")
            .order_by(
                "branch__name",
                "name"
            )
        )

    # ========================================================
    # BRANCH
    # ========================================================

    else:

        productions = (
            DailyProduction.objects
            .filter(
                branch=request.user.branch,
                production_date__gte=from_date,
                production_date__lte=to_date
            )
            .select_related(
                "employee",
                "product"
            )
            .order_by(
                "production_date",
                "employee__name"
            )
        )

        employee_totals = (
            Employee.objects
            .filter(
                branch=request.user.branch,
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
            .order_by("name")
        )

    # ========================================================
    # TOTAL PIECES
    # ========================================================

    total_pieces = (
        productions.aggregate(
            total=Sum("quantity")
        )["total"] or 0
    )

    # ========================================================
    # RETURN
    # ========================================================

    return render(
        request,
        "employees/production_list.html",
        {
            "productions": productions,
            "employee_totals": employee_totals,
            "total_pieces": total_pieces,

            # Date range for template
            "from_date": from_date,
            "to_date": to_date,
        }
    )
# ============================================================
# ADD DAILY PRODUCTION
# ============================================================

@login_required
def production_create(request):

    if request.method == "POST":

        form = DailyProductionForm(request.POST)

        # Branch can only select its own employees
        if request.user.role != "Admin":

            form.fields["employee"].queryset = (
                Employee.objects.filter(
                    branch=request.user.branch,
                    active=True
                )
            )

        if form.is_valid():

            production = form.save(commit=False)

            # Get branch from employee
            production.branch = production.employee.branch

            # Security check for Branch Manager
            if request.user.role != "Admin":

                if production.employee.branch != request.user.branch:

                    messages.error(
                        request,
                        "You cannot add production for another branch."
                    )

                    return redirect(
                        "production_create"
                    )

                production.branch = request.user.branch

            production.save()

            messages.success(
                request,
                "Employee performance added successfully."
            )

            return redirect(
                "production_list"
            )

    else:

        form = DailyProductionForm(
            initial={
                "production_date": date.today()
            }
        )

        # Branch users see only their employees
        if request.user.role != "Admin":

            form.fields["employee"].queryset = (
                Employee.objects.filter(
                    branch=request.user.branch,
                    active=True
                )
            )

    return render(
        request,
        "employees/production_form.html",
        {
            "form": form,
            "title": "Employee Performance"
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

    # Branch can edit only its own production
    if request.user.role != "Admin":

        if production.branch != request.user.branch:

            messages.error(
                request,
                "You cannot edit this production entry."
            )

            return redirect(
                "production_list"
            )

    # ========================================================
    # POST
    # ========================================================

    if request.method == "POST":

        form = DailyProductionForm(
            request.POST,
            instance=production
        )

        # Branch can only select its own employees
        if request.user.role != "Admin":

            form.fields["employee"].queryset = (
                Employee.objects.filter(
                    branch=request.user.branch,
                    active=True
                )
            )

        if form.is_valid():

            updated = form.save(
                commit=False
            )

            # Admin
            if request.user.role == "Admin":

                updated.branch = (
                    updated.employee.branch
                )

            # Branch
            else:

                if updated.employee.branch != request.user.branch:

                    messages.error(
                        request,
                        "You cannot assign production to another branch."
                    )

                    return redirect(
                        "production_edit",
                        id=id
                    )

                updated.branch = request.user.branch

            updated.save()

            messages.success(
                request,
                "Employee performance updated successfully."
            )

            return redirect(
                "production_list"
            )

    # ========================================================
    # GET
    # ========================================================

    else:

        form = DailyProductionForm(
            instance=production
        )

        if request.user.role != "Admin":

            form.fields["employee"].queryset = (
                Employee.objects.filter(
                    branch=request.user.branch,
                    active=True
                )
            )

    return render(
        request,
        "employees/production_form.html",
        {
            "form": form,
            "production": production,
            "title": "Edit Employee Performance"
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

    # Branch can delete only its own production
    if request.user.role != "Admin":

        if production.branch != request.user.branch:

            messages.error(
                request,
                "You cannot delete this production."
            )

            return redirect(
                "production_list"
            )

    if request.method == "POST":

        production.delete()

        messages.success(
            request,
            "Production record deleted successfully."
        )

    return redirect(
        "production_list"
    )

# ============================================================
# ADD DAILY PRODUCTION
# ============================================================
@login_required
def production_create(request):

    if request.method == "POST":

        form = DailyProductionForm(
            request.POST
        )

        if request.user.role != "Admin":

            form.fields["employee"].queryset = Employee.objects.filter(
                branch=request.user.branch,
                active=True
            )

        if form.is_valid():

            production = form.save(
                commit=False
            )

            # Automatically assign branch
            # from employee

            production.branch = (
                production.employee.branch
            )

            # Branch security

            if request.user.role != "Admin":

                if production.employee.branch != request.user.branch:

                    messages.error(
                        request,
                        "You cannot add production for another branch."
                    )

                    return redirect(
                        "production_create"
                    )

            production.save()

            messages.success(
                request,
                "Employee performance added successfully."
            )

            return redirect(
                "production_list"
            )

    else:

        form = DailyProductionForm(
            initial={
                "production_date": date.today()
            }
        )

        if request.user.role != "Admin":

            form.fields["employee"].queryset = Employee.objects.filter(
                branch=request.user.branch,
                active=True
            )

    return render(
        request,
        "employees/production_form.html",
        {
            "form": form,
            "title": "Employee Performance"
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

    if request.user.role != "Admin":

        if production.branch != request.user.branch:

            messages.error(
                request,
                "You cannot edit this production entry."
            )

            return redirect(
                "production_list"
            )

    if request.method == "POST":

        form = DailyProductionForm(
            request.POST,
            instance=production
        )

        if request.user.role != "Admin":

            form.fields["employee"].queryset = Employee.objects.filter(
                branch=request.user.branch,
                active=True
            )

            form.fields["product"].queryset = Product.objects.filter(
                active=True
            )

        if form.is_valid():

            updated = form.save(
                commit=False
            )

            if request.user.role == "Admin":

                updated.branch = (
                    updated.employee.branch
                )

            else:

                if updated.employee.branch != request.user.branch:

                    messages.error(
                        request,
                        "You cannot assign production to another branch."
                    )

                    return redirect(
                        "production_edit",
                        id=id
                    )

                updated.branch = request.user.branch

            updated.save()

            messages.success(
                request,
                "Employee performance updated successfully."
            )

            return redirect(
                "production_list"
            )

    else:

        form = DailyProductionForm(
            instance=production
        )

        if request.user.role != "Admin":

            form.fields["employee"].queryset = Employee.objects.filter(
                branch=request.user.branch,
                active=True
            )

            form.fields["product"].queryset = Product.objects.filter(
                active=True
            )

    return render(
        request,
        "employees/production_form.html",
        {
            "form": form,
            "production": production,
            "title": "Edit Employee Performance"
        }
    )
    # ----------------------------------------
    # POST
    # ----------------------------------------

    if request.method == "POST":

        form = DailyProductionForm(
            request.POST,
            instance=production
        )


        if request.user.role != "Admin":

            form.fields[
                "employee"
            ].queryset = Employee.objects.filter(
                branch=request.user.branch,
                active=True
            )


        if form.is_valid():

            updated = form.save(
                commit=False
            )


            # Admin

            if request.user.role == "Admin":

                updated.branch = (
                    updated.employee.branch
                )


            # Branch

            else:

                # Security check

                if (
                    updated.employee.branch
                    != request.user.branch
                ):

                    messages.error(
                        request,
                        "You cannot assign production to another branch."
                    )

                    return redirect(
                        "production_edit",
                        id=id
                    )


                updated.branch = (
                    request.user.branch
                )


            updated.save()


            messages.success(
                request,
                "Production updated successfully."
            )

            return redirect(
                "production_list"
            )


    # ----------------------------------------
    # GET
    # ----------------------------------------

    else:

        form = DailyProductionForm(
            instance=production
        )


        if request.user.role != "Admin":

            form.fields[
                "employee"
            ].queryset = Employee.objects.filter(
                branch=request.user.branch,
                active=True
            )


    return render(
        request,
        "employees/production_form.html",
        {
            "form": form,
            "production": production,
            "title": "Edit Production"
        }
    )
@login_required
def production_delete(request, id):

    production = get_object_or_404(
        DailyProduction,
        id=id
    )


    # Branch can delete only its own production

    if request.user.role != "Admin":

        if production.branch != request.user.branch:

            messages.error(
                request,
                "You cannot delete this production."
            )

            return redirect(
                "production_list"
            )


    if request.method == "POST":

        production.delete()

        messages.success(
            request,
            "Production record deleted successfully."
        )


    return redirect(
        "production_list"
    )