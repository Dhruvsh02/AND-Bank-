from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']

# Console email backend — no SMTP needed in dev
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Relax throttling in dev
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '1000/min',
    'user': '1000/min',
    'otp':  '1000/min',
}
