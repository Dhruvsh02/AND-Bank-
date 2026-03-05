import uuid, random, string
from django.db import models
from django.utils import timezone

def generate_card_number():
    return ''.join(random.choices(string.digits, k=16))

def generate_cvv():
    return ''.join(random.choices(string.digits, k=3))

class Card(models.Model):
    TYPE_CHOICES   = [('debit','Debit'),('credit','Credit'),('prepaid','Prepaid')]
    STATUS_CHOICES = [('pending','Pending'),('active','Active'),('blocked','Blocked'),('expired','Expired')]
    NETWORK_CHOICES= [('visa','Visa'),('mastercard','Mastercard'),('rupay','RuPay')]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id       = models.UUIDField(db_index=True)
    account_id    = models.UUIDField(null=True, blank=True)
    card_number   = models.CharField(max_length=16, unique=True)
    card_type     = models.CharField(max_length=10, choices=TYPE_CHOICES, default='debit')
    network       = models.CharField(max_length=12, choices=NETWORK_CHOICES, default='visa')
    holder_name   = models.CharField(max_length=100)
    expiry_month  = models.PositiveIntegerField()
    expiry_year   = models.PositiveIntegerField()
    cvv_hash      = models.CharField(max_length=256)
    status        = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    daily_limit   = models.DecimalField(max_digits=12, decimal_places=2, default=50000)
    is_contactless= models.BooleanField(default=True)
    is_online_enabled = models.BooleanField(default=True)
    issued_at     = models.DateTimeField(default=timezone.now)
    activated_at  = models.DateTimeField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cards'
        ordering = ['-created_at']

    @property
    def expiry(self):
        return f'{self.expiry_month:02d}/{str(self.expiry_year)[-2:]}'

    def __str__(self):
        return f'*{self.card_number[-4:]} ({self.status})'
