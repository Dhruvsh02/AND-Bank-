import uuid
from django.db import models
from django.utils import timezone

class Notification(models.Model):
    TYPE_CHOICES   = [('email','Email'),('sms','SMS'),('push','Push')]
    STATUS_CHOICES = [('pending','Pending'),('sent','Sent'),('failed','Failed')]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id    = models.UUIDField(db_index=True)
    notif_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='email')
    subject    = models.CharField(max_length=200, blank=True)
    body       = models.TextField()
    recipient  = models.CharField(max_length=200)
    status     = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    sent_at    = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
