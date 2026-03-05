from django.urls import path
from . import views
urlpatterns = [
    path('message/', views.ChatMessageView.as_view()),
    path('history/', views.ChatHistoryView.as_view()),
]
