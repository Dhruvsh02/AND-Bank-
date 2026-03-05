from .base import *

DEBUG = True

# Use console backend in dev so emails print to terminal
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
