import uuid
import random
from django.db import models


def generate_account_number():
    return ''.join([str(random.randint(0, 9)) for _ in range(12)])


def generate_upi_id(username):
    return f"{username.lower()}@andbank"

def generate_ifsc():
    branch_code = str(random.randint(100000, 999999))
    return f"ANDB0{branch_code}"

class Account(models.Model):
    ifsc_code = models.CharField(max_length=11, default=generate_ifsc)
    branch = models.CharField(max_length=100, default='AND Bank Main Branch')

class Account(models.Model):
    ACCOUNT_TYPES = [
        ('savings', 'Savings'),
        ('current', 'Current'),
        ('fixed', 'Fixed Deposit'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('frozen', 'Frozen'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True, db_index=True)  # from auth service
    account_number = models.CharField(max_length=12, unique=True, default=generate_account_number)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='savings')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    upi_id = models.CharField(max_length=100, unique=True, blank=True)
    ifsc_code = models.CharField(max_length=11, default='ANDB0000001')
    branch = models.CharField(max_length=100, default='AND Bank Main Branch')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'

    def save(self, *args, **kwargs):
        if not self.upi_id:
            # Will be set from the signal/view using username
            self.upi_id = f"{self.account_number}@andbank"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Account {self.account_number} - User {self.user_id}"