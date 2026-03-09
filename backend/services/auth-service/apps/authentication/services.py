import logging
import hashlib
import secrets
import requests as http_requests
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.core.cache import cache
from django.utils import timezone

from .models import OTPRecord

logger = logging.getLogger(__name__)


class OTPService:
    OTP_LENGTH   = 6
    CACHE_PREFIX = 'otp_cooldown_'

    def __init__(self, user):
        self.user = user

    def _generate_otp(self):
        return ''.join([str(secrets.randbelow(10)) for _ in range(self.OTP_LENGTH)])

    def _hash_otp(self, otp):
        salt = str(self.user.id)
        return hashlib.sha256(f'{salt}{otp}'.encode()).hexdigest()

    def generate_and_send(self, purpose='login'):
        OTPRecord.objects.filter(user=self.user, purpose=purpose, is_used=False).update(is_used=True)

        otp      = self._generate_otp()
        otp_hash = self._hash_otp(otp)

        OTPRecord.objects.create(
            user       = self.user,
            otp_hash   = otp_hash,
            channel    = self.user.otp_channel,
            purpose    = purpose,
            expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        )

        cache.set(f'{self.CACHE_PREFIX}{self.user.id}', True, timeout=settings.OTP_RESEND_COOLDOWN)

        # Always print OTP to logs so dev can see it without email setup
        logger.warning(f'[DEV-OTP] {self.user.email} | purpose={purpose} | OTP={otp}')
        print(f'\n[DEV-OTP] Email={self.user.email} Purpose={purpose} OTP={otp}\n', flush=True)

        if self.user.otp_channel == 'email':
            self._send_email(otp, purpose)
        else:
            self._send_sms(otp)

        return otp

    def verify(self, otp_input, purpose='login'):
        # Dev bypass — 000000 always works when DEBUG=True
        if getattr(settings, 'DEBUG', False) and str(otp_input).strip() == '000000':
            logger.warning(f'[DEV] Dev bypass OTP used for {self.user.email}')
            return {'success': True, 'message': 'OTP verified (dev bypass).'}

        otp_hash = self._hash_otp(str(otp_input).strip())

        try:
            record = OTPRecord.objects.filter(
                user=self.user, otp_hash=otp_hash, is_used=False
            ).latest('created_at')
        except OTPRecord.DoesNotExist:
            return {'success': False, 'message': 'Invalid OTP. Please try again.'}

        if record.is_expired():
            return {'success': False, 'message': 'OTP has expired. Request a new one.'}

        if record.attempts >= settings.OTP_MAX_ATTEMPTS:
            return {'success': False, 'message': 'Too many attempts. Request a new OTP.'}

        record.attempts += 1
        record.is_used   = True
        record.save(update_fields=['attempts', 'is_used'])

        return {'success': True, 'message': 'OTP verified successfully.'}

    def can_resend(self):
        return not cache.get(f'{self.CACHE_PREFIX}{self.user.id}')

    def _send_email(self, otp, purpose):
        labels  = {'login': 'Login', 'register': 'Registration', 'password_reset': 'Password Reset'}
        subject = f'AND Bank — Your {labels.get(purpose, "OTP")} Code: {otp}'
        message = (
            f'Dear {self.user.first_name},\n\n'
            f'Your AND Bank OTP is: {otp}\n\n'
            f'Valid for {settings.OTP_EXPIRE_MINUTES} minutes.\n'
            f'Never share this with anyone.\n\n— AND Bank'
        )
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [self.user.email], fail_silently=False)
        except Exception as e:
            logger.warning(f'Email send failed (OTP still printed above): {e}')

    def _send_sms(self, otp):
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=f'AND Bank OTP: {otp}. Valid {settings.OTP_EXPIRE_MINUTES} mins.',
                from_=settings.TWILIO_PHONE_NUMBER,
                to=self.user.phone,
            )
        except Exception as e:
            logger.warning(f'SMS send failed (OTP still printed above): {e}')


class AccountService:
    @staticmethod
    def create_account_async(user_id, account_type, kyc_data, first_name='', last_name='', email='', phone=''):
        # Always use direct sync call — Celery is unreliable for critical account creation
        AccountService._create_sync(user_id, account_type, kyc_data, first_name, last_name, email, phone)

    @staticmethod
    def _create_sync(user_id, account_type, kyc_data, first_name, last_name, email, phone):
        try:
            resp = http_requests.post(
                f"{settings.USER_SERVICE_URL}/api/accounts/create/",
                json={
                    'user_id': user_id, 'account_type': account_type, 'kyc_data': kyc_data,
                    'first_name': first_name, 'last_name': last_name, 'email': email, 'phone': phone,
                },
                headers={'X-Service-Token': 'internal-service-secret'},
                timeout=10,
            )
            if resp.status_code not in (200, 201):
                logger.error(f'Account creation failed: {resp.status_code} {resp.text}')
            else:
                logger.info(f'Account created successfully for user {user_id}')
        except Exception as e:
            logger.error(f'Sync account creation failed: {e}')

    @staticmethod
    def get_user_by_account_number(account_number):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            resp = http_requests.get(
                f"{settings.USER_SERVICE_URL}/api/accounts/lookup/",
                params={'identifier': account_number},
                timeout=5,
                headers={'X-Service-Token': 'internal-service-secret'},
            )
            if resp.status_code == 200:
                return User.objects.get(id=resp.json().get('user_id'))
        except Exception as e:
            logger.error(f'Account lookup failed: {e}')
        raise User.DoesNotExist

    @staticmethod
    def get_pending_account_number(user_id):
        return cache.get(f'pending_account_{user_id}', 'Processing...')


class NotificationService:
    @staticmethod
    def send_welcome(user):
        try:
            http_requests.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/notifications/welcome/",
                json={'user_id': str(user.id), 'email': user.email, 'name': user.first_name},
                timeout=3,
                headers={'X-Service-Token': 'internal-service-secret'},
            )
        except Exception as e:
            logger.warning(f'Welcome notification skipped: {e}')