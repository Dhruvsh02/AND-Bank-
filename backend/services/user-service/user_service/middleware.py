import jwt
from django.conf import settings

class JWTUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user_id   = None
        request.user_role = None
        auth = request.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            try:
                payload = jwt.decode(
                    auth.split(' ')[1],
                    settings.SECRET_KEY,
                    algorithms=['HS256'],
                    options={'verify_exp': False}
                )
                request.user_id   = payload.get('user_id')
                request.user_role = payload.get('role', 'user')
            except Exception:
                pass
        return self.get_response(request)
