from django.urls import path
from . import views

urlpatterns = [
    path('',          views.TransactionListView.as_view(), name='txn-list'),
    path('transfer/', views.TransferView.as_view(),        name='transfer'),
]
