import uuid
from django.db import models
from django.utils import timezone

class ChatMessage(models.Model):
    ROLE_CHOICES = [('user','user'),('assistant','assistant')]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id    = models.UUIDField(db_index=True)
    session_id = models.UUIDField(db_index=True)
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content    = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
