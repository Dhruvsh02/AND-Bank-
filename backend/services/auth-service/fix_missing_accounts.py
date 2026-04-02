import django, os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings.development')
sys.path.insert(0, '/app')
django.setup()

from apps.authentication.models import User
from apps.authentication.services import AccountService
import requests

USER_SVC = 'http://user-service:8002'
INTERNAL = {'X-Service-Token': 'internal-service-secret'}

missing_emails = [
    'aditinegi@gmail.com',
    'dhruv1@andbank.com',
    'newuser999@test.com',
    'priya@andbank.com',
    'test@andbank.com',
]

for email in missing_emails:
    try:
        u = User.objects.get(email=email)
        resp = requests.post(
            f'{USER_SVC}/api/accounts/create/',
            json={
                'user_id': str(u.id),
                'account_type': 'savings',
                'kyc_data': {},
                'first_name': u.first_name or email.split('@')[0],
                'last_name': '',
                'email': email,
                'phone': u.phone or '',
            },
            headers=INTERNAL,
            timeout=10,
        )
        print(f'{email}: {resp.status_code} {resp.text[:100]}')
    except User.DoesNotExist:
        print(f'{email}: USER NOT FOUND IN AUTH DB')
    except Exception as e:
        print(f'{email}: ERROR {e}')
