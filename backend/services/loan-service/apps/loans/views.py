from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from decimal import Decimal
import logging, requests as _req
from .models import LoanApplication

logger   = logging.getLogger(__name__)
_NOTIF   = 'http://notification-service:8006'
_USER    = 'http://user-service:8002'
_HEADERS = {'X-Service-Token': 'internal-service-secret'}

def _get_profile(user_id=None, auth_hdr=None):
    """Fetch user profile — by user_id (internal) or by JWT (user request)."""
    try:
        headers = {**_HEADERS}
        if user_id:   headers['X-User-Id'] = str(user_id)
        if auth_hdr:  headers['Authorization'] = auth_hdr
        r = _req.get(f'{_USER}/api/users/profile/', headers=headers, timeout=3)
        return r.json() if r.status_code == 200 else {}
    except Exception as e:
        logger.warning(f'Profile fetch failed: {e}')
        return {}

def _notify(path, data):
    try:
        _req.post(f'{_NOTIF}/api/notifications/{path}', json=data, headers=_HEADERS, timeout=4)
    except Exception as e:
        logger.warning(f'Notification skipped ({path}): {e}')

RATES = {'personal':10.5,'home':8.5,'car':9.0,'education':7.5}

class LoanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not getattr(request, 'user_id', None):
            return Response({'detail': 'Unauthorized'}, status=401)
        loans = LoanApplication.objects.filter(user_id=request.user_id)
        data  = [{
            'id':           str(l.id),
            'loan_type':    l.loan_type,
            'amount':       str(l.amount),
            'tenure_months':l.tenure_months,
            'status':       l.status,
            'interest_rate':str(l.interest_rate),
            'emi_amount':   str(l.emi_amount or 0),
            'created_at':   l.created_at.isoformat(),
        } for l in loans]
        return Response({'results': data})


class LoanApplyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not getattr(request, 'user_id', None):
            return Response({'detail': 'Unauthorized'}, status=401)
        loan_type = request.data.get('loan_type', 'personal')
        amount    = Decimal(str(request.data.get('amount', 0)))
        tenure    = int(request.data.get('tenure_months', 12))
        purpose   = request.data.get('purpose', '')

        if amount <= 0: return Response({'detail':'Invalid amount'}, status=400)
        if not purpose: return Response({'detail':'Purpose is required'}, status=400)

        rate = RATES.get(loan_type, 10.5)
        r    = rate / 100 / 12
        emi  = float(amount) * r * (1+r)**tenure / ((1+r)**tenure - 1)

        loan = LoanApplication.objects.create(
            user_id       = request.user_id,
            loan_type     = loan_type,
            amount        = amount,
            tenure_months = tenure,
            purpose       = purpose,
            interest_rate = rate,
            emi_amount    = round(emi, 2),
        )
        profile = _get_profile(auth_hdr=request.headers.get('Authorization', ''))
        applicant_name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or 'Applicant'
        _notify('loan/apply/',{
            'applicant_name': applicant_name,
            'loan_type': loan.loan_type,
            'amount': str(loan.amount),
            'tenure_months': loan.tenure_months,
            'loan_id': str(loan.id),
        })
        _notify('loan/decision/', {
            'user_id': str(request.user_id),
            'email': profile.get('email', ''),
            'name': applicant_name,
            'loan_type': loan.loan_type,
            'amount': str(loan.amount),
            'action': 'received',
        })
        return Response({
            'id': str(loan.id),
            'loan_type': loan.loan_type,
            'amount': str(loan.amount),
            'tenure_months': loan.tenure_months,
            'status': loan.status,
            'emi_amount': str(loan.emi_amount or 0),
            'created_at': loan.created_at.isoformat(),
        }, status=201)  


class AdminLoanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.headers.get('X-Service-Token') != 'internal-service-secret':
            return Response({'detail': 'Forbidden'}, status=403)
        status_filter = request.query_params.get('status')
        qs = LoanApplication.objects.all()
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)
        data = [{
            'id': str(l.id), 'user_id': str(l.user_id), 'loan_type': l.loan_type,
            'amount': str(l.amount), 'tenure_months': l.tenure_months,
            'status': l.status, 'interest_rate': str(l.interest_rate),
            'emi_amount': str(l.emi_amount or 0), 'purpose': l.purpose,
            'created_at': l.created_at.isoformat(),
        } for l in qs[:200]]
        return Response({'results': data})


class AdminLoanActionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, loan_id):
        if request.headers.get('X-Service-Token') != 'internal-service-secret':
            return Response({'detail': 'Forbidden'}, status=403)
        try:
            loan   = LoanApplication.objects.get(id=loan_id)
            action = request.data.get('action')
            if action == 'approve':
                loan.status      = 'approved'
                loan.approved_by = request.data.get('admin_id')
            elif action == 'reject':
                loan.status           = 'rejected'
                loan.rejection_reason = request.data.get('reason', '')
            else:
                return Response({'detail': 'Invalid action'}, status=400)
            loan.save()
            profile = _get_profile(user_id=loan.user_id)
            _notify('loan/decision/', {
                'user_id': str(loan.user_id),
                'email': profile.get('email', ''),
                'name': f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or 'Customer',
                'loan_type': loan.loan_type,
                'amount': str(loan.amount),
                'action': 'approved' if action == 'approve' else 'rejected',
                'admin_note': request.data.get('reason', '') if action=='reject' else '',
                'emi_amount': str(loan.emi_amount or 0) if action=='approve' else '',
                'interest_rate': str(loan.interest_rate) if action=='approve' else '',
            })
            return Response({'detail': f'Loan {action}d', 'status': loan.status})
        except LoanApplication.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


class AdminLoanStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.headers.get('X-Service-Token') != 'internal-service-secret':
            return Response({'detail': 'Forbidden'}, status=403)
        return Response({
            'total':    LoanApplication.objects.count(),
            'pending':  LoanApplication.objects.filter(status='pending').count(),
            'approved': LoanApplication.objects.filter(status='approved').count(),
            'rejected': LoanApplication.objects.filter(status='rejected').count(),
        })
