import logging
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import AuditLog

logger  = logging.getLogger(__name__)
INTERNAL= {'X-Service-Token': 'internal-service-secret'}
AUTH    = 'http://auth-service:8001'
USER    = 'http://user-service:8002'
TXN     = 'http://transaction-service:8003'
LOAN    = 'http://loan-service:8004'
CARD    = 'http://card-service:8005'

def get_admin_id(request):
    return getattr(request, 'user_id', None)

def proxy(method, url, **kwargs):
    try:
        r = getattr(requests, method)(url, headers=INTERNAL, timeout=8, **kwargs)
        return r.json(), r.status_code
    except Exception as e:
        logger.error(f'Proxy {method.upper()} {url} failed: {e}')
        return {'detail': 'Service unavailable'}, 503

def log_action(admin_id, action, target=None, detail=None, ip=None):
    try:
        AuditLog.objects.create(
            admin_id=admin_id, action=action,
            target_user_id=target, detail=detail or {},
            ip_address=ip,
        )
    except Exception: pass


class AdminDashboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        users, _ = proxy('get', f'{AUTH}/api/auth/admin/users/stats/')
        txns,  _ = proxy('get', f'{TXN}/api/transactions/admin/stats/')
        loans, _ = proxy('get', f'{LOAN}/api/loans/admin/stats/')
        return Response({'users': users, 'transactions': txns, 'loans': loans, 'audit_logs': AuditLog.objects.count()})


class AdminUserListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data, code = proxy('get', f'{AUTH}/api/auth/admin/users/', params=request.query_params)
        return Response(data, status=code)


class AdminUserDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        user, _  = proxy('get', f'{AUTH}/api/auth/admin/users/{user_id}/')
        accts, _ = proxy('get', f'{USER}/api/accounts/admin/{user_id}/')
        txns, _  = proxy('get', f'{TXN}/api/transactions/admin/user/{user_id}/')
        return Response({'user': user, 'accounts': accts, 'transactions': txns})


class AdminUserActionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, user_id):
        data, code = proxy('post', f'{AUTH}/api/auth/admin/users/{user_id}/action/', json=request.data)
        if code < 300:
            log_action(get_admin_id(request), f'{request.data.get("action")}_user',
                       target=user_id, detail=request.data,
                       ip=request.META.get('REMOTE_ADDR'))
        return Response(data, status=code)


class AdminTransactionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data, code = proxy('get', f'{TXN}/api/transactions/admin/all/', params=request.query_params)
        return Response(data, status=code)


class AdminFlagTransactionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, txn_id):
        data, code = proxy('post', f'{TXN}/api/transactions/admin/{txn_id}/flag/', json=request.data)
        if code < 300:
            log_action(get_admin_id(request), 'flag_transaction',
                       detail={'txn_id': txn_id}, ip=request.META.get('REMOTE_ADDR'))
        return Response(data, status=code)


class AdminLoanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data, code = proxy('get', f'{LOAN}/api/loans/admin/all/', params=request.query_params)
        return Response(data, status=code)


class AdminLoanActionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, loan_id):
        data, code = proxy('post', f'{LOAN}/api/loans/admin/{loan_id}/action/', json=request.data)
        if code < 300:
            log_action(get_admin_id(request), f'{request.data.get("action")}_loan',
                       detail={'loan_id': str(loan_id)}, ip=request.META.get('REMOTE_ADDR'))
        return Response(data, status=code)


class AdminCardListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data, code = proxy('get', f'{CARD}/api/cards/admin/all/', params=request.query_params)
        return Response(data, status=code)


class AdminCardApproveView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, card_id):
        # Support both approve action and legacy approve endpoint
        payload = request.data if request.data else {'action': 'approve', 'credit_limit': 50000}
        if 'action' not in payload:
            payload = {'action': 'approve', 'credit_limit': payload.get('credit_limit', 50000)}
        data, code = proxy('post', f'{CARD}/api/cards/admin/{card_id}/action/', json=payload)
        if code < 300:
            log_action(get_admin_id(request), 'approve_card',
                       detail={'card_id': str(card_id)}, ip=request.META.get('REMOTE_ADDR'))
        return Response(data, status=code)


class AdminAuditLogView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        logs = AuditLog.objects.all()[:100]
        data = [{
            'id': str(l.id), 'action': l.action,
            'target_user_id': str(l.target_user_id) if l.target_user_id else None,
            'detail': l.detail, 'ip_address': l.ip_address,
            'created_at': l.created_at.isoformat(),
        } for l in logs]
        return Response({'results': data})
