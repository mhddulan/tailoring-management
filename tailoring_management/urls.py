from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', lambda request: redirect('login')),   # Redirect root to login

    path('dashboard/', include('dashboard.urls')),
    path('branches/', include('branches.urls')),
    path('customers/', include('customers.urls')),
    path('orders/', include('orders.urls')),
    path('daybook/', include('daybook.urls')),
    path('accounts/', include('accounts.urls')),
    path(
    "logs/",
    include("logs.urls")
),
path(
    "employees/",
    include("employees.urls")
),

path(
        "products/",
        include("products.urls")
    ),
    path(
    "alterations/",
    include("alterations.urls")
),
path("api/", include("api.urls")),
]