from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # API functions
    api_test,
    api_login,
    dashboard_data,
    order_product_price,
    order_deliver,

    # ViewSets
    BranchViewSet,
    CustomerViewSet,
    MeasurementViewSet,
    OrderViewSet,
    OrderItemViewSet,
    PaymentViewSet,
    SaleViewSet,
    SaleItemViewSet,
    ProductViewSet,
    ProductCategoryViewSet,
    DayBookViewSet,
    OpeningBalanceViewSet,
    EmployeeViewSet,
    DailyProductionViewSet,
    EmployeeProductRateViewSet,
    AlterationViewSet,
    BranchProductViewSet,
    StockTransferViewSet,
)

from daybook.views import (
    daybook_excel,
    daybook_pdf,
)


# ============================================================
# ROUTER
# ============================================================

router = DefaultRouter()


# ============================================================
# CUSTOMERS
# ============================================================

router.register(
    "customers",
    CustomerViewSet,
    basename="customers"
)


# ============================================================
# MEASUREMENTS
# ============================================================

router.register(
    "measurements",
    MeasurementViewSet,
    basename="measurements"
)
router.register(
    "branch-products",
    BranchProductViewSet,
    basename="branch-products"
)
router.register(
    "stock-transfers",
    StockTransferViewSet,
    basename="stock-transfers"
)
# ============================================================
# BRANCHES
# ============================================================

router.register(
    "branches",
    BranchViewSet,
    basename="branches"
)


# ============================================================
# PRODUCT CATEGORIES
# ============================================================

router.register(
    "product-categories",
    ProductCategoryViewSet,
    basename="product-categories"
)


# ============================================================
# PRODUCTS
# ============================================================

router.register(
    "products",
    ProductViewSet,
    basename="products"
)


# ============================================================
# ORDERS
# ============================================================

router.register(
    "orders",
    OrderViewSet,
    basename="orders"
)


# ============================================================
# ORDER ITEMS
# ============================================================

router.register(
    "order-items",
    OrderItemViewSet,
    basename="order-items"
)


# ============================================================
# PAYMENTS
# ============================================================

router.register(
    "payments",
    PaymentViewSet,
    basename="payments"
)


# ============================================================
# SALES
# ============================================================

router.register(
    "sales",
    SaleViewSet,
    basename="sales"
)


router.register(
    "sale-items",
    SaleItemViewSet,
    basename="sale-items"
)


# ============================================================
# DAY BOOK
# ============================================================

router.register(
    "daybook",
    DayBookViewSet,
    basename="daybook"
)


# ============================================================
# OPENING BALANCE
# ============================================================

router.register(
    "opening-balances",
    OpeningBalanceViewSet,
    basename="opening-balances"
)


# ============================================================
# EMPLOYEES
# ============================================================

router.register(
    "employees",
    EmployeeViewSet,
    basename="employees"
)


# ============================================================
# PRODUCTION
# ============================================================

router.register(
    "production",
    DailyProductionViewSet,
    basename="production"
)


# ============================================================
# EMPLOYEE RATES
# ============================================================

router.register(
    "employee-rates",
    EmployeeProductRateViewSet,
    basename="employee-rates"
)


# ============================================================
# ALTERATIONS
# ============================================================

router.register(
    "alterations",
    AlterationViewSet,
    basename="alterations"
)


# ============================================================
# URL PATTERNS
# ============================================================

urlpatterns = [

    # --------------------------------------------------------
    # API TEST
    # --------------------------------------------------------

    path(
        "test/",
        api_test,
        name="api_test"
    ),


    # --------------------------------------------------------
    # LOGIN
    # --------------------------------------------------------

    path(
        "login/",
        api_login,
        name="api_login"
    ),


    # --------------------------------------------------------
    # DASHBOARD
    # --------------------------------------------------------

    path(
        "dashboard/",
        dashboard_data,
        name="dashboard_data"
    ),


    # --------------------------------------------------------
    # DAYBOOK EXPORT
    # --------------------------------------------------------

    path(
        "daybook/excel/",
        daybook_excel,
        name="api_daybook_excel"
    ),

    path(
        "daybook/pdf/",
        daybook_pdf,
        name="api_daybook_pdf"
    ),


    # --------------------------------------------------------
    # ORDER PRICE
    # --------------------------------------------------------

    path(
        "orders/order-price/",
        order_product_price,
        name="order_product_price"
    ),


    # --------------------------------------------------------
    # ORDER DELIVERY
    # --------------------------------------------------------

    path(
        "orders/<int:order_id>/deliver/",
        order_deliver,
        name="order_deliver"
    ),


    # --------------------------------------------------------
    # ROUTER URLS
    # --------------------------------------------------------

    path(
        "",
        include(router.urls)
    ),
]