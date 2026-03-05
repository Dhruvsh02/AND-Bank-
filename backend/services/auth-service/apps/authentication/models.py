import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff',     True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role',         'admin')
        extra_fields.setdefault('is_verified',  True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('user', 'User'), ('admin', 'Admin')]
    STATUS_CHOICES = [
        ('active',    'Active'),
        ('inactive',  'Inactive'),
        ('blocked',   'Blocked'),
        ('suspended', 'Suspended'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email          = models.EmailField(unique=True, db_index=True)
    phone          = models.CharField(max_length=20, unique=True, db_index=True)
    first_name     = models.CharField(max_length=100)
    last_name      = models.CharField(max_length=100)
    role           = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    is_verified    = models.BooleanField(default=False)   # OTP verified
    is_kyc_verified = models.BooleanField(default=False)
    is_staff       = models.BooleanField(default=False)
    is_active      = models.BooleanField(default=True)
    otp_channel    = models.CharField(max_length=5, choices=[('email', 'Email'), ('sms', 'SMS')], default='email')
    last_login_ip  = models.GenericIPAddressField(null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until   = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(default=timezone.now)
    updated_at     = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['phone', 'first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'auth_users'
        indexes  = [models.Index(fields=['email', 'status'])]

    def __str__(self):
        return f'{self.full_name} ({self.email})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    def is_locked(self):
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False

    def increment_failed_attempts(self):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
        self.save(update_fields=['failed_login_attempts', 'locked_until'])

    def reset_failed_attempts(self):
        if self.failed_login_attempts > 0:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=['failed_login_attempts', 'locked_until'])


class OTPRecord(models.Model):
    CHANNEL_CHOICES = [('email', 'Email'), ('sms', 'SMS')]
    PURPOSE_CHOICES = [
        ('login',            'Login'),
        ('register',         'Registration'),
        ('password_reset',   'Password Reset'),
        ('transaction_auth', 'Transaction Auth'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_records')
    otp_hash   = models.CharField(max_length=256)       # Stored as bcrypt hash
    channel    = models.CharField(max_length=5, choices=CHANNEL_CHOICES)
    purpose    = models.CharField(max_length=20,  choices=PURPOSE_CHOICES, default='login')
    attempts   = models.PositiveIntegerField(default=0)
    is_used    = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'otp_records'
        ordering = ['-created_at']

    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_valid(self):
        return not self.is_used and not self.is_expired() and self.attempts < 5

    def __str__(self):
        return f'OTP[{self.purpose}] for {self.user.email}'


class UserSession(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    refresh_token_jti = models.CharField(max_length=255, unique=True)
    device_info  = models.JSONField(default=dict)
    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(default=timezone.now)
    last_seen    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_sessions'

    def __str__(self):
        return f'Session for {self.user.email} @ {self.ip_address}'
