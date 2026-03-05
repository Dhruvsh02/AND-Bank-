from django.urls import path
from . import views
urlpatterns = [
    path('welcome/',     views.WelcomeNotificationView.as_view()),
    path('transaction/', views.TransactionNotificationView.as_view()),
]
