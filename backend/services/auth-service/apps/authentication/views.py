import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import OTPRecord, UserSession
from .serializers import (
    RegisterSerializer, LoginSerializer,
    OTPVerifySerializer, ResendOTPSerializer, UserSerializer,
)
from .services import OTPService, AccountService, NotificationService

logger = logging.getLogger(__name__)
User   = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['user_id'] = str(user.id)
    refresh['role']  = user.role
    refresh['email'] = user.email
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


def client_ip(request):
    fwd = request.META.get('HTTP_X_FORWARDED_FOR')
    return fwd.split(',')[0].strip() if fwd else request.META.get('REMOTE_ADDR')


# ── Register ──────────────────────────────────────────────────────────────────
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User.objects.create_user(
            email       = data['email'],
            phone       = data['phone'],
            password    = data['password'],
            first_name  = data['first_name'],
            last_name   = data['last_name'],
            otp_channel = data.get('otp_channel', 'email'),
            status      = 'inactive',
            is_verified = False,
        )

        # Create bank account (sync in dev if Celery unavailable)
        AccountService.create_account_async(
            user_id      = str(user.id),
            account_type = data.get('account_type', 'savings'),
            kyc_data     = {
                'pan_number':    data.get('pan_number', ''),
                'aadhar_number': data.get('aadhar_number', ''),
                'address':       data.get('address', ''),
                'date_of_birth': str(data.get('date_of_birth', '')),
            },
            first_name = data['first_name'],
            last_name  = data['last_name'],
            email      = data['email'],
            phone      = data['phone'],
        )

        otp_service = OTPService(user)
        otp_service.generate_and_send(purpose='register')

        logger.info(f'New user registered: {user.email}')
        return Response({
            'message': f'OTP sent to your {user.otp_channel}. Check server logs for dev OTP.',
            'user_id': str(user.id),
            'email':   user.email,
        }, status=201)


# ── Login ─────────────────────────────────────────────────────────────────────
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        identifier = data['identifier']
        try:
            if '@' in identifier and not identifier.startswith('AND'):
                # UPI IDs look like "name@andbank" (no .com)
                # Emails look like "name@andbank.com" or "name@gmail.com"
                is_upi = identifier.lower().endswith('@andbank')
                if is_upi:
                    user = AccountService.get_user_by_account_number(identifier)
                else:
                    user = User.objects.get(email=identifier)
            else:
                # Account number like AND123456789012
                user = AccountService.get_user_by_account_number(identifier)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=401)

        if user.status == 'blocked':
            return Response({'detail': 'Account blocked. Contact support.'}, status=403)
        if user.status == 'suspended':
            return Response({'detail': 'Account suspended. Contact support.'}, status=403)
        if user.is_locked():
            return Response({'detail': 'Account temporarily locked. Try after 30 minutes.'}, status=429)
        if not user.check_password(data['password']):
            user.increment_failed_attempts()
            return Response({'detail': 'Invalid credentials.'}, status=401)

        user.reset_failed_attempts()

        otp_service = OTPService(user)
        otp_service.generate_and_send(purpose='login')

        logger.info(f'Login OTP sent for: {user.email}')
        return Response({
            'message': f'OTP sent. Check server logs for dev OTP (or use 000000).',
            'user_id': str(user.id),
            'email':   user.email,
        }, status=200)


# ── OTP Verify ────────────────────────────────────────────────────────────────
class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            return Response({'detail': 'Invalid user.'}, status=400)

        otp_service = OTPService(user)
        result = otp_service.verify(data['otp'])

        if not result['success']:
            return Response({'detail': result['message']}, status=400)

        # Activate on first verify
        if not user.is_verified:
            user.is_verified = True
            user.status      = 'active'
            user.save(update_fields=['is_verified', 'status'])

        user.last_login_ip = client_ip(request)
        user.save(update_fields=['last_login_ip'])

        tokens = get_tokens_for_user(user)

        try:
            UserSession.objects.create(
                user              = user,
                refresh_token_jti = RefreshToken(tokens['refresh']).get('jti', ''),
                ip_address        = client_ip(request),
                device_info       = {'user_agent': request.META.get('HTTP_USER_AGENT', '')},
            )
        except Exception:
            pass  # Non-critical

        logger.info(f'User logged in: {user.email}')
        return Response({
            'user':    UserSerializer(user).data,
            'access':  tokens['access'],
            'refresh': tokens['refresh'],
        }, status=200)


