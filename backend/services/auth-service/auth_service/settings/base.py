from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('DJANGO_SECRET_KEY', default='dev-secret-key-change-in-production')
DEBUG      = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

SERVICE_NAME = 'auth-service'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    # Local
    'apps.authentication',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'auth_service.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': { 'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

WSGI_APPLICATION = 'auth_service.wsgi.application'

# ── Database ───────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.mysql',
        'NAME':     config('DB_NAME', default='andbank_auth'),
        'USER':     config('DB_USER', default='root'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST':     config('DB_HOST', default='mysql'),
        'PORT':     config('DB_PORT', default='3306'),
        'OPTIONS':  {'charset': 'utf8mb4'},
    }
}

# ── Cache (Redis) ──────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND':  'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://redis:6379/0'),
        'OPTIONS':  {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
    }
}

# ── Custom User Model ─────────────────────────────────────────────
AUTH_USER_MODEL = 'authentication.User'

# ── DRF ──────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/min',
        'user': '100/min',
        'otp':  '5/min',
    },
    'EXCEPTION_HANDLER': 'shared.exceptions.custom_exception_handler',
}

# ── JWT ───────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=config('JWT_ACCESS_EXPIRE_MINUTES', default=30, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_EXPIRE_DAYS',   default=7,  cast=int)),
    'SIGNING_KEY': config('JWT_SIGNING_KEY', default='andbank-shared-jwt-secret-key-2024-production'),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'UPDATE_LAST_LOGIN': True,
}

# ── CORS ──────────────────────────────────────────────────────────

# ── OTP Config ────────────────────────────────────────────────────
OTP_EXPIRE_MINUTES  = config('OTP_EXPIRE_MINUTES',  default=10,  cast=int)
OTP_MAX_ATTEMPTS    = config('OTP_MAX_ATTEMPTS',     default=5,   cast=int)
OTP_RESEND_COOLDOWN = config('OTP_RESEND_COOLDOWN',  default=60,  cast=int)  # seconds

# ── Email ─────────────────────────────────────────────────────────
EMAIL_BACKEND    = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST       = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT       = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER  = config('EMAIL_HOST_USER',  default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS    = config('EMAIL_USE_TLS', default=True, cast=bool)
DEFAULT_FROM_EMAIL = 'AND Bank <noreply@andbank.com>'

# ── Twilio (SMS) ──────────────────────────────────────────────────
TWILIO_ACCOUNT_SID   = config('TWILIO_ACCOUNT_SID',   default='')
TWILIO_AUTH_TOKEN    = config('TWILIO_AUTH_TOKEN',     default='')
TWILIO_PHONE_NUMBER  = config('TWILIO_PHONE_NUMBER',   default='')

# ── Celery ────────────────────────────────────────────────────────
CELERY_BROKER_URL       = config('REDIS_URL', default='redis://redis:6379/0')
CELERY_RESULT_BACKEND   = config('REDIS_URL', default='redis://redis:6379/0')
CELERY_ACCEPT_CONTENT   = ['json']
CELERY_TASK_SERIALIZER  = 'json'
CELERY_RESULT_SERIALIZER = 'json'

# ── Static ────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Internal Service URLs ─────────────────────────────────────────
NOTIFICATION_SERVICE_URL = config('NOTIFICATION_SERVICE_URL', default='http://notification-service:8006')
USER_SERVICE_URL         = config('USER_SERVICE_URL',         default='http://user-service:8002')
