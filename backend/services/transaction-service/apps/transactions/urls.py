from django.urls import path
from . import views

urlpatterns = [
    path('',                              views.TransactionListView.as_view()),
    path('transfer/',                     views.TransferView.as_view()),
    path('stats/',                        views.StatsView.as_view()),
    path('razorpay/create-order/',        views.RazorpayCreateOrderView.as_view()),
    path('razorpay/verify/',              views.RazorpayVerifyView.as_view()),
    path('admin/all/',                    views.AdminTransactionListView.as_view()),
    path('admin/stats/',                  views.AdminTransactionStatsView.as_view()),
    path('admin/user/<uuid:user_id>/',    views.AdminUserTransactionView.as_view()),
    path('admin/<str:txn_id>/flag/',      views.AdminFlagTransactionView.as_view()),
]
