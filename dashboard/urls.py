from django.urls import path
from . import views
from branches.views import branch_dashboard

urlpatterns = [
    path('', views.home, name='home'),

    path(
        'branch-dashboard/',
        branch_dashboard,
        name='branch_dashboard'
    ),

    path(
        'backup/',
        views.backup_database,
        name='backup_database'
    ),
]