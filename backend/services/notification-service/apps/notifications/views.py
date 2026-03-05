import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Notification

logger = logging.getLogger(__name__)
INTERNAL = 'internal-service-secret'

def is_internal(request):
    return request.headers.get('X-Service-Token') == INTERNAL

class WelcomeNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)
        user_id = request.data.get('user_id')
        email   = request.data.get('email')
        name    = request.data.get('name', 'Customer')

        notif = Notification.objects.create(
            user_id   = user_id,
            notif_type= 'email',
            subject   = 'Welcome to AND Bank!',
            body      = f'Dear {name}, welcome to AND Bank. Your account is ready.',
            recipient = email,
            status    = 'sent',
            sent_at   = timezone.now(),
        )
        logger.info(f'Welcome notification sent to {email}')
        return Response({'detail': 'sent', 'id': str(notif.id)})

class TransactionNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)
        user_id = request.data.get('user_id')
        email   = request.data.get('email')
        amount  = request.data.get('amount')
        txn_type= request.data.get('txn_type', 'debit')
        txn_id  = request.data.get('txn_id', '')

        action = 'debited from' if txn_type == 'debit' else 'credited to'
        notif  = Notification.objects.create(
            user_id   = user_id,
            notif_type= 'email',
            subject   = f'AND Bank — Transaction Alert: ₹{amount} {txn_type.capitalize()}',
            body      = f'₹{amount} has been {action} your account. TXN ID: {txn_id}.',
            recipient = email,
            status    = 'sent',
            sent_at   = timezone.now(),
        )
        return Response({'detail': 'sent', 'id': str(notif.id)})
