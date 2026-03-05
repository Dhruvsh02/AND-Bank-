from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    path('admin/',    admin.site.urls),
    path('api/chat/', include('apps.chat.urls')),
    path('api/health/', lambda r: JsonResponse({'status': 'ok', 'service': 'chat-service'})),
]
