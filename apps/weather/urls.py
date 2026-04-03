from django.urls import path
from . import views

urlpatterns = [
    path('current/', views.current_weather_view, name='current_weather'),
    path('forecast/', views.forecast_view, name='weather_forecast'),
]