import logging
import decimal
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import BankAccount, KYCDetail, UserProfile, generate_upi_id

logger = logging.getLogger(__name__)
INTERNAL = 'internal-service-secret'

def is_internal(request):
    return request.headers.get('X-Service-Token') == INTERNAL

def get_user_id(request):
    return getattr(request, 'user_id', None)


class BalanceView(APIView):
    """GET /api/accounts/balance/ — returns balance for logged-in user"""
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_user_id(request) or request.headers.get('X-User-Id')
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        try:
            acct = BankAccount.objects.get(user_id=user_id, status='active', is_primary=True)
        except BankAccount.DoesNotExist:
            try:
                acct = BankAccount.objects.filter(user_id=user_id, status='active').first()
                if not acct:
                    return Response({'detail': 'No account found'}, status=404)
            except Exception:
                return Response({'detail': 'No account found'}, status=404)

        return Response({
            'account_number': acct.account_number,
            'account_type':   acct.account_type,
            'balance':        str(acct.balance),
            'upi_id':         acct.upi_id,
            'ifsc_code':      acct.ifsc_code,
            'status':         acct.status,
            'interest_rate':  str(acct.interest_rate),
        })


class AccountLookupView(APIView):
    """GET /api/accounts/lookup/?identifier=... — find account by number or UPI ID"""
    permission_classes = [AllowAny]

    def get(self, request):
        identifier = request.query_params.get('identifier', '').strip()
        if not identifier:
            return Response({'detail': 'identifier is required'}, status=400)
        try:
            if '@andbank' in identifier.lower():
                acct = BankAccount.objects.get(upi_id__iexact=identifier, status='active')
            else:
                acct = BankAccount.objects.get(account_number=identifier, status='active')
            return Response({
                'user_id':        str(acct.user_id),
                'account_number': acct.account_number,
                'upi_id':         acct.upi_id,
                'account_type':   acct.account_type,
                'balance':        str(acct.balance),
            })
        except BankAccount.DoesNotExist:
            return Response({'detail': 'Account not found'}, status=404)


class AccountCreateView(APIView):
    """POST /api/accounts/create/ — internal, create account for new user"""
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)

        user_id      = request.data.get('user_id')
        account_type = request.data.get('account_type', 'savings')
        first_name   = request.data.get('first_name', '')
        last_name    = request.data.get('last_name', '')
        email        = request.data.get('email', '')
        phone        = request.data.get('phone', '')
        kyc_data     = request.data.get('kyc_data', {})

        if not user_id:
            return Response({'detail': 'user_id is required'}, status=400)

        # Idempotent — return existing if already created
        existing = BankAccount.objects.filter(user_id=user_id).first()
        if existing:
            return Response({
                'account_number': existing.account_number,
                'upi_id':         existing.upi_id,
                'message':        'Account already exists',
            })

        # Create bank account
        acct = BankAccount(
            user_id=user_id,
            account_type=account_type,
            branch=DEFAULT_BRANCH,
            ifsc_code=BRANCH_IFSC_MAP[DEFAULT_BRANCH],
        )
        acct.save()  # triggers auto account_number generation

        # Set UPI ID
        acct.upi_id = generate_upi_id(first_name, last_name, acct.account_number)
        acct.save(update_fields=['upi_id'])

        # Save profile
        UserProfile.objects.get_or_create(
            user_id=user_id,
            defaults={'first_name': first_name, 'last_name': last_name,
                      'email': email, 'phone': phone}
        )

        # Save KYC
        if kyc_data:
            try:
                from datetime import date
                dob = kyc_data.get('date_of_birth', '1990-01-01')
                if isinstance(dob, str):
                    from datetime import datetime
                    dob = datetime.strptime(dob, '%Y-%m-%d').date()
                KYCDetail.objects.get_or_create(
                    user_id=user_id,
                    defaults={
                        'pan_number':    kyc_data.get('pan_number', ''),
                        'aadhar_number': kyc_data.get('aadhar_number', ''),
                        'date_of_birth': dob,
                        'address':       kyc_data.get('address', ''),
                        'verification_status': 'verified',
                        'verified_at': timezone.now(),
                    }
                )
            except Exception as e:
                logger.warning(f'KYC save failed: {e}')

        # Auto-create debit card via card-service
        try:
            import requests as _req
            _req.post(
                'http://card-service:8005/api/cards/internal/create-debit/',
                json={'user_id': str(user_id), 'account_id': str(acct.id),
                      'holder_name': f'{first_name} {last_name}'.strip().upper()},
                headers={'X-Service-Token': 'internal-service-secret'},
                timeout=5,
            )
        except Exception as _e:
            logger.warning(f'Debit card auto-create failed: {_e}')

        logger.info(f'Account created: {acct.account_number} for user {user_id}')
        return Response({
            'account_number': acct.account_number,
            'upi_id':         acct.upi_id,
            'account_type':   acct.account_type,
        }, status=201)


