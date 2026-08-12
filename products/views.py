from datetime import date
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Q
from django.shortcuts import (
    render,
    redirect,
    get_object_or_404,
)
from django.db.models import F, DecimalField, ExpressionWrapper
from .models import *
from .forms import *
from .forms import (
    ProductCategoryForm,
    ProductForm,
    SaleForm,
    SaleItemFormSet,
    StockTransferForm,
)
from daybook.models import DayBook
from django.forms import inlineformset_factory
from django.db import transaction
from decimal import Decimal
from .forms import StockTransferForm



@login_required
def category_list(request):

    categories = ProductCategory.objects.all()

    return render(
        request,
        "products/category_list.html",
        {
            "categories": categories
        }
    )
@login_required
def category_create(request):

    if request.user.role != "Admin":

        messages.error(
            request,
            "Only Admin can create categories."
        )

        return redirect("category_list")

    if request.method == "POST":

        form = ProductCategoryForm(request.POST)

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Category created successfully."
            )

            return redirect("category_list")

    else:

        form = ProductCategoryForm()

    return render(
        request,
        "products/category_form.html",
        {
            "form": form,
            "title": "Add Category",
        }
    )
@login_required
def product_list(request):

    products = Product.objects.select_related(
        "category"
    ).order_by("-id")

    search = request.GET.get("search")

    if search:

        products = products.filter(
            Q(name__icontains=search) |
            Q(barcode__icontains=search)
        )

    return render(
        request,
        "products/product_list.html",
        {
            "products": products
        }
    )
@login_required
def product_create(request):

    if request.user.role != "Admin":

        messages.error(
            request,
            "Only Admin can create products."
        )

        return redirect("product_list")

    if request.method == "POST":

        form = ProductForm(request.POST)

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Product created successfully."
            )

            return redirect("product_list")

    else:

        form = ProductForm()

    return render(
        request,
        "products/product_form.html",
        {
            "form": form,
            "title": "Add Product",
        }
    )
@login_required
def sale_list(request):

    if request.user.role == "Admin":

        sales = Sale.objects.select_related(
            "branch",
            "customer"
        )

    else:

        sales = Sale.objects.filter(
            branch=request.user.branch
        ).select_related(
            "customer"
        )

    return render(

        request,

        "products/sale_list.html",

        {

            "sales": sales

        }

    )

@login_required
@transaction.atomic
def sale_create(request):

    if request.user.role == "Admin":

        branch = request.POST.get("branch")

    else:

        branch = request.user.branch

    if request.method == "POST":

        form = SaleForm(request.POST)
        formset = SaleItemFormSet(request.POST)

        # Branch users don't select branch
        if request.user.role != "Admin":

            form.fields["branch"].required = False

        if form.is_valid() and formset.is_valid():

            sale = form.save(commit=False)

            # Always force branch for Branch users
            if request.user.role != "Admin":

                sale.branch = request.user.branch

            sale.total = 0

            sale.save()

            formset.instance = sale

            items = formset.save(commit=False)

            total = Decimal("0.00")

            # --------------------------------
            # Process Sale Items
            # --------------------------------
            for item in items:

                branch_product = item.branch_product

                if item.quantity > branch_product.stock:

                    messages.error(
                        request,
                        f"{branch_product.product.name} has only "
                        f"{branch_product.stock} items available."
                    )

                    transaction.set_rollback(True)

                    return redirect("sale_create")

                # Use rate entered in the Sales Form
                item.amount = (
                    item.quantity * item.rate
                )

                item.sale = sale

                item.save()

                # Deduct stock (once only)
                branch_product.stock -= item.quantity
                branch_product.save()

                # Add to total
                total += item.amount

            # --------------------------------
            # Update Sale Total
            # --------------------------------

            sale.total = total

            sale.save()

            # --------------------------------
            # DayBook Entry
            # --------------------------------

            DayBook.objects.create(

                branch=sale.branch,

                date=sale.sale_date,

                transaction_type="Income",

                category="Ready Made Sale",

                payment_mode=sale.payment_mode,

                amount=sale.total,

                description=f"Ready Made Sale #{sale.id}"

            )

            messages.success(
                request,
                "Ready-made sale completed successfully."
            )

            return redirect("sale_list")

    else:

        form = SaleForm()

        form.fields["sale_date"].initial = date.today()

        if request.user.role != "Admin":

            form.fields.pop("branch")

        formset = SaleItemFormSet()

    return render(
        request,
        "products/sale_form.html",
        {
            "form": form,
            "formset": formset,
            "title": "New Ready Made Sale",
        }
    )


