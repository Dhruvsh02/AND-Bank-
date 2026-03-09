import uuid, random, string
from django.db import models
from django.utils import timezone

def generate_card_number():
    # Luhn-valid-looking 16-digit number with 4111 prefix (test range)
    prefix = '4111'
    body   = ''.join(random.choices(string.digits, k=11))
    partial = prefix + body
    # Luhn check digit
    total = 0
    for i, d in enumerate(reversed(partial)):
        n = int(d)
        if i % 2 == 0: n *= 2
        if n > 9:       n -= 9
        total += n
    check = (10 - (total % 10)) % 10
    return partial + str(check)

def generate_cvv():
    return ''.join(random.choices(string.digits, k=3))


class Card(models.Model):
    TYPE_CHOICES    = [('debit','Debit'), ('credit','Credit')]
    STATUS_CHOICES  = [('pending','Pending'), ('active','Active'),
                       ('blocked','Blocked'), ('expired','Expired'), ('rejected','Rejected')]
    NETWORK_CHOICES = [('visa','Visa'), ('mastercard','Mastercard'), ('rupay','RuPay')]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id         = models.UUIDField(db_index=True)
    account_id      = models.UUIDField(null=True, blank=True)
    card_number     = models.CharField(max_length=16, unique=True, default=generate_card_number)
    card_type       = models.CharField(max_length=10, choices=TYPE_CHOICES, default='debit')
    network         = models.CharField(max_length=12, choices=NETWORK_CHOICES, default='visa')
    holder_name     = models.CharField(max_length=100)
    expiry_month    = models.PositiveIntegerField()
    expiry_year     = models.PositiveIntegerField()
    cvv_hash        = models.CharField(max_length=256)          # sha256 of cvv
    status          = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    credit_limit    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    daily_limit     = models.DecimalField(max_digits=12, decimal_places=2, default=50000)
    is_contactless  = models.BooleanField(default=True)
    is_online_enabled = models.BooleanField(default=True)
    is_international  = models.BooleanField(default=False)

    # Credit card application fields
    annual_income   = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    employment_type = models.CharField(max_length=30, blank=True)
    purpose         = models.TextField(blank=True)
    admin_note      = models.TextField(blank=True)

    issued_at       = models.DateTimeField(default=timezone.now)
    activated_at    = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cards'
        ordering = ['-created_at']

    @property
    def expiry(self):
        return f'{self.expiry_month:02d}/{str(self.expiry_year)[-2:]}'

    @property
    def masked_number(self):
        return f'**** **** **** {self.card_number[-4:]}'

    def __str__(self):
        return f'{self.card_type.title()} *{self.card_number[-4:]} ({self.status})'
