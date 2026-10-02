from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Sum

from .models import Customer, Measurement
from .forms import CustomerForm, MeasurementForm

from orders.models import Order
from logs.utils import log_activity


# =========================================================
# CUSTOMER LIST
# =========================================================

@login_required
def customer_list(request):

    search = request.GET.get("search", "").strip()

    if request.user.role == "Admin":

        customers = Customer.objects.all()

    else:

        customers = Customer.objects.filter(
            branch=request.user.branch
        )


    # Search
    if search:

        customers = customers.filter(
            Q(name__icontains=search) |
            Q(mobile__icontains=search)
        )


    customers = customers.order_by("-created_at")


    # -----------------------------------------------------
    # Customer statistics
    # -----------------------------------------------------

    customer_data = []

    for customer in customers:

        orders = Order.objects.filter(
            customer=customer
        )

        total_orders = orders.count()

        total_amount = sum(
            order.total_amount()
            for order in orders
        )

        total_paid = sum(
            order.total_received()
            for order in orders
        )

        balance = total_amount - total_paid


        customer_data.append({

            "customer": customer,

            "total_orders": total_orders,

            "total_amount": total_amount,

            "total_paid": total_paid,

            "balance": balance,

        })


    return render(
        request,
        "customers/customer_list.html",
        {
            "customer_data": customer_data,
            "search": search,
        }
    )


# =========================================================
# ADD CUSTOMER
# =========================================================
@login_required
def customer_create(request):

    if request.method == "POST":

        form = CustomerForm(request.POST)

        # -----------------------------------------
        # BRANCH USER
        # -----------------------------------------
        if request.user.role != "Admin":

            if not request.user.branch:
                messages.error(
                    request,
                    "You are not assigned to a branch."
                )
                return redirect("customer_create")

            # Branch user can only use their own branch
            form.fields["branch"].queryset = Branch.objects.filter(
                id=request.user.branch.id
            )

        # -----------------------------------------
        # VALIDATE FORM
        # -----------------------------------------
        if form.is_valid():

            customer = form.save(commit=False)

            # -----------------------------------------
            # ADMIN
            # -----------------------------------------
            if request.user.role == "Admin":

                if not customer.branch:
                    messages.error(
                        request,
                        "Please select a branch."
                    )
                    return render(
                        request,
                        "customers/customer_form.html",
                        {"form": form}
                    )

            # -----------------------------------------
            # BRANCH USER
            # -----------------------------------------
            else:
                customer.branch = request.user.branch

            customer.save()

            messages.success(
                request,
                "Customer added successfully."
            )

            return redirect("customer_list")

    else:

        form = CustomerForm()

        # -----------------------------------------
        # BRANCH USER
        # -----------------------------------------
        if request.user.role != "Admin":

            if not request.user.branch:
                messages.error(
                    request,
                    "You are not assigned to a branch."
                )
                return redirect("customer_list")

            form.fields["branch"].queryset = Branch.objects.filter(
                id=request.user.branch.id
            )

            # Automatically select user's branch
            form.initial["branch"] = request.user.branch.id

    return render(
        request,
        "customers/customer_form.html",
        {
            "form": form
        }
    )

# =========================================================
# CUSTOMER DETAIL
# =========================================================

@login_required
def customer_detail(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )


    # Branch security
    if request.user.role != "Admin":

        if customer.branch != request.user.branch:

            messages.error(
                request,
                "You cannot access a customer from another branch."
            )

            return redirect(
                "customer_list"
            )


    measurements = Measurement.objects.filter(
        customer=customer
    )


    orders = Order.objects.filter(
        customer=customer
    ).order_by("-order_date")


    # -----------------------------------------------------
    # Financial summary
    # -----------------------------------------------------

    total_orders = orders.count()


    total_amount = sum(
        order.total_amount()
        for order in orders
    )


    total_paid = sum(
        order.total_received()
        for order in orders
    )


    total_advance = sum(
        order.advance_received()
        for order in orders
    )


    total_balance = (
        total_amount - total_paid
    )


    pending_orders = orders.exclude(
        status="Delivered"
    ).count()


    delivered_orders = orders.filter(
        status="Delivered"
    ).count()


    return render(
        request,
        "customers/customer_detail.html",
        {

            "customer": customer,

            "measurements": measurements,

            "orders": orders,

            "total_orders": total_orders,

            "total_amount": total_amount,

            "total_paid": total_paid,

            "total_advance": total_advance,

            "total_balance": total_balance,

            "pending_orders": pending_orders,

            "delivered_orders": delivered_orders,

        }
    )


# =========================================================
# EDIT CUSTOMER
# =========================================================

