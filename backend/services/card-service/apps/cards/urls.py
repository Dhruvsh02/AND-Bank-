from django.urls import path
from . import views

urlpatterns = [
    path('',                                views.CardListView.as_view()),
    path('<uuid:card_id>/settings/',        views.CardSettingsView.as_view()),
    path('<uuid:card_id>/action/',          views.CardSettingsView.as_view()),  # block/unblock
    path('internal/create-debit/',          views.InternalCreateDebitView.as_view()),
    path('admin/all/',                      views.AdminCardListView.as_view()),
    path('admin/<uuid:card_id>/action/',    views.AdminCardActionView.as_view()),
    path('admin/<uuid:card_id>/approve/',   views.AdminCardActionView.as_view()),  # legacy alias
]
