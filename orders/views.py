from django.shortcuts import get_object_or_404, render, redirect
from .forms import OrderForm
from customers.models import Customer
from django.db import models
from .models import Order, Payment
from .forms import OrderForm, PaymentForm
from django.db.models import Sum
from datetime import date
from django.http import HttpResponse, JsonResponse
from reportlab.pdfgen import canvas
from products.models import BranchProduct
from .models import Order
from django.contrib.auth.decorators import login_required
from decimal import Decimal, InvalidOperation
from django.utils import timezone
from django.db import transaction
from django.shortcuts import (
    render,
    redirect,
    get_object_or_404,
)
from daybook.models import DayBook
from decimal import Decimal
from django.contrib import messages
from .forms import (
    OrderForm,
    OrderItemFormSet,
    AdvancePaymentForm,
)

from .forms import OrderForm, PaymentForm, OrderItemFormSet
from django.db.models import Q


@login_required
def order_list(request):

    search = request.GET.get("search", "").strip()
    selected_status = request.GET.get("status", "All").strip()

    # =====================================================
    # BASE QUERY
    # =====================================================

    if request.user.role == "Admin":

        orders = Order.objects.all()

    else:

        orders = Order.objects.filter(
            customer__branch=request.user.branch
        )

    orders = (
        orders
        .select_related("customer")
        .prefetch_related("items", "payments")
        .order_by("-order_date", "-id")
    )

    # =====================================================
    # STATUS FILTER
    # =====================================================

    valid_statuses = [
        "Pending",
        "Cutting",
        "Stitching",
        "Ready",
        "Delivery",
        "Delivered",
    ]

    if selected_status in valid_statuses:

        orders = orders.filter(
            status=selected_status
        )

    else:

        selected_status = "All"

    # =====================================================
    # SEARCH
    # =====================================================

    if search:

        search_query = Q(
            customer__name__icontains=search
        )

        search_query |= Q(
            customer__mobile__icontains=search
        )

        if search.isdigit():

            search_query |= Q(
                id=int(search)
            )

        orders = orders.filter(
            search_query
        ).distinct()

    # =====================================================
    # CONTEXT
    # =====================================================

    context = {
        "orders": orders,
        "search": search,
        "selected_status": selected_status,

        "status_choices": Order.STATUS_CHOICES,
    }

    return render(
        request,
        "orders/order_list.html",
        context
    )

@login_required
@transaction.atomic
def order_create(request):

    if request.method == "POST":

        form = OrderForm(request.POST)

        formset = OrderItemFormSet(
            request.POST
        )

        advance_form = AdvancePaymentForm(
            request.POST
        )

        if (
            form.is_valid()
            and formset.is_valid()
            and advance_form.is_valid()
        ):

            # =========================================
            # CREATE ORDER
            # =========================================

            order = form.save()

            # =========================================
            # CREATE ORDER ITEMS
            # =========================================

            formset.instance = order
            formset.save()

            # =========================================
            # ORDER TOTAL
            # =========================================

            order_total = order.total_amount()

            # =========================================
            # GET ADVANCE AMOUNT
            # =========================================

            advance_amount = (
                advance_form.cleaned_data.get("amount")
                or Decimal("0")
            )

            # =========================================
            # CHECK ADVANCE
            # =========================================

            if advance_amount > order_total:

                messages.error(
                    request,
                    f"Advance cannot exceed the order total "
                    f"of SAR{order_total:.2f}."
                )

                raise ValueError(
                    "Advance amount exceeds order total."
                )

            # =========================================
            # PAYMENT MODE
            # =========================================

            payment_mode = (
                advance_form.cleaned_data.get(
                    "payment_mode"
                )
            )

            # =========================================
            # CREATE ADVANCE PAYMENT
            # =========================================

            if advance_amount > 0:

                payment = Payment.objects.create(
                    order=order,
                    amount=advance_amount,
                    payment_mode=payment_mode,
                    payment_type="Advance",
                )

                # =====================================
                # DAY BOOK - SALES INCOME
                # =====================================

                DayBook.objects.create(
                    branch=order.customer.branch,
                    date=payment.payment_date,
                    transaction_type="Income",
                    category="Sales",
                    payment_mode=payment.payment_mode,
                    description=(
                        f"Advance payment for "
                        f"Order #{order.id}"
                    ),
                    amount=payment.amount,
                )

            # =========================================
            # SUCCESS
            # =========================================

            messages.success(
                request,
                f"Order #{order.id} created successfully."
            )

            return redirect(
                "order_detail",
                order_id=order.id
            )

    else:

        form = OrderForm()

        formset = OrderItemFormSet()

        advance_form = AdvancePaymentForm()

    # =============================================
    # FORM PAGE
    # =============================================

    return render(
        request,
        "orders/order_form.html",
        {
            "form": form,
            "formset": formset,
            "advance_form": advance_form,
        }
    )

