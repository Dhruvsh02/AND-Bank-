import uuid
from django.db import models

class LoanApplication(models.Model):
    STATUS = [('pending','pending'),('approved','approved'),('rejected','rejected'),('disbursed','disbursed'),('closed','closed')]
    TYPES  = [('personal','personal'),('home','home'),('car','car'),('education','education')]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id         = models.UUIDField()
    loan_type       = models.CharField(max_length=20, choices=TYPES, default='personal')
    amount          = models.DecimalField(max_digits=14, decimal_places=2)
    tenure_months   = models.IntegerField(default=12)
    purpose         = models.TextField()
    status          = models.CharField(max_length=20, choices=STATUS, default='pending')
    interest_rate   = models.DecimalField(max_digits=5, decimal_places=2, default=10.5)
    emi_amount      = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    approved_by     = models.UUIDField(null=True, blank=True)
    rejection_reason= models.TextField(blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
