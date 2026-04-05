from django.urls import path
from . import views

urlpatterns = [
    path('api/get-weather/', views.get_live_weather, name='get_weather'),
    path('forecast/', views.forecast_view, name='weather_forecast'),
]