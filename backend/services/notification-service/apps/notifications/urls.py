from django.urls import path
from . import views

urlpatterns = [
    path('otp/',              views.OTPNotificationView.as_view()),
    path('welcome/',          views.WelcomeNotificationView.as_view()),
    path('transaction/',      views.TransactionNotificationView.as_view()),
    path('loan/apply/',       views.LoanApplicationNotificationView.as_view()),
    path('loan/decision/',    views.LoanDecisionNotificationView.as_view()),
    path('card/apply/',       views.CardApplicationNotificationView.as_view()),
    path('card/decision/',    views.CardDecisionNotificationView.as_view()),
    path('add-money/',        views.AddMoneyNotificationView.as_view()),
]