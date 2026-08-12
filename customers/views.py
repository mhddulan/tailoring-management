from django.contrib import messages
from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404

from .models import Customer, Measurement
from .forms import CustomerForm, MeasurementForm
from orders.models import Order
from logs.utils import log_activity


# ===============================
# Customer List
# ===============================

def customer_list(request):

    search = request.GET.get("search")

    if request.user.role == "Admin":
        customers = Customer.objects.all()
    else:
        customers = Customer.objects.filter(
            branch=request.user.branch
        )

    if search:
        customers = customers.filter(
            Q(name__icontains=search) |
            Q(mobile__icontains=search)
        )

    return render(
        request,
        "customers/customer_list.html",
        {
            "customers": customers
        }
    )


# ===============================
# Add Customer
# ===============================

def customer_create(request):

    if request.method == "POST":

        customer_form = CustomerForm(request.POST)
        measurement_form = MeasurementForm(request.POST)

        if request.user.role == "Branch":
            customer_form.fields["branch"].required = False

        if customer_form.is_valid() and measurement_form.is_valid():

            customer = customer_form.save(commit=False)

            if request.user.role == "Branch":
                customer.branch = request.user.branch

            customer.save()

            measurement = measurement_form.save(commit=False)
            measurement.customer = customer
            measurement.save()
            log_activity(
            request,
                   f"Created Customer: {customer.name}",
    "Customer",
    customer.id
            )

            messages.success(
                request,
                "Customer added successfully."
            )

            return redirect("customer_list")
        print(customer_form.errors)
        print(measurement_form.errors)

    else:

        customer_form = CustomerForm()

        if request.user.role == "Branch":
            customer_form.fields.pop("branch")

        measurement_form = MeasurementForm()

    return render(
        request,
        "customers/customer_form.html",
        {
            "customer_form": customer_form,
            "measurement_form": measurement_form,
        },
    )


# ===============================
# Customer Detail
# ===============================

def customer_detail(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )

    measurements = Measurement.objects.filter(
        customer=customer
    )

    orders = Order.objects.filter(
        customer=customer
    )

    return render(
        request,
        "customers/customer_detail.html",
        {
            "customer": customer,
            "measurements": measurements,
            "orders": orders,
        },
    )


# ===============================
# Edit Customer
# ===============================

def customer_edit(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )

    if request.method == "POST":

        form = CustomerForm(
            request.POST,
            instance=customer
        )

        if request.user.role == "Branch":
            form.fields["branch"].required = False

        if form.is_valid():

            obj = form.save(commit=False)

            if request.user.role == "Branch":
                obj.branch = request.user.branch

            obj.save()
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

            return redirect("customer_detail", customer.id)

    else:

        form = CustomerForm(
            instance=customer
        )

        if request.user.role == "Branch":
            form.fields.pop("branch")

    return render(
        request,
    "customers/customer_form.html",
    {
        "customer_form": form,
        "measurement_form": MeasurementForm(
            instance=Measurement.objects.filter(customer=customer).first()
        ),
        "edit": True,
        "customer": customer,
    },
)


# ===============================
# Delete Customer
# ===============================

def customer_delete(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )

    if request.method == "POST":

        customer.delete()

        log_activity(
    request,
    f"Deleted Customer: {customer.name}",
    "Customer",
    customer.id
        )

        messages.success(
            request,
            "Customer deleted successfully."
        )

        return redirect("customer_list")

    return render(
        request,
        "customers/customer_delete.html",
        {
            "customer": customer
        },
    )


# ===============================
# Edit Measurement
# ===============================

def measurement_edit(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
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
        },
    )