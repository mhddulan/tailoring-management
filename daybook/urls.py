from django.urls import path
from . import views

urlpatterns = [
    path('', views.daybook_list, name='daybook_list'),
    path('add/', views.daybook_create, name='daybook_create'),
    path('edit/<int:id>/', views.daybook_edit, name='daybook_edit'),
path('delete/<int:id>/', views.daybook_delete, name='daybook_delete'),
path(
        "excel/",
        views.daybook_excel,
        name="daybook_excel"
    ),

    path(
        "pdf/",
        views.daybook_pdf,
        name="daybook_pdf"
    ),
]