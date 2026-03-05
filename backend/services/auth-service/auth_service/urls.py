from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',      admin.site.urls),
    path('api/auth/',   include('apps.authentication.urls')),
    path('api/health/', lambda req: __import__('django.http', fromlist=['JsonResponse']).JsonResponse({'status': 'ok', 'service': 'auth-service'})),
]
