from django.urls import path
from . import views
from .password_reset_views import forgot_password

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
       path(
        "forgot-password/",
        forgot_password,
        name="forgot-password",
    ),
]