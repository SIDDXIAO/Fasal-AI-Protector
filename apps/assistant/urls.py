"""
AI Assistant URLs
"""
from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.assistant_chat_view, name='assistant_chat'),
    path('search-pesticides/', views.search_pesticides_view, name='search_pesticides'),
    path('crop-recommendations/', views.crop_recommendations_view, name='crop_recommendations'),
    path('price-comparison/', views.price_comparison_view, name='price_comparison'),
]
