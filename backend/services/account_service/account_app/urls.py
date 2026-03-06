from django.urls import path
from . import views

urlpatterns = [
    path('my/', views.get_my_account, name='my-account'),
    path('dashboard/', views.get_dashboard_summary, name='dashboard-summary'),
    path('create/', views.create_account, name='create-account'),
]