from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction

from django.shortcuts import (
    get_object_or_404,
    redirect,
    render,
)

from .forms import AlterationForm
from .models import Alteration
from daybook.models import DayBook

# ============================================================
# ALTERATION LIST
# ============================================================

@login_required
def alteration_list(request):

    alterations = (
        Alteration.objects
        .select_related("product")
        .order_by("-alteration_date", "-id")
    )

    search = request.GET.get(
        "search",
        ""
    ).strip()

    if search:

        alterations = alterations.filter(

            Q(customer_name__icontains=search)
            |
            Q(phone__icontains=search)
            |
            Q(product__name__icontains=search)

        )

    context = {
        "alterations": alterations,
        "search": search,
    }

    return render(
        request,
        "alterations/alteration_list.html",
        context
    )


# ============================================================
# ADD ALTERATION
# ============================================================
@login_required
@transaction.atomic
def alteration_create(request):

    if request.method == "POST":

        form = AlterationForm(
            request.POST,
            user=request.user
        )

        if form.is_valid():

            alteration = form.save()

            advance_amount = alteration.advance_amount or 0

            if advance_amount > 0:

                DayBook.objects.create(
                    branch=alteration.branch,
                    date=alteration.alteration_date,
                    transaction_type="Income",
                    category="Alteration Advance",
                    payment_mode=alteration.advance_payment_mode,
                    description=(
                        f"Alteration #{alteration.id} - "
                        f"{alteration.customer_name}"
                    ),
                    amount=advance_amount,
                )

            messages.success(
                request,
                f"Alteration #{alteration.id} saved successfully."
            )

            return redirect("alteration_list")

        messages.error(
            request,
            "Please correct the errors below."
        )

    else:

        form = AlterationForm(
            user=request.user
        )

    return render(
        request,
        "alterations/alteration_form.html",
        {
            "form": form,
            "title": "Add Alteration",
        }
    )

# ============================================================
# EDIT ALTERATION
# ============================================================

@login_required
def alteration_edit(request, id):

    alteration = get_object_or_404(
        Alteration,
        id=id
    )

    if request.method == "POST":

        form = AlterationForm(
            request.POST,
            instance=alteration
        )

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Alteration updated successfully."
            )

            return redirect(
                "alteration_list"
            )

    else:

        form = AlterationForm(
            instance=alteration
        )

    return render(
        request,
        "alterations/alteration_form.html",
        {
            "form": form,
            "title": "Edit Alteration",
            "alteration": alteration,
        }
    )


# ============================================================
# DELETE ALTERATION
# ============================================================

@login_required
def alteration_delete(request, id):

    alteration = get_object_or_404(
        Alteration,
        id=id
    )

    if request.method == "POST":

        alteration.delete()

        messages.success(
            request,
            "Alteration deleted successfully."
        )

        return redirect(
            "alteration_list"
        )

    return render(
        request,
        "alterations/alteration_confirm_delete.html",
        {
            "alteration": alteration,
        }
    )


# ============================================================
# ALTERATION DETAIL
# ============================================================

@login_required
def alteration_detail(request, id):

    alteration = get_object_or_404(
        Alteration.objects.select_related(
            "product"
        ),
        id=id
    )

    return render(
        request,
        "alterations/alteration_detail.html",
        {
            "alteration": alteration,
        }
    )


# ============================================================
# PRINT ALTERATION
# ============================================================

@login_required
def alteration_print(request, id):

    alteration = get_object_or_404(
        Alteration.objects.select_related(
            "product"
        ),
        id=id
    )

    return render(
        request,
        "alterations/alteration_print.html",
        {
            "alteration": alteration,
        }
    )