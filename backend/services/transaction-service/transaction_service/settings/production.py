from .base import *
import os

DEBUG = False
ALLOWED_HOSTS = ['*']

# Security
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE   = True
CSRF_COOKIE_SECURE      = True
SECURE_BROWSER_XSS_FILTER = True

# CORS — update with real frontend URL after deploy
CORS_ALLOWED_ORIGINS = [
    os.environ.get('FRONTEND_URL', 'http://localhost:3001'),
]
CORS_ALLOW_ALL_ORIGINS = False
