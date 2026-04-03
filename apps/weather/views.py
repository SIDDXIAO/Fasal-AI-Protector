from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
import requests
from django.conf import settings
import os


@require_http_methods(["GET"])
def current_weather_view(request):
    """Get current weather with caching"""
    city = request.GET.get('city', 'Lucknow')
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    
    # Check cache first (cache for 30 minutes)
    if lat and lon:
        cache_key = f'weather_{lat}_{lon}'
    else:
        cache_key = f'weather_{city}'
        
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data)
    
    # Try OpenWeatherMap API
    api_key = os.getenv('OPENWEATHER_API_KEY')
    
    if api_key:
        try:
            if lat and lon:
                url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric'
            else:
                url = f'https://api.openweathermap.org/data/2.5/weather?q={city},IN&appid={api_key}&units=metric'
                
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                weather_data = {
                    'success': True,
                    'weather': {
                        'temp': f"{data['main']['temp']:.0f}°C",
                        'condition': data['weather'][0]['main'],
                        'description': data['weather'][0]['description'],
                        'location': data.get('name', city),
                        'humidity': f"{data['main']['humidity']}%",
                        'wind': f"{data['wind']['speed']} m/s",
                        'feels_like': f"{data['main']['feels_like']:.0f}°C",
                        'pressure': f"{data['main']['pressure']} hPa"
                    }
                }
                
                # Cache for 30 minutes
                cache.set(cache_key, weather_data, 1800)
                return JsonResponse(weather_data)
        except Exception as e:
            print(f"Weather API error: {e}")
            # Fallback will be used
    
    # Fallback response
    fallback_data = {
        'success': True,
        'weather': {
            'temp': '28°C',
            'condition': 'Sunny',
            'description': 'Clear sky',
            'location': city,
            'humidity': '65%',
            'wind': '3.5 m/s',
            'feels_like': '30°C',
            'pressure': '1013 hPa'
        },
        'note': 'Using fallback data. Add OPENWEATHER_API_KEY to .env for real-time weather.'
    }
    return JsonResponse(fallback_data)


@require_http_methods(["GET"])
def forecast_view(request):
    """Get 5-day weather forecast"""
    city = request.GET.get('city', 'Lucknow')
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    
    # Check cache
    if lat and lon:
        cache_key = f'forecast_{lat}_{lon}'
    else:
        cache_key = f'forecast_{city}'
        
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data)
    
    api_key = os.getenv('OPENWEATHER_API_KEY')
    
    if api_key:
        try:
            if lat and lon:
                url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric&cnt=40'
            else:
                url = f'https://api.openweathermap.org/data/2.5/forecast?q={city},IN&appid={api_key}&units=metric&cnt=40'
                
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Process forecast data (every 3 hours, get daily summary)
                forecast_list = []
                for item in data['list'][::8]:  # Every 24 hours
                    forecast_list.append({
                        'date': item['dt_txt'].split(' ')[0],
                        'temp': f"{item['main']['temp']:.0f}°C",
                        'condition': item['weather'][0]['main'],
                        'description': item['weather'][0]['description'],
                        'humidity': f"{item['main']['humidity']}%",
                        'rain_chance': f"{item.get('pop', 0) * 100:.0f}%"
                    })
                
                forecast_data = {
                    'success': True,
                    'forecast': forecast_list
                }
                
                # Cache for 1 hour
                cache.set(cache_key, forecast_data, 3600)
                return JsonResponse(forecast_data)
        except Exception as e:
            print(f"Forecast API error: {e}")
    
    # Fallback
    return JsonResponse({
        'success': True,
        'forecast': [],
        'note': 'Add OPENWEATHER_API_KEY to .env for forecast data.'
    })
