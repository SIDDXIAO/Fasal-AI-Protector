from django.urls import path
from . import views

urlpatterns = [
    path('rates/', views.market_rates_view, name='market_rates'),
    path('crops/', views.available_crops_view, name='available_crops'),
]