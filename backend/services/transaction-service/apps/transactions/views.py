import uuid, logging
from decimal import Decimal
from django.core.cache import cache
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Transaction

logger = logging.getLogger(__name__)


class TransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id  = request.user_id
        limit    = int(request.query_params.get('limit', 20))
        mode     = request.query_params.get('mode')
        txn_type = request.query_params.get('txn_type')
        from_dt  = request.query_params.get('from_date')
        to_dt    = request.query_params.get('to_date')

        qs = Transaction.objects.filter(from_user_id=user_id) | Transaction.objects.filter(to_user_id=user_id)
        qs = qs.order_by('-initiated_at')

        if mode     and mode != 'all':     qs = qs.filter(mode=mode)
        if txn_type and txn_type != 'all': qs = qs.filter(txn_type=txn_type)
        if from_dt:  qs = qs.filter(initiated_at__date__gte=from_dt)
        if to_dt:    qs = qs.filter(initiated_at__date__lte=to_dt)

        txns = qs[:limit]
        data = [{
            'id':           str(t.id),
            'txn_id':       t.txn_id,
            'amount':       str(t.amount),
            'txn_type':     t.txn_type,
            'mode':         t.mode,
            'status':       t.status,
            'remark':       t.remark,
            'initiated_at': t.initiated_at.isoformat(),
            'balance_after':str(t.balance_after or 0),
        } for t in txns]

        return Response({'results': data, 'count': len(data)})


class TransferView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id    = request.user_id
        identifier = request.data.get('to_identifier', '').strip()
        amount     = Decimal(str(request.data.get('amount', 0)))
        mode       = request.data.get('mode', 'imps')
        remark     = request.data.get('remark', '')

        if amount <= 0:
            return Response({'detail': 'Amount must be greater than 0'}, status=400)

        # Lookup recipient account via user-service
        import requests as req
        try:
            r = req.get(
                f"http://user-service:8002/api/accounts/lookup/",
                params={'identifier': identifier},
                headers={'X-Service-Token': 'internal-service-secret'},
                timeout=5,
            )
            if r.status_code != 200:
                return Response({'detail': 'Recipient not found'}, status=404)
            recipient = r.json()
            to_user_id = recipient['user_id']
            to_account = recipient['account_number']
        except Exception as e:
            return Response({'detail': 'Could not reach user service'}, status=503)

        if str(to_user_id) == str(user_id):
            return Response({'detail': 'Cannot transfer to your own account'}, status=400)

        # Get sender balance
        try:
            br = req.get(
                f"http://user-service:8002/api/accounts/balance/",
                headers={'Authorization': request.headers.get('Authorization'), 'X-Service-Token': 'internal-service-secret'},
                timeout=5,
            )
            sender_balance = Decimal(str(br.json().get('balance', 0)))
        except:
            return Response({'detail': 'Could not verify balance'}, status=503)

        if amount > sender_balance:
            return Response({'detail': 'Insufficient balance'}, status=400)

        # Create transaction record
        txn_id = f"TXN-{__import__('datetime').date.today().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        txn = Transaction.objects.create(
            txn_id      = txn_id,
            from_user_id= user_id,
            to_user_id  = to_user_id,
            amount      = amount,
            txn_type    = 'debit',
            mode        = mode,
            status      = 'completed',
            remark      = remark,
            balance_after = sender_balance - amount,
        )

        logger.info(f"Transfer {txn_id}: {user_id} → {to_user_id} ₹{amount} via {mode}")
        return Response({
            'txn_id':  txn_id,
            'amount':  str(amount),
            'mode':    mode,
            'status': 'completed',
        }, status=201)
