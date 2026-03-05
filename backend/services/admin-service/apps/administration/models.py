import uuid
from django.db import models

class AuditLog(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_id       = models.UUIDField()
    target_user_id = models.UUIDField(null=True, blank=True)
    action         = models.CharField(max_length=50)
    detail         = models.JSONField(default=dict)
    ip_address     = models.GenericIPAddressField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
