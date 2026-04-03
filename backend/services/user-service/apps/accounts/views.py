import decimal, logging, hashlib
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import BankAccount, KYCDetail, UserProfile, generate_upi_id

logger   = logging.getLogger(__name__)
INTERNAL = 'internal-service-secret'
DEFAULT_BRANCH   = 'Main Branch'
BRANCH_IFSC_MAP  = {'Main Branch': 'ANDB0001001'}

def is_internal(request):
    return request.headers.get('X-Service-Token') == INTERNAL

def get_user_id(request):
    return getattr(request, 'user_id', None)

def _hash_mpin(mpin, user_id):
    return hashlib.sha256(f'{user_id}{mpin}'.encode()).hexdigest()


# ── Balance ───────────────────────────────────────────────────────
class BalanceView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_user_id(request) or request.headers.get('X-User-Id')
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        try:
            acct = BankAccount.objects.get(user_id=user_id, status='active', is_primary=True)
        except BankAccount.DoesNotExist:
            acct = BankAccount.objects.filter(user_id=user_id, status='active').first()
            if not acct:
                return Response({'detail': 'No account found'}, status=404)

        # Check if MPIN is set
        profile  = UserProfile.objects.filter(user_id=user_id).first()
        mpin_set = profile.mpin_set if profile else False

        return Response({
            'account_number': acct.account_number,
            'account_type':   acct.account_type,
            'balance':        str(acct.balance),
            'upi_id':         acct.upi_id,
            'ifsc_code':      acct.ifsc_code,
            'status':         acct.status,
            'interest_rate':  str(acct.interest_rate),
            'branch':         acct.branch,
            'mpin_set':       mpin_set,
        })


# ── Account Lookup ────────────────────────────────────────────────
class AccountLookupView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        identifier = request.query_params.get('identifier', '').strip()
        if not identifier:
            return Response({'detail': 'identifier is required'}, status=400)
        try:
            if '@' in identifier:
                acct = BankAccount.objects.get(upi_id__iexact=identifier, status='active')
            else:
                acct = BankAccount.objects.get(account_number=identifier, status='active')
            profile = UserProfile.objects.filter(user_id=acct.user_id).first()
            name    = f'{profile.first_name} {profile.last_name}'.strip() if profile else '—'
            return Response({
                'user_id':        str(acct.user_id),
                'account_number': acct.account_number,
                'upi_id':         acct.upi_id,
                'name':           name,
            })
        except BankAccount.DoesNotExist:
            return Response({'detail': 'Account not found'}, status=404)


# ── Account Create (internal) ─────────────────────────────────────
class AccountCreateView(APIView):
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

        existing = BankAccount.objects.filter(user_id=user_id).first()
        if existing:
            return Response({'account_number': existing.account_number, 'upi_id': existing.upi_id, 'message': 'Account already exists'})

        acct = BankAccount(
            user_id=user_id, account_type=account_type,
            branch=DEFAULT_BRANCH, ifsc_code=BRANCH_IFSC_MAP[DEFAULT_BRANCH],
        )
        acct.save()
        acct.upi_id = generate_upi_id(first_name, last_name, acct.account_number)
        acct.save(update_fields=['upi_id'])

        UserProfile.objects.get_or_create(
            user_id=user_id,
            defaults={'first_name': first_name, 'last_name': last_name, 'email': email, 'phone': phone}
        )

        # KYC — only if pan+aadhar provided
        pan    = (kyc_data or {}).get('pan_number', '').strip()
        aadhar = (kyc_data or {}).get('aadhar_number', '').strip()
        if pan and aadhar:
            try:
                from datetime import datetime as _dt
                dob = kyc_data.get('date_of_birth', '1990-01-01')
                if isinstance(dob, str):
                    try:    dob = _dt.strptime(dob, '%Y-%m-%d').date()
                    except: dob = _dt(1990, 1, 1).date()
                KYCDetail.objects.get_or_create(
                    user_id=user_id,
                    defaults={'pan_number': pan, 'aadhar_number': aadhar, 'date_of_birth': dob,
                              'address': kyc_data.get('address', ''), 'verification_status': 'verified',
                              'verified_at': timezone.now()}
                )
            except Exception as e:
                logger.warning(f'KYC save failed (non-critical): {e}')

        # Auto-create debit card
        try:
            import requests as _req
            _req.post(
                'http://card-service:8005/api/cards/internal/create-debit/',
                json={'user_id': str(user_id), 'account_id': str(acct.id),
                      'holder_name': f'{first_name} {last_name}'.strip().upper()},
                headers={'X-Service-Token': INTERNAL}, timeout=5,
            )
        except Exception as _e:
            logger.warning(f'Debit card auto-create failed: {_e}')
            print(f'DEBIT CARD ERROR: {_e}', flush=True)

        logger.info(f'Account created: {acct.account_number} for user {user_id}')
        return Response({'account_number': acct.account_number, 'upi_id': acct.upi_id, 'account_type': acct.account_type}, status=201)


