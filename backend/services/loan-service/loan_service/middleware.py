import jwt
from django.conf import settings


class JWTUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user_id   = None
        request.user_role = None
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
            try:
                signing_key = getattr(settings, 'SIMPLE_JWT', {}).get(
                    "SIGNING_KEY",
                    "andbank-shared-jwt-secret-key-2024-production"
                )
                payload = jwt.decode(token, signing_key, algorithms=["HS256"])
                request.user_id   = payload.get("user_id")
                request.user_role = payload.get("role", "user")
            except jwt.ExpiredSignatureError:
                pass
            except Exception:
                pass
        return self.get_response(request)

