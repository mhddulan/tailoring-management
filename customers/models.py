from django.db import models
from branches.models import Branch

class Customer(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)

    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    address = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
class Measurement(models.Model):

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE
    )

    top_length = models.FloatField(null=True, blank=True)
    shoulder = models.FloatField(null=True, blank=True)
    sleeve = models.FloatField(null=True, blank=True)
    sleeve_down = models.FloatField(null=True, blank=True)
    body = models.FloatField(null=True, blank=True)
    collar = models.FloatField(null=True, blank=True)

    pant_length = models.FloatField(null=True, blank=True)
    band = models.FloatField(null=True, blank=True)
    hip = models.FloatField(null=True, blank=True)
    bell = models.FloatField(null=True, blank=True)
    loose = models.FloatField(null=True, blank=True)
    mutt = models.FloatField(null=True, blank=True)
    play = models.FloatField(null=True, blank=True)

    notes = models.TextField(blank=True)

    def __str__(self):
        return self.customer.name