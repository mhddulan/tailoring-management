from django.contrib import admin
from .models import Customer, Measurement

admin.site.register(Customer)
admin.site.register(Measurement)