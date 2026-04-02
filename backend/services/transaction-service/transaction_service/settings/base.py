from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR   = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = config('DJANGO_SECRET_KEY', default='txn-dev-secret')
DEBUG      = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'apps.transactions',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'transaction_service.middleware.JWTUserMiddleware',
]

ROOT_URLCONF = 'transaction_service.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates','DIRS': [],'APP_DIRS': True,
    'OPTIONS': {'context_processors': ['django.template.context_processors.request',
    'django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'transaction_service.wsgi.application'

DATABASES = {'default': {'ENGINE': 'django.db.backends.mysql',
    'NAME': config('DB_NAME', default='andbank_transactions'),
    'USER': config('DB_USER', default='root'),
    'PASSWORD': config('DB_PASSWORD', default=''),
    'HOST': config('DB_HOST', default='mysql'),
    'PORT': config('DB_PORT', default='3306'),
    'OPTIONS': {'charset': 'utf8mb4'}}}

CACHES = {'default': {'BACKEND': 'django_redis.cache.RedisCache',
    'LOCATION': config('REDIS_URL', default='redis://redis:6379/0'),
    'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'}}}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}

SIMPLE_JWT = {'AUTH_HEADER_TYPES': ('Bearer',),
              'SIGNING_KEY': config('JWT_SIGNING_KEY', default='andbank-shared-jwt-secret-key-2024-production'),}
STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

USE_TZ    = True
TIME_ZONE = 'UTC'

# Razorpay
RAZORPAY_KEY_ID      = config('RAZORPAY_KEY_ID',      default='rzp_test_placeholder')
RAZORPAY_KEY_SECRET  = config('RAZORPAY_KEY_SECRET',  default='placeholder_secret')
RAZORPAY_WEBHOOK_SECRET = config('RAZORPAY_WEBHOOK_SECRET', default='placeholder_webhook_secret')