# ── Balance Update (internal) ─────────────────────────────────────
class BalanceUpdateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)

        user_id  = request.data.get('user_id')
        amount   = decimal.Decimal(str(request.data.get('amount', 0)))
        txn_type = request.data.get('txn_type', 'debit')

        try:
            with transaction.atomic():
                acct = BankAccount.objects.select_for_update().get(user_id=user_id, status='active')

                if txn_type == 'debit':
                    if acct.balance < amount:
                        return Response({'detail': 'Insufficient balance'}, status=400)
                    acct.balance -= amount
                else:
                    acct.balance += amount

                acct.save(update_fields=['balance'])
        except BankAccount.DoesNotExist:
            return Response({'detail': 'Account not found'}, status=404)

        return Response({'balance': str(acct.balance), 'account_number': acct.account_number})


# ── MPIN Set ──────────────────────────────────────────────────────
class MPINSetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)

        mpin = str(request.data.get('mpin', '')).strip()
        if len(mpin) != 6 or not mpin.isdigit():
            return Response({'detail': 'MPIN must be exactly 6 digits'}, status=400)

        profile, _ = UserProfile.objects.get_or_create(
            user_id=user_id,
            defaults={'first_name': '', 'last_name': '', 'email': '', 'phone': ''}
        )

        # Require current MPIN if already set
        if profile.mpin_set:
            current = str(request.data.get('current_mpin', '')).strip()
            if _hash_mpin(current, user_id) != profile.mpin_hash:
                return Response({'detail': 'Current MPIN is incorrect'}, status=400)

        profile.mpin_hash = _hash_mpin(mpin, user_id)
        profile.mpin_set  = True
        profile.save(update_fields=['mpin_hash', 'mpin_set'])
        return Response({'detail': 'MPIN set successfully'})


# ── MPIN Verify (internal — called by transaction-service) ────────
class MPINVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)

        user_id = request.data.get('user_id')
        mpin    = str(request.data.get('mpin', '')).strip()

        try:
            profile = UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({'valid': False, 'detail': 'Profile not found'}, status=404)

        if not profile.mpin_set:
            return Response({'valid': False, 'detail': 'MPIN not set'}, status=400)

        valid = _hash_mpin(mpin, user_id) == profile.mpin_hash
        return Response({'valid': valid, 'detail': 'MPIN verified' if valid else 'Incorrect MPIN'})


# ── Profile ───────────────────────────────────────────────────────
class ProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_user_id(request) or request.headers.get('X-User-Id')
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        profile, _ = UserProfile.objects.get_or_create(
            user_id=user_id,
            defaults={'first_name': '', 'last_name': '', 'email': '', 'phone': ''}
        )
        acct = BankAccount.objects.filter(user_id=user_id, status='active').first()
        return Response({
            'first_name':   profile.first_name,
            'last_name':    profile.last_name,
            'email':        profile.email,
            'phone':        profile.phone,
            'account_number': acct.account_number if acct else None,
            'upi_id':       acct.upi_id if acct else None,
            'mpin_set':     profile.mpin_set,
        })

    def patch(self, request):
        user_id = get_user_id(request) or request.headers.get('X-User-Id')
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        profile, _ = UserProfile.objects.get_or_create(user_id=user_id, defaults={'email':'','phone':''})
        for field in ['first_name', 'last_name', 'phone']:
            if field in request.data:
                setattr(profile, field, request.data[field])
        profile.save()
        return Response({'detail': 'Profile updated'})


# ── Admin views ───────────────────────────────────────────────────
class AdminAllAccountsStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)
        from django.db.models import Sum
        return Response({
            'total_accounts': BankAccount.objects.count(),
            'active':         BankAccount.objects.filter(status='active').count(),
            'total_balance':  str(BankAccount.objects.aggregate(s=Sum('balance'))['s'] or 0),
        })


class AdminAccountListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        if not is_internal(request):
            return Response({'detail': 'Forbidden'}, status=403)
        accts = BankAccount.objects.filter(user_id=user_id)
        return Response({'results': [{'account_number': a.account_number, 'account_type': a.account_type,
            'balance': str(a.balance), 'upi_id': a.upi_id, 'status': a.status} for a in accts]})
