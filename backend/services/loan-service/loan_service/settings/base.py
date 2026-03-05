from pathlib import Path
from decouple import config
BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = config('DJANGO_SECRET_KEY', default='loan_service-dev-secret')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['*']
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.loans',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]
ROOT_URLCONF = 'loan_service.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates','DIRS': [],'APP_DIRS': True,'OPTIONS': {'context_processors': ['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'loan_service.wsgi.application'
DATABASES = {'default': {'ENGINE': 'django.db.backends.mysql','NAME': config('DB_NAME', default='andbank_loan_service'),'USER': config('DB_USER', default='root'),'PASSWORD': config('DB_PASSWORD', default=''),'HOST': config('DB_HOST', default='mysql'),'PORT': config('DB_PORT', default='3306'),'OPTIONS': {'charset': 'utf8mb4'}}}
CACHES = {'default': {'BACKEND': 'django_redis.cache.RedisCache','LOCATION': config('REDIS_URL', default='redis://redis:6379/0'),'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'}}}
REST_FRAMEWORK = {'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication'],'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer']}
STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# JWT middleware
MIDDLEWARE += ['loan_service.middleware.JWTUserMiddleware']

# Override DRF permissions
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': ['loan_service.permissions.IsAuthenticated'],
    'DEFAULT_RENDERER_CLASSES':   ['rest_framework.renderers.JSONRenderer'],
}