@login_required
def order_status_update(request, order_id):

    order = get_object_or_404(
        Order,
        id=order_id
    )

    # =====================================================
    # BRANCH SECURITY
    # =====================================================

    if request.user.role != "Admin":

        if order.customer.branch != request.user.branch:

            messages.error(
                request,
                "You cannot update this order."
            )

            return redirect("order_list")

    # =====================================================
    # ONLY POST
    # =====================================================

    if request.method != "POST":

        return redirect("order_list")

    # =====================================================
    # NEW STATUS
    # =====================================================

    new_status = request.POST.get(
        "status",
        ""
    ).strip()

    valid_statuses = dict(
        Order.STATUS_CHOICES
    )

    if new_status not in valid_statuses:

        messages.error(
            request,
            "Invalid order status."
        )

        return redirect("order_list")

    # =====================================================
    # UPDATE
    # =====================================================

    order.status = new_status

    # =====================================================
    # DELIVERY INFORMATION
    # =====================================================

    if new_status == "Delivered":

        order.delivered_date = timezone.now()

        order.delivered_by = request.user

    else:

        order.delivered_date = None

        order.delivered_by = None

    order.save(
        update_fields=[
            "status",
            "delivered_date",
            "delivered_by",
        ]
    )

    messages.success(
        request,
        f"Order #{order.id} status changed to {new_status}."
    )

    return redirect("order_list")

def payment_list(request):

    payments = Payment.objects.all().order_by(
        '-payment_date'
    )

    return render(
        request,
        'orders/payment_list.html',
        {'payments': payments}
    )

@login_required
def payment_create(request):

    if request.method == "POST":

        form = PaymentForm(request.POST)

        if form.is_valid():

            payment = form.save()

            DayBook.objects.create(
                branch=payment.order.customer.branch,
                date=payment.payment_date,
                transaction_type="Income",
                category=payment.payment_type,
                payment_mode=payment.payment_mode,
                description=(
                    f"Payment for Order #{payment.order.id}"
                ),
                amount=payment.amount,
            )

            messages.success(
                request,
                "Payment added successfully."
            )

            return redirect("payment_list")

    else:

        form = PaymentForm()

    return render(
        request,
        "orders/payment_form.html",
        {
            "form": form
        }
    )

@login_required
def due_report(request):

    orders = Order.objects.all()

    report = []

    total_due = Decimal("0")

    for order in orders:

        total_amount = order.total_amount()

        paid = order.total_received()

        due = total_amount - paid

        total_due += due

        report.append({
            "order": order,
            "amount": total_amount,
            "paid": paid,
            "due": due,
        })

    return render(
        request,
        "orders/due_report.html",

        {
            "report": report,
            "total_due": total_due,
        }
    )
@login_required
def customer_ledger(request, customer_id):

    customer = get_object_or_404(
        Customer,
        id=customer_id
    )

    orders = Order.objects.filter(
        customer=customer
    )

    payments = Payment.objects.filter(
        order__customer=customer
    )

    total_order_amount = sum(
        order.total_amount()
        for order in orders
    )

    total_paid = sum(
        payment.amount
        for payment in payments
    )

    balance = (
        total_order_amount
        - total_paid
    )

    return render(
        request,
        "orders/customer_ledger.html",
        {
            "customer": customer,
            "orders": orders,
            "payments": payments,
            "total_order_amount": total_order_amount,
            "total_paid": total_paid,
            "balance": balance,
        }
    )
def balance(self):

    paid = self.payment_set.aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    return self.amount - paid
@login_required
@transaction.atomic
def order_edit(request, order_id):

    order = get_object_or_404(
        Order,
        id=order_id
    )

    if request.method == "POST":

        form = OrderForm(
            request.POST,
            instance=order
        )

        formset = OrderItemFormSet(
            request.POST,
            instance=order
        )

        if form.is_valid() and formset.is_valid():

            form.save()
            formset.save()

            messages.success(
                request,
                f"Order #{order.id} updated successfully."
            )

            return redirect(
                "order_detail",
                order_id=order.id
            )

    else:

        form = OrderForm(
            instance=order
        )

        formset = OrderItemFormSet(
            instance=order
        )

    return render(
        request,
        "orders/order_edit.html",
        {
            "form": form,
            "formset": formset,
            "order": order,
        }
    )

