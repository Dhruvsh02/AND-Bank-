from django.urls import path
from . import views

urlpatterns = [
    path('balance/',              views.BalanceView.as_view()),
    path('balance/update/',       views.BalanceUpdateView.as_view()),
    path('create/',               views.AccountCreateView.as_view()),
    path('lookup/',               views.AccountLookupView.as_view()),
    path('profile/',              views.ProfileView.as_view()),
    path('mpin/set/',             views.MPINSetView.as_view()),
    path('mpin/verify/',          views.MPINVerifyView.as_view()),
    path('admin/stats/',          views.AdminAllAccountsStatsView.as_view()),
    path('admin/<uuid:user_id>/', views.AdminAccountListView.as_view()),
]
