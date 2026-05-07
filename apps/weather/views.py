from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
import requests
from django.conf import settings


@require_http_methods(["GET"])
def get_live_weather(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')

    if not lat or not lon:
        return JsonResponse({"error": "Latitude and longitude are required"}, status=400)

    api_key = settings.OPENWEATHER_API_KEY
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"

    try:
        response = requests.get(url, timeout=5)
        data = response.json()

        if response.status_code == 200:
            weather_info = {
                "location": data['name'],
                "temperature": round(data['main']['temp']),
                "feels_like": round(data['main']['feels_like']),
                "description": data['weather'][0]['description'].title(),
                "icon_code": data['weather'][0]['icon'],
                "humidity": data['main']['humidity'],
<<<<<<< HEAD
                "wind_speed": data['wind']['speed'],
                "sunrise": data['sys']['sunrise'],
                "sunset": data['sys']['sunset'],
                "pressure": data['main']['pressure'],
                "visibility": data.get('visibility', 0) / 1000,
                "rain_probability": int(data.get('rain', {}).get('1h', 0) * 10) if 'rain' in data else 0
=======
                "wind_speed": data['wind']['speed']
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
            }
            return JsonResponse(weather_info)
        else:
            return JsonResponse(
                {"error": data.get("message", "Could not fetch weather data")},
                status=response.status_code
            )
    except Exception as e:
        return JsonResponse({"error": "Server error occurred while fetching weather."}, status=500)


@require_http_methods(["GET"])
def forecast_view(request):
    """Get 5-day weather forecast"""
    city = request.GET.get('city', 'Lucknow')
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')

    if lat and lon:
        cache_key = f'forecast_{lat}_{lon}'
    else:
        cache_key = f'forecast_{city}'

    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data)

    api_key = settings.OPENWEATHER_API_KEY

    try:
        if lat and lon:
            url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric&cnt=40'
        else:
            url = f'https://api.openweathermap.org/data/2.5/forecast?q={city},IN&appid={api_key}&units=metric&cnt=40'

        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            data = response.json()

            forecast_list = []
            for item in data['list'][::8]:
                forecast_list.append({
                    'date': item['dt_txt'].split(' ')[0],
                    'temp': f"{item['main']['temp']:.0f}°C",
                    'condition': item['weather'][0]['main'],
                    'description': item['weather'][0]['description'],
                    'humidity': f"{item['main']['humidity']}%",
                    'rain_chance': f"{item.get('pop', 0) * 100:.0f}%"
                })

            forecast_data = {'success': True, 'forecast': forecast_list}
            cache.set(cache_key, forecast_data, 3600)
            return JsonResponse(forecast_data)
        else:
            return JsonResponse({"error": "Could not fetch forecast data"}, status=response.status_code)
    except Exception as e:
        print(f"Forecast API error: {e}")
        return JsonResponse({'success': False, 'forecast': [], 'error': 'Server error fetching forecast.'}, status=500)