def order_delete(request, order_id):

    order = Order.objects.get(id=order_id)

    if request.method == 'POST':

        order.delete()

        return redirect('order_list')

    return render(
        request,
        'orders/order_delete.html',
        {'order': order}
    )
def daily_collection(request):

    today = date.today()

    payments = Payment.objects.filter(
        payment_date=today
    )

    cash_total = payments.filter(
        payment_mode='Cash'
    ).aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    bank_total = payments.filter(
        payment_mode='Bank'
    ).aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    online_total = payments.filter(
        payment_mode='Online'
    ).aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    total = (
        cash_total +
        bank_total +
        online_total
    )

    return render(
        request,
        'orders/daily_collection.html',
        {
            'cash_total': cash_total,
            'bank_total': bank_total,
            'online_total': online_total,
            'total': total,
            'today': today,
        }
    )
def payment_edit(request, payment_id):

    payment = Payment.objects.get(
        id=payment_id
    )

    if request.method == 'POST':

        form = PaymentForm(
            request.POST,
            instance=payment
        )

        if form.is_valid():
            form.save()
            return redirect('payment_list')

    else:

        form = PaymentForm(
            instance=payment
        )

    return render(
        request,
        'orders/payment_form.html',
        {'form': form}
    )
def payment_delete(request, payment_id):

    payment = Payment.objects.get(
        id=payment_id
    )

    if request.method == 'POST':

        payment.delete()

        return redirect('payment_list')

    return render(
        request,
        'orders/payment_delete.html',
        {'payment': payment}
    )
from django.db.models import Sum

