import uuid
import random
import string
from django.db import models
from django.utils import timezone


def generate_account_number():
    """Generate unique 12-digit AND Bank account number: AND-XXXXXXXXXXXX"""
    digits = ''.join(random.choices(string.digits, k=12))
    return f'AND{digits}'


def generate_upi_id(first_name, last_name, account_number):
    """Generate UPI ID: firstname.lastname@andbank"""
    base = f'{first_name.lower()}.{last_name.lower()}'
    # Ensure uniqueness by appending last 4 digits if needed
    suffix = account_number[-4:]
    return f'{base}{suffix}@andbank'


class BankAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('savings',  'Savings Account'),
        ('current',  'Current Account'),
        ('fixed',    'Fixed Deposit'),
        ('recurring','Recurring Deposit'),
    ]
    STATUS_CHOICES = [
        ('active',   'Active'),
        ('inactive', 'Inactive'),
        ('frozen',   'Frozen'),
        ('closed',   'Closed'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id        = models.UUIDField(db_index=True)          # FK to auth-service user
    account_number = models.CharField(max_length=20, unique=True, db_index=True)
    account_type   = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default='savings')
    balance        = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    upi_id         = models.CharField(max_length=100, unique=True, null=True, blank=True)
    ifsc_code      = models.CharField(max_length=11, default='ANDB0000001')
    branch_code    = models.CharField(max_length=10, default='ANDB001')
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_primary     = models.BooleanField(default=True)
    interest_rate  = models.DecimalField(max_digits=5, decimal_places=2, default=3.50)  # % per annum
    daily_txn_limit = models.DecimalField(max_digits=15, decimal_places=2, default=500000.00)
    created_at     = models.DateTimeField(default=timezone.now)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bank_accounts'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['user_id', 'status']),
            models.Index(fields=['account_number']),
        ]

    def __str__(self):
        return f'{self.account_number} ({self.account_type})'

    def save(self, *args, **kwargs):
        if not self.account_number:
            # Ensure unique account number
            while True:
                num = generate_account_number()
                if not BankAccount.objects.filter(account_number=num).exists():
                    self.account_number = num
                    break
        super().save(*args, **kwargs)


class KYCDetail(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('verified',  'Verified'),
        ('rejected',  'Rejected'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id        = models.UUIDField(unique=True, db_index=True)
    pan_number     = models.CharField(max_length=10, unique=True)
    aadhar_number  = models.CharField(max_length=12)  # Stored encrypted in prod
    date_of_birth  = models.DateField()
    address        = models.TextField()
    verification_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_at    = models.DateTimeField(null=True, blank=True)
    verified_by    = models.UUIDField(null=True, blank=True)   # admin user id
    rejection_reason = models.TextField(blank=True)
    created_at     = models.DateTimeField(default=timezone.now)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'kyc_details'

    def __str__(self):
        return f'KYC [{self.verification_status}] for user {self.user_id}'


class UserProfile(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id      = models.UUIDField(unique=True, db_index=True)
    photo        = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    email        = models.EmailField()                    # Cached from auth-service
    phone        = models.CharField(max_length=20)
    first_name   = models.CharField(max_length=100)
    last_name    = models.CharField(max_length=100)
    created_at   = models.DateTimeField(default=timezone.now)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def photo_url(self):
        if self.photo:
            return self.photo.url
        return None
