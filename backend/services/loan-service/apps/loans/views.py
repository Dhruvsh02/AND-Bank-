from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from decimal import Decimal
from .models import LoanApplication

RATES = {'personal':10.5,'home':8.5,'car':9.0,'education':7.5}

class LoanListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
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
    permission_classes = [IsAuthenticated]

    def post(self, request):
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
        return Response({
            'id':           str(loan.id),
            'loan_type':    loan.loan_type,
            'amount':       str(loan.amount),
            'tenure_months':loan.tenure_months,
            'emi_amount':   str(loan.emi_amount),
            'status':       loan.status,
            'created_at':   loan.created_at.isoformat(),
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
