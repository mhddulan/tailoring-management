from django.db import models

class Branch(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    phone = models.CharField(max_length=15)
    manager_name = models.CharField(max_length=100)

    def __str__(self):
        return self.name