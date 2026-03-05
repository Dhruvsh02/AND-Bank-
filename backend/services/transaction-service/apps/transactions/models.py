import uuid
from django.db import models
from django.utils import timezone


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('credit', 'Credit'),
        ('debit',  'Debit'),
    ]
    MODE_CHOICES = [
        ('neft',  'NEFT'),
        ('rtgs',  'RTGS'),
        ('imps',  'IMPS'),
        ('upi',   'UPI'),
        ('atm',   'ATM'),
        ('pos',   'POS'),
        ('online','Online'),
        ('emi',   'EMI'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('completed', 'Completed'),
        ('failed',    'Failed'),
        ('reversed',  'Reversed'),
        ('flagged',   'Flagged'),
        ('on_hold',   'On Hold'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    txn_id          = models.CharField(max_length=30, unique=True, db_index=True)   # TXN-YYYYMMDD-XXXXXXXX
    from_account    = models.CharField(max_length=20, db_index=True)
    to_account      = models.CharField(max_length=20, db_index=True)
    from_user_id    = models.UUIDField(db_index=True)
    to_user_id      = models.UUIDField(null=True, blank=True)
    amount          = models.DecimalField(max_digits=15, decimal_places=2)
    charges         = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    txn_type        = models.CharField(max_length=10, choices=TYPE_CHOICES)
    mode            = models.CharField(max_length=10, choices=MODE_CHOICES, default='imps')
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remark          = models.CharField(max_length=255, blank=True)
    reference_no    = models.CharField(max_length=50, blank=True)   # Bank reference
    failure_reason  = models.CharField(max_length=255, blank=True)
    is_flagged      = models.BooleanField(default=False)
    flag_reason     = models.CharField(max_length=255, blank=True)
    balance_after   = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    initiated_at    = models.DateTimeField(default=timezone.now)
    completed_at    = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-initiated_at']
        indexes  = [
            models.Index(fields=['from_account', 'status']),
            models.Index(fields=['to_account', 'status']),
            models.Index(fields=['from_user_id', 'initiated_at']),
        ]

    def __str__(self):
        return f'{self.txn_id} — ₹{self.amount} [{self.status}]'

    def save(self, *args, **kwargs):
        if not self.txn_id:
            from datetime import datetime
            date_str = datetime.now().strftime('%Y%m%d')
            unique   = uuid.uuid4().hex[:8].upper()
            self.txn_id = f'TXN{date_str}{unique}'
        super().save(*args, **kwargs)


class UPITransaction(models.Model):
    """UPI-specific transaction record."""
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction  = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='upi_detail')
    from_vpa     = models.CharField(max_length=100)   # Virtual Payment Address
    to_vpa       = models.CharField(max_length=100)
    upi_ref_id   = models.CharField(max_length=50, unique=True)
    created_at   = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'upi_transactions'


class UPIId(models.Model):
    """User's UPI IDs (VPAs)."""
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id      = models.UUIDField(db_index=True)
    account_id   = models.UUIDField()
    vpa          = models.CharField(max_length=100, unique=True)  # e.g. arjun.ramesh1234@andbank
    is_primary   = models.BooleanField(default=True)
    status       = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at   = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'upi_ids'

    def __str__(self):
        return self.vpa
