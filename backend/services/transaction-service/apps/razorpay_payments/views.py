import razorpay, hmac, hashlib, json, uuid
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import requests as req

_rzp_client = None

def get_client():
    global _rzp_client
    if _rzp_client is None:
        _rzp_client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
    return _rzp_client

INTERNAL = {'X-Service-Token': 'internal-service-secret'}
USER_SVC  = 'http://user-service:8002'

def get_uid(request):
    return getattr(request, 'user_id', None)


class CreateOrderView(APIView):
    """POST /api/transactions/razorpay/create-order/"""
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = get_uid(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)

        amount = int(float(request.data.get('amount', 0)) * 100)  # paise
        if amount < 100:
            return Response({'detail': 'Minimum deposit is ₹1'}, status=400)
        if amount > 10_000_00:
            return Response({'detail': 'Maximum deposit is ₹1,00,000'}, status=400)

        order = get_client().order.create({
            'amount':   amount,
            'currency': 'INR',
            'receipt':  f'deposit_{user_id}_{uuid.uuid4().hex[:8]}',
            'notes': {
                'user_id': str(user_id),
                'purpose': 'account_deposit',
            }
        })

        return Response({
            'order_id':  order['id'],
            'amount':    amount,
            'currency':  'INR',
            'key_id':    settings.RAZORPAY_KEY_ID,
        })


class VerifyPaymentView(APIView):
    """POST /api/transactions/razorpay/verify/"""
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = get_uid(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)

        order_id   = request.data.get('razorpay_order_id', '')
        payment_id = request.data.get('razorpay_payment_id', '')
        signature  = request.data.get('razorpay_signature', '')
        amount     = request.data.get('amount', 0)  # in paise

        # Verify signature
        msg    = f'{order_id}|{payment_id}'.encode()
        secret = settings.RAZORPAY_KEY_SECRET.encode()
        expected = hmac.new(secret, msg, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected, signature):
            return Response({'detail': 'Invalid payment signature'}, status=400)

        # Credit user account
        rupees = float(amount) / 100
        try:
            r = req.post(
                f'{USER_SVC}/api/accounts/credit/',
                json={'user_id': str(user_id), 'amount': str(rupees), 'txn_type': 'credit'},
                headers=INTERNAL,
                timeout=5,
            )
            if r.status_code != 200:
                return Response({'detail': 'Account credit failed'}, status=500)
        except Exception as e:
            return Response({'detail': f'User service error: {e}'}, status=503)

        return Response({
            'success':    True,
            'payment_id': payment_id,
            'amount':     rupees,
            'message':    f'₹{rupees:,.2f} added to your account',
        })


class WebhookView(APIView):
    """POST /api/transactions/razorpay/webhook/
    Called by Razorpay server — no JWT, verify via webhook secret instead.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        signature      = request.headers.get('X-Razorpay-Signature', '')
        body           = request.body

        expected = hmac.new(
            webhook_secret.encode(), body, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            return Response({'detail': 'Invalid signature'}, status=400)

        event   = json.loads(body)
        ev_type = event.get('event')

        if ev_type == 'payment.captured':
            payment = event['payload']['payment']['entity']
            user_id = payment['notes'].get('user_id')
            amount  = payment['amount'] / 100

            if user_id:
                req.post(
                    f'{USER_SVC}/api/accounts/credit/',
                    json={'user_id': user_id, 'amount': str(amount), 'txn_type': 'credit'},
                    headers=INTERNAL,
                    timeout=5,
                )

        return Response({'status': 'ok'})