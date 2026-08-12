from django.shortcuts import render, redirect
from .forms import OrderForm
from customers.models import Customer
from django.db import models
from .models import Order, Payment
from .forms import OrderForm, PaymentForm
from django.db.models import Sum
from datetime import date
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from .models import Order
from daybook.models import DayBook
from django.contrib import messages
from .forms import OrderForm, PaymentForm, OrderItemFormSet
def order_list(request):

    orders = Order.objects.all()

    return render(
        request,
        'orders/order_list.html',
        {'orders': orders}
    )

def order_create(request, customer_id=None):

    if request.method == "POST":

        form = OrderForm(request.POST)
        formset = OrderItemFormSet(request.POST)

        if form.is_valid() and formset.is_valid():

            

            order = form.save(commit=False)
            order.dress_type = "Multiple Items"
            order.save()

            items = formset.save(commit=False)

            for item in items:
                item.order = order
                item.save()

            messages.success(
                request,
                f"Order #{order.id} saved successfully."
            )

            return redirect("order_list")

        else:
            print("Order Form Errors")
            print(form.errors)

            print("Order Item Errors")
            print(formset.errors)

    else:

        form = OrderForm()
        formset = OrderItemFormSet()

        if customer_id:
            customer = Customer.objects.get(id=customer_id)
            form.fields["customer"].initial = customer

    return render(
        request,
        "orders/order_form.html",
        {
            "form": form,
            "formset": formset,
        }
    )
def order_detail(request, order_id):

    order = Order.objects.get(id=order_id)

    return render(
        request,
        'orders/order_detail.html',
        {'order': order}
    )
def order_status_update(request, order_id):

    order = Order.objects.get(id=order_id)

    if request.method == 'POST':

        order.status = request.POST.get('status')

        order.save()

        return redirect(
            'order_detail',
            order_id=order.id
        )

    return render(
        request,
        'orders/order_status.html',
        {'order': order}
    )
def payment_list(request):

    payments = Payment.objects.all().order_by(
        '-payment_date'
    )

    return render(
        request,
        'orders/payment_list.html',
        {'payments': payments}
    )


def payment_create(request):

    if request.method == "POST":

        form = PaymentForm(request.POST)

        if form.is_valid():

            payment = form.save()

            # Automatically create DayBook entry
            DayBook.objects.create(
    branch=payment.order.customer.branch,
    date=payment.payment_date,
    transaction_type="Income",
    category="Sales",
    payment_mode=payment.payment_mode,
    description=f"Payment for Order #{payment.order.id}",
    amount=payment.amount,
)

            return redirect("payment_list")

    else:
        form = PaymentForm()

    return render(
        request,
        "orders/payment_form.html",
        {"form": form},
    )
def due_report(request):

    orders = Order.objects.all()

    report = []
    total_due = 0

    for order in orders:

        total_amount = order.total_amount()

        due = total_amount - order.advance_paid

        total_due += due

        report.append({
            "order": order,
            "amount": total_amount,
            "advance": order.advance_paid,
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
def customer_ledger(request, customer_id):

    customer = Customer.objects.get(
        id=customer_id
    )

    orders = Order.objects.filter(
        customer=customer
    )

    payments = Payment.objects.filter(
        order__customer=customer
    )

    total_order_amount = sum(
        order.amount for order in orders
    )

    total_paid = sum(
        payment.amount for payment in payments
    )

    balance = total_order_amount - total_paid

    return render(
        request,
        'orders/customer_ledger.html',
        {
            'customer': customer,
            'orders': orders,
            'payments': payments,
            'total_order_amount': total_order_amount,
            'total_paid': total_paid,
            'balance': balance,
        }
    )
def balance(self):

    paid = self.payment_set.aggregate(
        Sum('amount')
    )['amount__sum'] or 0

    return self.amount - paid
def order_edit(request, order_id):

    order = Order.objects.get(id=order_id)

    if request.method == 'POST':

        form = OrderForm(
            request.POST,
            instance=order
        )

        if form.is_valid():
            form.save()
            return redirect(
                'order_detail',
                order_id=order.id
            )

    else:

        form = OrderForm(
            instance=order
        )

    return render(
        request,
        'orders/order_form.html',
        {'form': form}
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
def order_list(request):

    if request.user.role == 'Admin':
        orders = Order.objects.all()

    else:
        orders = Order.objects.filter(
            customer__branch=request.user.branch
        )

    return render(
        request,
        'orders/order_list.html',
        {'orders': orders}
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

def print_invoice(request, order_id):

    order = Order.objects.get(id=order_id)

    response = HttpResponse(
        content_type='application/pdf'
    )

    response[
        'Content-Disposition'
    ] = f'attachment; filename="order_{order.id}.pdf"'

    p = canvas.Canvas(response)

    p.drawString(100, 800,
        "TAILORING MANAGEMENT SYSTEM")

    p.drawString(100, 760,
        f"Order No : {order.id}")

    p.drawString(100, 740,
        f"Customer : {order.customer.name}")

    p.drawString(100, 720,
        f"Dress Type : {order.dress_type}")

    p.drawString(100, 700,
        f"Order Date : {order.order_date}")

    p.drawString(100, 680,
        f"Delivery Date : {order.delivery_date}")

    p.drawString(100, 660,
        f"Amount : SAR {order.amount}")

    p.drawString(100, 640,
        f"Advance : SAR {order.advance_paid}")

    p.drawString(100, 620,
        f"Status : {order.status}")

    p.save()

    return response

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