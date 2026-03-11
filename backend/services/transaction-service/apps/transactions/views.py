import uuid, logging
from decimal import Decimal
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Transaction
import requests as req

logger   = logging.getLogger(__name__)
USER_SVC = 'http://user-service:8002'
INTERNAL = {'X-Service-Token': 'internal-service-secret'}


def get_uid(request):
    return getattr(request, 'user_id', None)


class TransactionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_uid(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        limit    = int(request.query_params.get('limit', 20))
        mode     = request.query_params.get('mode')
        txn_type = request.query_params.get('txn_type')
        from_dt  = request.query_params.get('from_date')
        to_dt    = request.query_params.get('to_date')

        qs = (Transaction.objects.filter(from_user_id=user_id) |
              Transaction.objects.filter(to_user_id=user_id)).order_by('-initiated_at')
        if mode     and mode != 'all':     qs = qs.filter(mode=mode)
        if txn_type and txn_type != 'all': qs = qs.filter(txn_type=txn_type)
        if from_dt: qs = qs.filter(initiated_at__date__gte=from_dt)
        if to_dt:   qs = qs.filter(initiated_at__date__lte=to_dt)

        return Response({'results': [_serialize(t, user_id) for t in qs[:limit]], 'count': qs.count()})


class TransferView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id    = get_uid(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)

        identifier = request.data.get('to_identifier', '').strip()
        amount     = Decimal(str(request.data.get('amount', 0)))
        mode       = request.data.get('mode', 'imps')
        remark     = request.data.get('remark', '')
        mpin       = str(request.data.get('mpin', '')).strip()
        auth_hdr   = request.headers.get('Authorization', '')

        # ── Validate inputs ──────────────────────────────────────
        if not mpin or len(mpin) != 6 or not mpin.isdigit():
            return Response({'detail': 'Valid 6-digit MPIN is required'}, status=400)
        if amount <= 0:
            return Response({'detail': 'Amount must be greater than 0'}, status=400)
        if mode == 'rtgs' and amount < 200000:
            return Response({'detail': 'RTGS minimum amount is ₹2,00,000'}, status=400)
        if not identifier:
            return Response({'detail': 'Recipient account number or UPI ID is required'}, status=400)

        # ── Verify MPIN ──────────────────────────────────────────
        try:
            mr = req.post(
                f'{USER_SVC}/api/accounts/mpin/verify/',
                json={'user_id': str(user_id), 'mpin': mpin},
                headers=INTERNAL, timeout=5,
            )
            if mr.status_code != 200 or not mr.json().get('valid'):
                return Response({'detail': 'Incorrect MPIN. Transaction declined.'}, status=400)
        except Exception as e:
            logger.error(f'MPIN verify failed: {e}')
            return Response({'detail': 'Could not verify MPIN'}, status=503)

        # ── Lookup recipient ─────────────────────────────────────
        try:
            r = req.get(f'{USER_SVC}/api/accounts/lookup/', params={'identifier': identifier},
                        headers=INTERNAL, timeout=5)
            if r.status_code != 200:
                return Response({'detail': 'Recipient not found. Check account number or UPI ID.'}, status=404)
            recipient  = r.json()
            to_user_id = recipient['user_id']
            to_account = recipient['account_number']
            to_name    = recipient.get('name', identifier)
        except Exception as e:
            logger.error(f'Lookup failed: {e}')
            return Response({'detail': 'Could not reach user service'}, status=503)

        if str(to_user_id) == str(user_id):
            return Response({'detail': 'Cannot transfer to your own account'}, status=400)

        # ── Get sender balance ────────────────────────────────────
        try:
            br = req.get(f'{USER_SVC}/api/accounts/balance/',
                         headers={**INTERNAL, 'Authorization': auth_hdr}, timeout=5)
            if br.status_code != 200:
                return Response({'detail': 'Could not verify balance'}, status=503)
            sender_data    = br.json()
            sender_balance = Decimal(str(sender_data.get('balance', 0)))
            from_account   = sender_data.get('account_number', '')
        except Exception as e:
            logger.error(f'Balance fetch failed: {e}')
            return Response({'detail': 'Could not verify balance'}, status=503)

        charges = {'neft': Decimal('2.50'), 'rtgs': Decimal('25'), 'imps': Decimal('5'),
                   'upi': Decimal('0')}.get(mode, Decimal('0'))
        total_debit = amount + charges

        if total_debit > sender_balance:
            return Response({'detail': f'Insufficient balance. Required ₹{total_debit}, Available ₹{sender_balance}'}, status=400)

        # ── Debit sender ──────────────────────────────────────────
        dr = req.post(f'{USER_SVC}/api/accounts/balance/update/',
                      json={'user_id': str(user_id), 'amount': str(total_debit), 'txn_type': 'debit'},
                      headers=INTERNAL, timeout=5)
        if dr.status_code != 200:
            return Response({'detail': dr.json().get('detail', 'Debit failed')}, status=400)

        new_sender_bal = Decimal(str(dr.json()['balance']))

        # ── Credit recipient ──────────────────────────────────────
        req.post(f'{USER_SVC}/api/accounts/balance/update/',
                 json={'user_id': str(to_user_id), 'amount': str(amount), 'txn_type': 'credit'},
                 headers=INTERNAL, timeout=5)

        # ── Record transaction ────────────────────────────────────
        today  = __import__('datetime').date.today().strftime('%Y%m%d')
        txn_id = f"TXN-{today}-{str(uuid.uuid4())[:8].upper()}"

        Transaction.objects.create(
            txn_id=txn_id, from_account=from_account, to_account=to_account,
            from_user_id=user_id, to_user_id=to_user_id,
            amount=amount, charges=charges, txn_type='debit',
            mode=mode, status='completed', remark=remark,
            balance_after=new_sender_bal, completed_at=timezone.now(),
        )
        Transaction.objects.create(
            txn_id=txn_id+'-CR', from_account=from_account, to_account=to_account,
            from_user_id=user_id, to_user_id=to_user_id,
            amount=amount, charges=Decimal('0'), txn_type='credit',
            mode=mode, status='completed', remark=remark,
            balance_after=None, completed_at=timezone.now(),
        )

        logger.info(f'Transfer {txn_id}: {user_id} → {to_user_id} ₹{amount}')
        return Response({
            'txn_id':    txn_id,
            'amount':    str(amount),
            'charges':   str(charges),
            'mode':      mode,
            'status':    'completed',
            'recipient': to_name,
            'to_account': to_account,
            'balance_after': str(new_sender_bal),
        }, status=201)


# ── Razorpay Add Money ────────────────────────────────────────────
class RazorpayCreateOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = get_uid(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)

        amount = int(float(request.data.get('amount', 0)) * 100)  # paise
        if amount < 100:  # min ₹1
            return Response({'detail': 'Minimum amount is ₹1'}, status=400)
        if amount > 10000000:  # max ₹1L
            return Response({'detail': 'Maximum amount is ₹1,00,000'}, status=400)

        try:
            import razorpay
            from django.conf import settings
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
            order = client.order.create({
                'amount':   amount,
                'currency': 'INR',
                'receipt':  f'rcpt_{str(user_id).replace("-","")[:8]}_{uuid.uuid4().hex[:8]}',
                'notes':    {'user_id': str(user_id), 'purpose': 'add_money'},
            })
            return Response({
                'order_id':  order['id'],
                'amount':    amount,
                'currency':  'INR',
                'key_id':    settings.RAZORPAY_KEY_ID,
            })
        except Exception as e:
            logger.error(f'Razorpay order creation failed: {e}')
            return Response({'detail': 'Payment gateway error'}, status=503)


class RazorpayVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = get_uid(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)

        payment_id = request.data.get('razorpay_payment_id', '')
        order_id   = request.data.get('razorpay_order_id', '')
        signature  = request.data.get('razorpay_signature', '')
        amount     = Decimal(str(request.data.get('amount', 0))) / 100  # convert paise → rupees

        try:
            import razorpay, hmac, hashlib
            from django.conf import settings
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
            # Verify signature
            client.utility.verify_payment_signature({
                'razorpay_order_id':   order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature':  signature,
            })
        except Exception as e:
            logger.error(f'Razorpay signature verification failed: {e}')
            return Response({'detail': 'Payment verification failed'}, status=400)

        # Credit account
        try:
            cr = req.post(f'{USER_SVC}/api/accounts/balance/update/',
                          json={'user_id': str(user_id), 'amount': str(amount), 'txn_type': 'credit'},
                          headers=INTERNAL, timeout=5)
            if cr.status_code != 200:
                raise Exception('Balance update failed')
            new_balance = Decimal(str(cr.json()['balance']))
            from_account = cr.json().get('account_number', '')
        except Exception as e:
            logger.error(f'Balance credit failed after Razorpay payment: {e}')
            return Response({'detail': 'Payment received but account credit failed. Contact support.'}, status=500)

        # Record transaction
        today  = __import__('datetime').date.today().strftime('%Y%m%d')
        txn_id = f"ADD-{today}-{str(uuid.uuid4())[:8].upper()}"
        Transaction.objects.create(
            txn_id=txn_id, from_account='RAZORPAY', to_account=from_account,
            from_user_id=user_id, to_user_id=user_id,
            amount=amount, charges=Decimal('0'), txn_type='credit',
            mode='online', status='completed',
            remark=f'Added via Razorpay | {payment_id}',
            balance_after=new_balance, completed_at=timezone.now(),
        )

        logger.info(f'Add money {txn_id}: ₹{amount} credited to {user_id}')
        return Response({'txn_id': txn_id, 'amount': str(amount), 'status': 'completed', 'balance': str(new_balance)})


# ── Stats ─────────────────────────────────────────────────────────
class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_uid(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        from django.db.models import Sum
        from datetime import date
        first = date.today().replace(day=1)
        qs    = (Transaction.objects.filter(from_user_id=user_id) |
                 Transaction.objects.filter(to_user_id=user_id))
        monthly = qs.filter(initiated_at__date__gte=first)
        return Response({
            'total_in':  str(monthly.filter(to_user_id=user_id, status='completed').aggregate(s=Sum('amount'))['s'] or 0),
            'total_out': str(monthly.filter(from_user_id=user_id, txn_type='debit', status='completed').aggregate(s=Sum('amount'))['s'] or 0),
            'txn_count': qs.filter(status='completed').count(),
            'upi_count': qs.filter(mode='upi', status='completed').count(),
        })


# ── Admin views ───────────────────────────────────────────────────
class AdminTransactionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.headers.get('X-Service-Token') != INTERNAL['X-Service-Token']:
            return Response({'detail': 'Forbidden'}, status=403)
        qs   = Transaction.objects.all().order_by('-initiated_at')
        mode = request.query_params.get('mode')
        if mode and mode != 'all': qs = qs.filter(mode=mode)
        return Response({'results': [_serialize(t) for t in qs[:300]]})


class AdminTransactionStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.headers.get('X-Service-Token') != INTERNAL['X-Service-Token']:
            return Response({'detail': 'Forbidden'}, status=403)
        from django.db.models import Sum
        return Response({
            'total':    Transaction.objects.count(),
            'completed':Transaction.objects.filter(status='completed').count(),
            'failed':   Transaction.objects.filter(status='failed').count(),
            'flagged':  Transaction.objects.filter(is_flagged=True).count(),
            'volume':   str(Transaction.objects.filter(status='completed', txn_type='debit').aggregate(s=Sum('amount'))['s'] or 0),
        })


class AdminUserTransactionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        if request.headers.get('X-Service-Token') != INTERNAL['X-Service-Token']:
            return Response({'detail': 'Forbidden'}, status=403)
        qs = (Transaction.objects.filter(from_user_id=user_id) |
              Transaction.objects.filter(to_user_id=user_id)).order_by('-initiated_at')
        return Response({'results': [_serialize(t) for t in qs[:100]]})


class AdminFlagTransactionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, txn_id):
        if request.headers.get('X-Service-Token') != INTERNAL['X-Service-Token']:
            return Response({'detail': 'Forbidden'}, status=403)
        try:
            txn = Transaction.objects.get(txn_id=txn_id)
            txn.is_flagged  = True
            txn.flag_reason = request.data.get('reason', '')
            txn.status      = 'flagged'
            txn.save()
            return Response({'detail': 'Transaction flagged'})
        except Transaction.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


def _serialize(t, viewer_uid=None):
    return {
        'id':           str(t.id),
        'txn_id':       t.txn_id,
        'amount':       str(t.amount),
        'charges':      str(t.charges),
        'txn_type':     t.txn_type,
        'mode':         t.mode,
        'status':       t.status,
        'remark':       t.remark,
        'is_flagged':   t.is_flagged,
        'from_account': t.from_account,
        'to_account':   t.to_account,
        'from_user_id': str(t.from_user_id),
        'to_user_id':   str(t.to_user_id) if t.to_user_id else None,
        'balance_after':str(t.balance_after or 0),
        'initiated_at': t.initiated_at.isoformat(),
        'completed_at': t.completed_at.isoformat() if t.completed_at else None,
    }