@login_required
def customer_edit(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )


    # Branch security
    if request.user.role == "Branch Manager":

        if customer.branch != request.user.branch:

            messages.error(
                request,
                "You cannot edit a customer from another branch."
            )

            return redirect(
                "customer_list"
            )


    measurement = Measurement.objects.filter(
        customer=customer
    ).first()


    if request.method == "POST":

        form = CustomerForm(
            request.POST,
            instance=customer
        )


        if request.user.role == "Branch Manager":

            form.fields[
                "branch"
            ].disabled = True


        if form.is_valid():

            obj = form.save(
                commit=False
            )


            if request.user.role == "Branch Manager":

                obj.branch = request.user.branch


            if request.user.role == "Admin":

                if not obj.branch:

                    form.add_error(
                        "branch",
                        "Please select a branch."
                    )

                    return render(
                        request,
                        "customers/customer_form.html",
                        {
                            "customer_form": form,

                            "measurement_form":
                                MeasurementForm(
                                    instance=measurement
                                ),

                            "edit": True,

                            "customer": customer,
                        }
                    )


            obj.save()


            # Update measurement too
            measurement_form = MeasurementForm(
                request.POST,
                instance=measurement
            )


            if measurement_form.is_valid():

                measurement_obj = (
                    measurement_form.save(
                        commit=False
                    )
                )

                measurement_obj.customer = customer
                measurement_obj.save()


            log_activity(
                request,
                f"Updated Customer: {obj.name}",
                "Customer",
                obj.id
            )


            messages.success(
                request,
                "Customer updated successfully."
            )


            return redirect(
                "customer_detail",
                customer.id
            )


    else:

        form = CustomerForm(
            instance=customer
        )


        if request.user.role == "Branch Manager":

            form.fields[
                "branch"
            ].disabled = True


        measurement_form = MeasurementForm(
            instance=measurement
        )


    return render(
        request,
        "customers/customer_form.html",
        {
            "customer_form": form,

            "measurement_form":
                measurement_form,

            "edit": True,

            "customer": customer,
        }
    )


# =========================================================
# DELETE CUSTOMER
# =========================================================

@login_required
def customer_delete(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )


    # Branch security
    if request.user.role != "Admin":

        if customer.branch != request.user.branch:

            messages.error(
                request,
                "You cannot delete a customer from another branch."
            )

            return redirect(
                "customer_list"
            )


    if request.method == "POST":

        customer_name = customer.name
        customer_pk = customer.id


        customer.delete()


        log_activity(
            request,
            f"Deleted Customer: {customer_name}",
            "Customer",
            customer_pk
        )


        messages.success(
            request,
            "Customer deleted successfully."
        )


        return redirect(
            "customer_list"
        )


    return render(
        request,
        "customers/customer_delete.html",
        {
            "customer": customer
        }
    )


# =========================================================
# EDIT MEASUREMENT
# =========================================================

@login_required
def measurement_edit(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )


    # Branch security
    if request.user.role != "Admin":

        if customer.branch != request.user.branch:

            messages.error(
                request,
                "You cannot edit measurements for another branch."
            )

            return redirect(
                "customer_list"
            )


    measurement = get_object_or_404(
        Measurement,
        customer=customer
    )


    if request.method == "POST":

        form = MeasurementForm(
            request.POST,
            instance=measurement
        )


        if form.is_valid():

            form.save()


            log_activity(
                request,
                f"Updated Measurements for {customer.name}",
                "Measurement",
                measurement.id
            )


            messages.success(
                request,
                "Measurements updated successfully."
            )


            return redirect(
                "customer_detail",
                customer_id=customer.id
            )


    else:

        form = MeasurementForm(
            instance=measurement
        )


    return render(
        request,
        "customers/measurement_form.html",
        {
            "form": form,
            "customer": customer,
        }
    )
# =========================================================
# CUSTOMER LEDGER
# =========================================================

@login_required
def customer_ledger(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )

    if request.user.role != "Admin":

        if customer.branch != request.user.branch:
            messages.error(
                request,
                "You cannot access a customer from another branch."
            )

            return redirect("customer_list")

    orders = Order.objects.filter(
        customer=customer
    ).prefetch_related(
        "items",
        "payments"
    ).order_by("-order_date", "-id")

    total_amount = sum(
        order.total_amount()
        for order in orders
    )

    total_received = sum(
        order.total_received()
        for order in orders
    )

    total_advance = sum(
        order.advance_received()
        for order in orders
    )

    total_balance = total_amount - total_received

    return render(
        request,
        "customers/customer_ledger.html",
        {
            "customer": customer,
            "orders": orders,
            "total_amount": total_amount,
            "total_received": total_received,
            "total_advance": total_advance,
            "total_balance": total_balance,
        }
    )