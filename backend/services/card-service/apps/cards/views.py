import hashlib, datetime, logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Card, generate_card_number, generate_cvv

logger  = logging.getLogger(__name__)
INTERNAL = 'internal-service-secret'

def get_uid(request):
    return getattr(request, 'user_id', None)

def is_internal(request):
    return request.headers.get('X-Service-Token') == INTERNAL

def is_admin(request):
    return getattr(request, 'user_role', None) == 'admin'

def serialize(c, show_full=False):
    return {
        'id':               str(c.id),
        'card_number':      c.card_number if show_full else c.masked_number,
        'card_number_last4':c.card_number[-4:],
        'card_type':        c.card_type,
        'network':          c.network,
        'holder_name':      c.holder_name,
        'expiry':           c.expiry,
        'expiry_month':     c.expiry_month,
        'expiry_year':      c.expiry_year,
        'status':           c.status,
        'credit_limit':     str(c.credit_limit),
        'daily_limit':      str(c.daily_limit),
        'is_contactless':   c.is_contactless,
        'is_online_enabled':c.is_online_enabled,
        'is_international': c.is_international,
        'annual_income':    str(c.annual_income) if c.annual_income else None,
        'employment_type':  c.employment_type,
        'purpose':          c.purpose,
        'admin_note':       c.admin_note,
        'issued_at':        c.issued_at.isoformat(),
        'activated_at':     c.activated_at.isoformat() if c.activated_at else None,
        'created_at':       c.created_at.isoformat(),
    }


# ─── User: List cards / Apply for credit card ────────────────────
class CardListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        uid = get_uid(request)
        if not uid:
            return Response({'detail': 'Unauthorized'}, status=401)
        cards = Card.objects.filter(user_id=uid)
        return Response({'results': [serialize(c) for c in cards]})

    def post(self, request):
        """Apply for a credit card"""
        uid = get_uid(request)
        if not uid:
            return Response({'detail': 'Unauthorized'}, status=401)

        card_type = request.data.get('card_type', 'credit')
        if card_type != 'credit':
            return Response({'detail': 'Only credit card applications via this endpoint'}, status=400)

        # Check existing pending/active credit cards
        if Card.objects.filter(user_id=uid, card_type='credit',
                               status__in=['pending','active']).exists():
            return Response({'detail': 'You already have a credit card or a pending application'}, status=400)

        annual_income   = request.data.get('annual_income')
        employment_type = request.data.get('employment_type', '')
        purpose         = request.data.get('purpose', '')
        holder_name     = request.data.get('holder_name', 'Card Holder')

        if not annual_income:
            return Response({'detail': 'Annual income is required'}, status=400)

        now = datetime.datetime.now()
        cvv = generate_cvv()

        card = Card.objects.create(
            user_id         = uid,
            card_type       = 'credit',
            network         = 'visa',
            holder_name     = holder_name,
            expiry_month    = now.month,
            expiry_year     = now.year + 5,
            cvv_hash        = hashlib.sha256(cvv.encode()).hexdigest(),
            status          = 'pending',
            annual_income   = annual_income,
            employment_type = employment_type,
            purpose         = purpose,
            credit_limit    = 0,  # set by admin on approval
        )
        return Response({'detail': 'Credit card application submitted', 'card': serialize(card)}, status=201)


# ─── User: Toggle card settings ──────────────────────────────────
class CardSettingsView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, card_id):
        uid = get_uid(request)
        if not uid:
            return Response({'detail': 'Unauthorized'}, status=401)
        try:
            card = Card.objects.get(id=card_id, user_id=uid)
        except Card.DoesNotExist:
            return Response({'detail': 'Card not found'}, status=404)

        if card.status != 'active':
            return Response({'detail': 'Card is not active'}, status=400)

        allowed = ['is_contactless', 'is_online_enabled', 'is_international']
        for field in allowed:
            if field in request.data:
                setattr(card, field, request.data[field])
        card.save()
        return Response(serialize(card))

    def post(self, request, card_id):
        """Block / Unblock card"""
        uid = get_uid(request)
        if not uid:
            return Response({'detail': 'Unauthorized'}, status=401)
        try:
            card = Card.objects.get(id=card_id, user_id=uid)
        except Card.DoesNotExist:
            return Response({'detail': 'Card not found'}, status=404)

        action = request.data.get('action')
        if action == 'block' and card.status == 'active':
            card.status = 'blocked'
            card.save()
            return Response({'detail': 'Card blocked', 'card': serialize(card)})
        elif action == 'unblock' and card.status == 'blocked':
            card.status = 'active'
            card.save()
            return Response({'detail': 'Card unblocked', 'card': serialize(card)})
        return Response({'detail': 'Invalid action or card state'}, status=400)


# ─── Internal: Auto-create debit card when account opens ─────────
class InternalCreateDebitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)

        uid         = request.data.get('user_id')
        holder_name = request.data.get('holder_name', 'Card Holder')
        account_id  = request.data.get('account_id')

        if not uid:
            return Response({'detail': 'user_id required'}, status=400)

        if Card.objects.filter(user_id=uid, card_type='debit',
                               status__in=['active','pending']).exists():
            return Response({'detail': 'Debit card already exists'})

        now = datetime.datetime.now()
        cvv = generate_cvv()
        card = Card.objects.create(
            user_id      = uid,
            account_id   = account_id,
            card_type    = 'debit',
            network      = 'rupay',
            holder_name  = holder_name,
            expiry_month = now.month,
            expiry_year  = now.year + 3,
            cvv_hash     = hashlib.sha256(cvv.encode()).hexdigest(),
            status       = 'active',   # debit card is active immediately
            daily_limit  = 50000,
            activated_at = timezone.now(),
        )
        return Response({'detail': 'Debit card created', 'card': serialize(card)}, status=201)


# ─── Admin: List all card applications ───────────────────────────
class AdminCardListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        uid = get_uid(request)
        if not (is_admin(request) or is_internal(request)):
            return Response({'detail': 'Forbidden'}, status=403)

        card_type = request.query_params.get('card_type')
        status    = request.query_params.get('status', 'pending')
        qs        = Card.objects.all()
        if card_type: qs = qs.filter(card_type=card_type)
        if status and status != 'all': qs = qs.filter(status=status)

        return Response({'results': [serialize(c) for c in qs[:200]]})


# ─── Admin: Approve / Reject credit card ─────────────────────────
class AdminCardActionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, card_id):
        if not (is_admin(request) or is_internal(request)):
            return Response({'detail': 'Forbidden'}, status=403)
        try:
            card = Card.objects.get(id=card_id, card_type='credit')
        except Card.DoesNotExist:
            return Response({'detail': 'Card not found'}, status=404)

        action       = request.data.get('action')           # 'approve' | 'reject'
        credit_limit = request.data.get('credit_limit', 50000)
        admin_note   = request.data.get('admin_note', '')

        if action == 'approve':
            card.status       = 'active'
            card.activated_at = timezone.now()
            card.credit_limit = credit_limit
            card.admin_note   = admin_note
            card.save()
            return Response({'detail': f'Credit card approved with limit ₹{credit_limit}', 'card': serialize(card)})

        elif action == 'reject':
            card.status     = 'rejected'
            card.admin_note = admin_note
            card.save()
            return Response({'detail': 'Credit card application rejected', 'card': serialize(card)})

        return Response({'detail': 'Invalid action'}, status=400)