@login_required
def sale_report(request):

    # ==========================================
    # GET SALES
    # ==========================================

    if request.user.role == "Admin":

        sales = Sale.objects.select_related(
            "branch",
            "customer"
        ).order_by(
            "-sale_date",
            "-id"
        )

        branches = Branch.objects.all()

    else:

        sales = Sale.objects.filter(
            branch=request.user.branch
        ).select_related(
            "branch",
            "customer"
        ).order_by(
            "-sale_date",
            "-id"
        )

        branches = Branch.objects.filter(
            id=request.user.branch.id
        )


    # ==========================================
    # DATE FILTER
    # ==========================================

    from_date = request.GET.get("from_date")

    to_date = request.GET.get("to_date")


    if from_date:

        sales = sales.filter(
            sale_date__gte=from_date
        )


    if to_date:

        sales = sales.filter(
            sale_date__lte=to_date
        )


    # ==========================================
    # BRANCH FILTER - ADMIN ONLY
    # ==========================================

    branch_id = request.GET.get("branch")


    if request.user.role == "Admin" and branch_id:

        sales = sales.filter(
            branch_id=branch_id
        )


    # ==========================================
    # TOTAL SALES COUNT
    # ==========================================

    total_sales = sales.count()


    # ==========================================
    # TOTAL REVENUE
    # ==========================================

    total_revenue = sales.aggregate(
        total=Sum("total")
    )["total"]


    if total_revenue is None:

        total_revenue = 0


    # ==========================================
    # AVERAGE SALE
    # ==========================================

    if total_sales > 0:

        average_sale = total_revenue / total_sales

    else:

        average_sale = 0


    # ==========================================
    # RENDER
    # ==========================================

    return render(
        request,
        "products/sale_report.html",
        {
            "sales": sales,
            "branches": branches,

            "total_sales": total_sales,

            "total_revenue": total_revenue,

            "average_sale": average_sale,
        }
    )
# @login_required
# def stock_transfer_list(request):

#     transfers = StockTransfer.objects.select_related(
#         "product",
#         "branch"
#     ).order_by("-transfer_date")

#     return render(
#         request,
#         "products/stock_transfer_list.html",
#         {
#             "transfers": transfers
#         }
#     )
@login_required
def stock_transfer_list(request):

    transfers = StockTransfer.objects.select_related(
        "product",
        "branch"
    ).order_by("-transfer_date")

    return render(
        request,
        "products/stock_transfer_list.html",
        {
            "transfers": transfers
        }
    )
@login_required
@transaction.atomic
def stock_transfer_create(request):

    if request.user.role != "Admin":

        messages.error(
            request,
            "Only Admin can transfer stock."
        )

        return redirect("stock_transfer_list")

    if request.method == "POST":

        form = StockTransferForm(request.POST)

        if form.is_valid():

            transfer = form.save()

            branch_product, created = BranchProduct.objects.get_or_create(

                branch=transfer.branch,

                product=transfer.product,

                defaults={

                    "stock": 0,

                    "selling_price": transfer.product.purchase_price

                }

            )

            branch_product.stock += transfer.quantity

            branch_product.save()

            messages.success(

                request,

                "Stock transferred successfully."

            )

            return redirect(
                "stock_transfer_list"
            )

    else:

        form = StockTransferForm()

        form.fields["transfer_date"].initial = date.today()

    return render(

        request,

        "products/stock_transfer_form.html",

        {

            "form": form,

            "title": "Stock Transfer"

        }

    )
@login_required
def branch_stock(request):

    if request.user.role == "Admin":

        stocks = BranchProduct.objects.select_related(
            "branch",
            "product"
        )

    else:

        stocks = BranchProduct.objects.filter(
            branch=request.user.branch
        ).select_related(
            "product"
        )

    search = request.GET.get("search")

    if search:

        stocks = stocks.filter(

            Q(product__name__icontains=search) |

            Q(product__barcode__icontains=search)

        )

    return render(

        request,

        "products/branch_stock.html",

        {

            "stocks": stocks

        }

    )
