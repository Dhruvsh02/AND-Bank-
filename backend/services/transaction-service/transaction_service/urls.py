from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from apps.razorpay_payments.views import CreateOrderView, VerifyPaymentView, WebhookView

urlpatterns = [
    path('admin/',                admin.site.urls),
    path('api/transactions/',     include('apps.transactions.urls')),
    path('api/health/',           lambda r: JsonResponse({'status': 'ok', 'service': 'transaction-service'})),
    path('api/transactions/razorpay/create-order/', CreateOrderView.as_view()),
    path('api/transactions/razorpay/verify/', VerifyPaymentView.as_view()),
    path('api/transactions/razorpay/webhook/', WebhookView.as_view()),
]
