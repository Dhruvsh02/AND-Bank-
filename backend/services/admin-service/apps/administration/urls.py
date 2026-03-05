from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/',                           views.AdminDashboardView.as_view()),
    path('users/',                               views.AdminUserListView.as_view()),
    path('users/<uuid:user_id>/',                views.AdminUserDetailView.as_view()),
    path('users/<uuid:user_id>/action/',         views.AdminUserActionView.as_view()),
    path('transactions/',                        views.AdminTransactionListView.as_view()),
    path('transactions/<str:txn_id>/flag/',      views.AdminFlagTransactionView.as_view()),
    path('loans/',                               views.AdminLoanListView.as_view()),
    path('loans/<uuid:loan_id>/action/',         views.AdminLoanActionView.as_view()),
    path('cards/',                               views.AdminCardListView.as_view()),
    path('cards/<uuid:card_id>/approve/',        views.AdminCardApproveView.as_view()),
    path('audit-logs/',                          views.AdminAuditLogView.as_view()),
]