@login_required
def update_price(request, id):

    stock = get_object_or_404(
        BranchProduct,
        id=id
    )

    if request.user.role != "Admin":

        if stock.branch != request.user.branch:

            messages.error(
                request,
                "Permission denied."
            )

            return redirect("branch_stock")

    if request.method == "POST":

        stock.selling_price = request.POST.get(
            "selling_price"
        )

        stock.save()

        messages.success(
            request,
            "Selling price updated."
        )

        return redirect(
            "branch_stock"
        )

    return render(

        request,

        "products/update_price.html",

        {

            "stock": stock

        }

    )
@login_required
def stock_report(request):

    if request.user.role == "Admin":

        stocks = BranchProduct.objects.select_related(
            "branch",
            "product"
        )

    else:

        stocks = BranchProduct.objects.filter(
            branch=request.user.branch
        ).select_related(
            "product"
        )

    search = request.GET.get("search")

    if search:

        stocks = stocks.filter(

            Q(product__name__icontains=search) |

            Q(product__barcode__icontains=search)

        )

    total_stock = stocks.aggregate(

        total=Sum("stock")

    )["total"] or 0

    total_value = 0

    for stock in stocks:

        total_value += stock.stock * stock.selling_price

    return render(

        request,

        "products/stock_report.html",

        {

            "stocks": stocks,

            "total_stock": total_stock,

            "total_value": total_value,

        }

    )
@login_required
def search_product(request):

    keyword = request.GET.get("q", "")

    products = BranchProduct.objects.filter(
        branch=request.user.branch,
        product__active=True
    ).filter(

        Q(product__name__icontains=keyword) |

        Q(product__barcode__icontains=keyword)

    )

    data = []

    for item in products:

        data.append({

            "id": item.id,

            "name": item.product.name,

            "barcode": item.product.barcode,

            "stock": item.stock,

            "price": float(item.selling_price),

        })

    return JsonResponse(data, safe=False)
@login_required
def product_edit(request, id):

    product = get_object_or_404(
        Product,
        id=id
    )

    if request.user.role != "Admin":

        messages.error(
            request,
            "Only Admin can edit products."
        )

        return redirect("product_list")

    if request.method == "POST":

        form = ProductForm(
            request.POST,
            instance=product
        )

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Product updated successfully."
            )

            return redirect("product_list")

    else:

        form = ProductForm(
            instance=product
        )

    return render(
        request,
        "products/product_form.html",
        {
            "form": form,
            "product": product,
            "title": "Edit Product",
        }
    )


@login_required
def product_delete(request, id):

    product = get_object_or_404(
        Product,
        id=id
    )

    if request.method == "POST":

        product.delete()

        messages.success(
            request,
            "Product deleted successfully."
        )

        return redirect(
            "product_list"
        )

    return render(
        request,
        "products/product_delete.html",
        {
            "product": product
        }
    )
@login_required
def category_edit(request, id):

    if request.user.role != "Admin":

        messages.error(
            request,
            "Only Admin can edit categories."
        )

        return redirect("category_list")

    category = get_object_or_404(
        ProductCategory,
        id=id
    )

    if request.method == "POST":

        form = ProductCategoryForm(
            request.POST,
            instance=category
        )

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Category updated successfully."
            )

            return redirect("category_list")

    else:

        form = ProductCategoryForm(
            instance=category
        )

    return render(
        request,
        "products/category_form.html",
        {
            "form": form,
            "category": category,
            "title": "Edit Category",
        }
    )
@login_required
def category_delete(request, id):

    if request.user.role != "Admin":

        messages.error(
            request,
            "Only Admin can delete categories."
        )

        return redirect("category_list")

    category = get_object_or_404(
        ProductCategory,
        id=id
    )

    if request.method == "POST":

        category.delete()

        messages.success(
            request,
            "Category deleted successfully."
        )

        return redirect("category_list")

    return render(
        request,
        "products/category_delete.html",
        {
            "category": category
        }
    )
@login_required
def update_price(request, id):

    if request.user.role == "Admin":
        branch_product = get_object_or_404(
            BranchProduct,
            id=id
        )
    else:
        branch_product = get_object_or_404(
            BranchProduct,
            id=id,
            branch=request.user.branch
        )

    if request.method == "POST":

        price = request.POST.get("selling_price")

        if price:

            branch_product.selling_price = price
            branch_product.save()

            messages.success(
                request,
                "Selling price updated successfully."
            )

        return redirect("branch_stock")

    return render(
        request,
        "products/update_price.html",
        {
            "branch_product": branch_product
        }
    )