class BalanceUpdateView(APIView):
    """POST /api/accounts/balance/update/ — internal, debit or credit"""
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)

        user_id    = request.data.get('user_id')
        amount     = decimal.Decimal(str(request.data.get('amount', 0)))
        txn_type   = request.data.get('txn_type', 'debit')  # debit or credit

        try:
            acct = BankAccount.objects.select_for_update().get(user_id=user_id, status='active')
        except BankAccount.DoesNotExist:
            return Response({'detail': 'Account not found'}, status=404)

        if txn_type == 'debit':
            if acct.balance < amount:
                return Response({'detail': 'Insufficient balance', 'balance': str(acct.balance)}, status=400)
            acct.balance -= amount
        else:
            acct.balance += amount

        acct.save(update_fields=['balance', 'updated_at'])
        return Response({'balance': str(acct.balance), 'txn_type': txn_type, 'amount': str(amount)})


class AdminAccountListView(APIView):
    """GET /api/accounts/admin/<user_id>/ — admin get user accounts"""
    permission_classes = [AllowAny]

    def get(self, request, user_id=None):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)
        qs = BankAccount.objects.filter(user_id=user_id) if user_id else BankAccount.objects.all()
        data = [{
            'id':             str(a.id),
            'user_id':        str(a.user_id),
            'account_number': a.account_number,
            'account_type':   a.account_type,
            'balance':        str(a.balance),
            'upi_id':         a.upi_id,
            'ifsc_code':      a.ifsc_code,
            'status':         a.status,
            'created_at':     a.created_at.isoformat(),
        } for a in qs[:200]]
        return Response({'results': data})


class AdminAllAccountsStatsView(APIView):
    """GET /api/accounts/admin/stats/ — admin stats"""
    permission_classes = [AllowAny]

    def get(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)
        from django.db.models import Sum
        return Response({
            'total_accounts': BankAccount.objects.count(),
            'active':         BankAccount.objects.filter(status='active').count(),
            'total_deposits': str(BankAccount.objects.aggregate(t=Sum('balance'))['t'] or 0),
        })


class ProfileView(APIView):
    """GET/PUT /api/users/profile/ — get or update user profile"""
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)

        acct    = BankAccount.objects.filter(user_id=user_id, status='active').first()
        profile = UserProfile.objects.filter(user_id=user_id).first()

        if not profile and acct:
            first_name, last_name = '', ''
            if acct.upi_id:
                name_part  = acct.upi_id.split('@')[0]
                parts      = name_part.split('.')
                first_name = parts[0].capitalize()
                last_name  = ''.join(c for c in parts[1] if c.isalpha()).capitalize() if len(parts) > 1 else ''
            profile, _ = UserProfile.objects.get_or_create(
                user_id=user_id,
                defaults={'first_name': first_name, 'last_name': last_name, 'email': '', 'phone': ''}
            )

        if not profile:
            return Response({'detail': 'Profile not found'}, status=404)

        return Response({
            'user_id':    str(profile.user_id),
            'first_name': profile.first_name,
            'last_name':  profile.last_name,
            'email':      profile.email,
            'phone':      profile.phone,
            'photo_url':  profile.photo_url,
            'account_number': acct.account_number if acct else None,
            'upi_id':         acct.upi_id         if acct else None,
            'ifsc_code':      acct.ifsc_code       if acct else None,
            'balance':        str(acct.balance)    if acct else '0.00',
            'account_type':   acct.account_type    if acct else None,
            'account_status': acct.status          if acct else None,
        })

    def put(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        try:
            profile = UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profile not found'}, status=404)

        profile.email = request.data.get('email', profile.email)
        profile.phone = request.data.get('phone', profile.phone)
        profile.save(update_fields=['email', 'phone', 'updated_at'])

        return Response({'message': 'Profile updated', 'email': profile.email, 'phone': profile.phone})