def outstanding_due_report(request):

    orders = Order.objects.all()

    report = []

    total_due = 0

    for order in orders:

        total_amount = order.total_amount()

        paid = (
            Payment.objects.filter(
                order=order
            ).aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        due = total_amount - paid

        total_due += due

        report.append({
            "order": order,
            "amount": total_amount,
            "paid": paid,
            "due": due,
        })

    return render(
        request,
        "orders/outstanding_due_report.html",
        {
            "report": report,
            "total_due": total_due,
        }
    )

def daily_production_report(request):

    today = date.today()

    total_orders = Order.objects.filter(
        order_date=today
    ).count()

    pending_orders = Order.objects.filter(
        order_date=today,
        status='Pending'
    ).count()

    ready_orders = Order.objects.filter(
        status='Ready'
    ).count()

    delivered_orders = Order.objects.filter(
        status='Delivered'
    ).count()

    context = {
        'today': today,
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'ready_orders': ready_orders,
        'delivered_orders': delivered_orders,
    }

    return render(
        request,
        'orders/daily_production_report.html',
        context
    )
@login_required
def order_invoice(request, order_id):

    order = get_object_or_404(
        Order.objects.select_related("customer"),
        id=order_id
    )

    items = order.items.select_related("product")

    payments = order.payments.order_by(
        "payment_date",
        "id"
    )

    return render(
        request,
        "orders/order_invoice.html",
        {
            "order": order,
            "items": items,
            "payments": payments,
        }
    )

@login_required
def print_invoice(request, order_id):
    order = get_object_or_404(Order, id=order_id)

    return render(
        request,
        "orders/invoice.html",
        {
            "order": order,
        }
    )

# class Payment(models.Model):

#     order = models.ForeignKey(
#         Order,
#         on_delete=models.CASCADE
#     )

#     amount = models.DecimalField(
#         max_digits=10,
#         decimal_places=2
#     )

#     payment_mode = models.CharField(
#         max_length=20,
#         choices=[
#             ('Cash', 'Cash'),
#             ('Bank', 'Bank'),
#             ('Online', 'Online'),
#             ('Cheque', 'Cheque'),
#             ('POS', 'POS'),
#         ]
#     )

#     payment_date = models.DateField(auto_now_add=True)

#     remarks = models.TextField(
#         blank=True
#     )

    # def __str__(self):
    #     return f"{self.order.id} - {self.payment_mode}"
@login_required
def order_deliver(request, order_id):

    order = get_object_or_404(
        Order,
        id=order_id
    )

    # ---------------------------------------------------------
    # BRANCH RESTRICTION
    # ---------------------------------------------------------

    if request.user.role != "Admin":

        if order.customer.branch != request.user.branch:

            messages.error(
                request,
                "You cannot deliver this order."
            )

            return redirect("order_list")

    # ---------------------------------------------------------
    # STATUS CHECK
    # ---------------------------------------------------------

    if order.status not in [
        "Ready",
        "Delivery"
    ]:

        messages.error(
            request,
            "Only Ready or Delivery orders can be delivered."
        )

        return redirect("order_list")

    # ---------------------------------------------------------
    # CURRENT BALANCE
    # ---------------------------------------------------------

    balance = Decimal(
        str(order.balance())
    )

    # ---------------------------------------------------------
    # POST
    # ---------------------------------------------------------

    if request.method == "POST":

        payment_amount_raw = request.POST.get(
            "payment_amount",
            "0"
        )

        payment_mode = request.POST.get(
            "payment_mode"
        )

        # -----------------------------------------------------
        # CONVERT PAYMENT
        # -----------------------------------------------------

        try:

            payment_amount = Decimal(
                payment_amount_raw
            )

        except (
            InvalidOperation,
            TypeError
        ):

            messages.error(
                request,
                "Enter a valid payment amount."
            )

            return redirect(
                "order_deliver",
                order_id=order.id
            )

        # -----------------------------------------------------
        # NEGATIVE CHECK
        # -----------------------------------------------------

        if payment_amount < 0:

            messages.error(
                request,
                "Payment amount cannot be negative."
            )

            return redirect(
                "order_deliver",
                order_id=order.id
            )

        # -----------------------------------------------------
        # OVERPAYMENT CHECK
        # -----------------------------------------------------

        if payment_amount > balance:

            messages.error(
                request,
                "Payment cannot be greater than the balance."
            )

            return redirect(
                "order_deliver",
                order_id=order.id
            )

        # -----------------------------------------------------
        # PAYMENT REQUIRED
        # -----------------------------------------------------

        if balance > 0 and payment_amount <= 0:

            messages.error(
                request,
                "Please enter the final payment amount."
            )

            return redirect(
                "order_deliver",
                order_id=order.id
            )

        # -----------------------------------------------------
        # PAYMENT MODE
        # -----------------------------------------------------

        if payment_amount > 0 and not payment_mode:

            messages.error(
                request,
                "Please select a payment mode."
            )

            return redirect(
                "order_deliver",
                order_id=order.id
            )

        # -----------------------------------------------------
        # CREATE BALANCE PAYMENT
        # -----------------------------------------------------

        if payment_amount > 0:

            payment = Payment.objects.create(
                order=order,
                amount=payment_amount,
                payment_mode=payment_mode,
                payment_type="Balance Payment",
            )

            # -------------------------------------------------
            # DAY BOOK
            # -------------------------------------------------

            DayBook.objects.create(
                branch=order.customer.branch,
                date=payment.payment_date,
                transaction_type="Income",
                category="Balance Payment",
                payment_mode=payment_mode,
                description=(
                    f"Order #{order.id} - "
                    f"Final Payment"
                ),
                amount=payment_amount,
            )

        # -----------------------------------------------------
        # MARK DELIVERED
        # -----------------------------------------------------

        order.status = "Delivered"

        order.delivered_date = timezone.now()

        order.delivered_by = request.user

        order.save(
            update_fields=[
                "status",
                "delivered_date",
                "delivered_by",
            ]
        )

        messages.success(
            request,
            f"Order #{order.id} delivered successfully."
        )

        return redirect("order_list")

    # ---------------------------------------------------------
    # PAGE
    # ---------------------------------------------------------

    return render(
        request,
        "orders/order_deliver.html",
        {
            "order": order,
            "balance": balance,
            "payment_modes": Payment.PAYMENT_MODES,
        }
    )
@login_required
def order_detail(request, order_id):

    order = get_object_or_404(
        Order.objects.select_related("customer"),
        id=order_id
    )

    items = order.items.select_related("product")

    payments = order.payments.order_by("-payment_date", "-id")

    context = {
        "order": order,
        "items": items,
        "payments": payments,
    }

    return render(
        request,
        "orders/order_detail.html",
        context
    )
def order_product_price(request):

    product_id = request.GET.get("product_id")
    customer_id = request.GET.get("customer_id")

    if not product_id or not customer_id:
        return JsonResponse({
            "success": False,
            "price": 0
        })

    try:

        customer = Customer.objects.get(
            id=customer_id
        )

        branch_product = BranchProduct.objects.get(
            branch=customer.branch,
            product_id=product_id
        )

        return JsonResponse({
            "success": True,
            "price": float(
                branch_product.selling_price
            )
        })

    except BranchProduct.DoesNotExist:

        return JsonResponse({
            "success": False,
            "price": 0,
            "message": "Product is not available in this branch."
        })

    except Customer.DoesNotExist:

        return JsonResponse({
            "success": False,
            "price": 0
        })