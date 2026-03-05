import hashlib, uuid
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Card, generate_card_number

INTERNAL = 'internal-service-secret'

def get_user_id(request):
    return getattr(request, 'user_id', None) or request.headers.get('X-User-Id')

def is_internal(request):
    return request.headers.get('X-Service-Token') == INTERNAL

class CardListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        cards = Card.objects.filter(user_id=user_id)
        data  = [self._serialize(c) for c in cards]
        return Response({'results': data})

    def post(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        if Card.objects.filter(user_id=user_id, status__in=['active','pending']).count() >= 3:
            return Response({'detail': 'Maximum 3 active cards allowed'}, status=400)

        import datetime
        now = datetime.datetime.now()
        card = Card.objects.create(
            user_id      = user_id,
            card_number  = generate_card_number(),
            card_type    = request.data.get('card_type', 'debit'),
            network      = request.data.get('network', 'visa'),
            holder_name  = request.data.get('holder_name', 'Card Holder'),
            expiry_month = now.month,
            expiry_year  = now.year + 5,
            cvv_hash     = hashlib.sha256(b'000').hexdigest(),
            status       = 'pending',
        )
        return Response(self._serialize(card), status=201)

    def _serialize(self, c):
        return {
            'id': str(c.id), 'card_number': c.card_number, 'card_type': c.card_type,
            'network': c.network, 'holder_name': c.holder_name, 'expiry': c.expiry,
            'status': c.status, 'daily_limit': str(c.daily_limit),
            'is_contactless': c.is_contactless, 'is_online_enabled': c.is_online_enabled,
            'issued_at': c.issued_at.isoformat(),
        }

class AdminCardListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)
        cards = Card.objects.all().order_by('-created_at')[:200]
        data  = [{
            'id': str(c.id), 'user_id': str(c.user_id), 'card_number': c.card_number,
            'holder_name': c.holder_name, 'card_type': c.card_type,
            'expiry': c.expiry, 'status': c.status, 'created_at': c.created_at.isoformat(),
        } for c in cards]
        return Response({'results': data})

class AdminCardApproveView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, card_id):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)
        try:
            card = Card.objects.get(id=card_id)
            card.status       = 'active'
            card.activated_at = timezone.now()
            card.save()
            return Response({'detail': 'Card activated'})
        except Card.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