# ── Resend OTP ────────────────────────────────────────────────────────────────
class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            return Response({'detail': 'Invalid user.'}, status=400)

        otp_service = OTPService(user)
        if not otp_service.can_resend():
            return Response({'detail': 'Please wait before requesting another OTP.'}, status=429)

        otp_service.generate_and_send(purpose=data.get('purpose', 'login'))
        return Response({'message': 'New OTP sent. Check server logs.'}, status=200)


# ── Logout ────────────────────────────────────────────────────────────────────
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
            UserSession.objects.filter(user=request.user, is_active=True).update(is_active=False)
            return Response({'message': 'Logged out successfully.'}, status=200)
        except TokenError:
            return Response({'detail': 'Invalid token.'}, status=400)


# ── Forgot / Reset Password ───────────────────────────────────────────────────
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        try:
            user = User.objects.get(email=email, is_active=True)
            OTPService(user).generate_and_send(purpose='password_reset')
        except User.DoesNotExist:
            pass
        return Response({
            'message': 'If that email is registered, you will receive a reset OTP.',
            'note':    'In dev, check docker logs andbank-auth for the OTP.',
        }, status=200)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id  = request.data.get('user_id')
        otp      = request.data.get('otp')
        password = request.data.get('password')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid request.'}, status=400)

        result = OTPService(user).verify(otp, purpose='password_reset')
        if not result['success']:
            return Response({'detail': result['message']}, status=400)

        user.set_password(password)
        user.save(update_fields=['password'])
        return Response({'message': 'Password reset successful. Please login.'}, status=200)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current  = request.data.get('current_password')
        new_pass = request.data.get('new_password')

        if not request.user.check_password(current):
            return Response({'detail': 'Current password is incorrect.'}, status=400)
        if len(new_pass or '') < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=400)

        request.user.set_password(new_pass)
        request.user.save(update_fields=['password'])
        return Response({'message': 'Password changed successfully.'}, status=200)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ── Admin Views ───────────────────────────────────────────────────────────────
class AdminUserListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from django.db.models import Q
        qs     = User.objects.all().order_by('-created_at')
        search = request.query_params.get('search', '')
        stat   = request.query_params.get('status', '')
        if search:
            qs = qs.filter(Q(email__icontains=search)|Q(first_name__icontains=search)|Q(phone__icontains=search))
        if stat and stat != 'all':
            qs = qs.filter(status=stat)
        data = [{
            'id': str(u.id), 'email': u.email, 'first_name': u.first_name,
            'last_name': u.last_name, 'phone': u.phone, 'role': u.role,
            'status': u.status, 'is_kyc_verified': u.is_kyc_verified,
            'is_verified': u.is_verified, 'created_at': u.created_at.isoformat(),
        } for u in qs[:200]]
        return Response({'results': data, 'count': len(data)})


class AdminUserStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from datetime import date
        return Response({
            'total':       User.objects.count(),
            'active':      User.objects.filter(status='active').count(),
            'blocked':     User.objects.filter(status='blocked').count(),
            'pending_kyc': User.objects.filter(is_kyc_verified=False, is_verified=True).count(),
            'new_today':   User.objects.filter(created_at__date=date.today()).count(),
        })


class AdminUserDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        return Response(UserSerializer(user).data)


class AdminUserActionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, user_id):
        user   = get_object_or_404(User, id=user_id)
        action = request.data.get('action')
        if action == 'block':       user.status    = 'blocked'
        elif action == 'unblock':   user.status    = 'active'
        elif action == 'suspend':   user.status    = 'suspended'
        elif action == 'delete':    user.is_active = False; user.status = 'inactive'
        else: return Response({'detail': 'Invalid action'}, status=400)
        user.save()
        return Response({'detail': f'User {action}ed successfully'})
