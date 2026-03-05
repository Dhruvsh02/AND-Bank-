from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    path('admin/',     admin.site.urls),
    path('api/cards/', include('apps.cards.urls')),
    path('api/health/', lambda r: JsonResponse({'status': 'ok', 'service': 'card-service'})),
]
