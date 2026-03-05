from django.urls import path
from . import views
urlpatterns = [
    path('',                        views.CardListView.as_view()),
    path('admin/all/',              views.AdminCardListView.as_view()),
    path('admin/<uuid:card_id>/approve/', views.AdminCardApproveView.as_view()),
]
