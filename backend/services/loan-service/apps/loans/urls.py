from django.urls import path
from . import views

urlpatterns = [
    path('',                           views.LoanListView.as_view()),
    path('apply/',                     views.LoanApplyView.as_view()),
    path('admin/all/',                 views.AdminLoanListView.as_view()),
    path('admin/stats/',               views.AdminLoanStatsView.as_view()),
    path('admin/<uuid:loan_id>/action/', views.AdminLoanActionView.as_view()),
]
