import os
import json
import requests
from django.http import JsonResponse
from django.conf import settings
from django.core.cache import cache

CROP_TRANSLATIONS = {
    'Wheat': {'hi': 'गेहूं', 'pa': 'ਕਣਕ', 'mr': 'गहू'},
    'Paddy': {'hi': 'धान', 'pa': 'ਝੋਨਾ', 'mr': 'भात'},
    'Bajra': {'hi': 'बाजरा', 'pa': 'ਬਾਜਰਾ', 'mr': 'बाजरी'},
    'Maize': {'hi': 'मक्का', 'pa': 'ਮੱਕੀ', 'mr': 'मका'},
    'Sugarcane': {'hi': 'गन्ना', 'pa': 'ਗੰਨਾ', 'mr': 'ऊस'},
    'Mustard': {'hi': 'सरसों', 'pa': 'ਸਰ੍ਹੋਂ', 'mr': 'मोहरी'},
    'Arhar': {'hi': 'अरहर', 'pa': 'ਅਰਹਰ', 'mr': 'तूर'},
    'Moong': {'hi': 'मूंग', 'pa': 'ਮੂੰਗ', 'mr': 'मूग'},
    'Potato': {'hi': 'आलू', 'pa': 'ਆਲੂ', 'mr': 'बटाटा'},
    'Tomato': {'hi': 'टमाटर', 'pa': 'ਟਮਾਟਰ', 'mr': 'टोमॅटो'},
    'Brinjal': {'hi': 'बैंगन', 'pa': 'ਬੈਂਗਣ', 'mr': 'वांगी'},
    'Bottle Gourd': {'hi': 'लौकी', 'pa': 'ਘੀਆ', 'mr': 'दुधी भोपळा'},
    'Pumpkin': {'hi': 'कद्दू', 'pa': 'ਕੱਦੂ', 'mr': 'भोपळा'},
    'Okra': {'hi': 'भिंडी', 'pa': 'ਭਿੰਡੀ', 'mr': 'भेंडी'},
    'Chilli': {'hi': 'मिर्च', 'pa': 'ਮਿਰਚ', 'mr': 'मिरची'},
    'Cauliflower': {'hi': 'फूलगोभी', 'pa': 'ਫੂਲਗੋਭੀ', 'mr': 'फ्लॉवर'},
    'Cabbage': {'hi': 'पत्तागोभी', 'pa': 'ਪੱਤਾਗੋਭੀ', 'mr': 'कोबी'},
    'Radish': {'hi': 'मूली', 'pa': 'ਮੂਲੀ', 'mr': 'मुळा'},
    'Cotton': {'hi': 'कपास', 'pa': 'ਕਪਾਹ', 'mr': 'कापूस'},
    'Rice': {'hi': 'चावल', 'pa': 'ਚੌਲ', 'mr': 'तांदूळ'},
}

TARGET_CROPS = [
    "Wheat", "Paddy", "Tomato", "Brinjal", "Potato", "Mustard", "Sugarcane",
    "Bajra", "Maize", "Okra", "Chilli", "Cucumber", "Bottle Gourd",
    "Bitter Gourd", "Pumpkin", "Ridge Gourd", "Sponge Gourd", "Pointed Gourd",
    "Watermelon", "Cabbage", "Cauliflower", "Radish"
]

UP_FALLBACK_DISTRICTS = [
    "Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj",
    "Meerut", "Bareilly", "Moradabad", "Gorakhpur", "Mathura",
    "Etah", "Hardoi", "Unnao", "Sitapur", "Barabanki",
    "Sultanpur", "Faizabad", "Jaunpur", "Azamgarh", "Basti"
]

API_KEY = "579b464db66ec23bdd000001de83fc07b14447535ee3b0203e7e5f2e"
API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"


# Yesterday's data - Static fallback for when API fails
YESTERDAY_MANDI_RATES = {
    "Wheat": {"price": 2275, "min": 2100, "max": 2450},
    "Paddy": {"price": 2180, "min": 2000, "max": 2350},
    "Rice": {"price": 2200, "min": 2050, "max": 2380},
    "Potato": {"price": 1200, "min": 1000, "max": 1400},
    "Tomato": {"price": 1800, "min": 1500, "max": 2100},
    "Onion": {"price": 1400, "min": 1200, "max": 1600},
    "Mustard": {"price": 5200, "min": 4800, "max": 5500},
    "Sugarcane": {"price": 3500, "min": 3200, "max": 3800},
    "Maize": {"price": 1960, "min": 1800, "max": 2100},
    "Bajra": {"price": 2100, "min": 1900, "max": 2300},
    "Gram": {"price": 5500, "min": 5000, "max": 6000},
    "Arhar": {"price": 6200, "min": 5800, "max": 6600},
    "Moong": {"price": 7500, "min": 7000, "max": 8000},
    "Urad": {"price": 6800, "min": 6300, "max": 7300},
    "Masur": {"price": 5800, "min": 5300, "max": 6300},
    "Sugarcane": {"price": 3500, "min": 3200, "max": 3800},
    "Cotton": {"price": 6200, "min": 5800, "max": 6600},
    "Soybean": {"price": 4500, "min": 4200, "max": 4800},
    "Sunflower": {"price": 5500, "min": 5000, "max": 6000},
    "Sesame": {"price": 8500, "min": 8000, "max": 9000},
    "Brinjal": {"price": 1600, "min": 1400, "max": 1800},
    "Cabbage": {"price": 1500, "min": 1300, "max": 1700},
    "Cauliflower": {"price": 1800, "min": 1600, "max": 2000},
    "Okra": {"price": 2500, "min": 2200, "max": 2800},
    "Chilli": {"price": 3200, "min": 2800, "max": 3600},
    "Potato": {"price": 1200, "min": 1000, "max": 1400},
    "Garlic": {"price": 2800, "min": 2500, "max": 3100},
    "Ginger": {"price": 3500, "min": 3200, "max": 3800},
    "Turmeric": {"price": 12000, "min": 11000, "max": 13000},
    "Coriander": {"price": 4500, "min": 4000, "max": 5000},
    "Fenugreek": {"price": 3800, "min": 3500, "max": 4200},
    "Spinach": {"price": 1200, "min": 1000, "max": 1400},
    "Radish": {"price": 1100, "min": 900, "max": 1300},
    "Carrot": {"price": 1800, "min": 1600, "max": 2000},
}


def _get_fallback_rates(district):
    """Get fallback rates from static data."""
    return FALLBACK_MANDI_RATES.get(district, FALLBACK_MANDI_RATES.get("Lucknow", []))


def _fetch_district_records(district):
    """Single district ke records fetch karo. Returns (filtered_list, district_name)."""
    cache_key = f'mandi_{district}'
    cached = cache.get(cache_key)
    if cached:
        return cached, district

    params = {
        'api-key': API_KEY,
        'format': 'json',
        'limit': 500,
        'filters[state]': 'Uttar Pradesh',
        'filters[district]': district,
    }
    try:
        resp = requests.get(API_URL, params=params, timeout=8)
        if resp.status_code == 200:
            all_records = resp.json().get('records', [])
            filtered = [
                r for r in all_records
                if (
                    r.get('district', '').strip().lower() == district.lower()
                    and r.get('commodity')
                    and any(crop.lower() in r['commodity'].lower() for crop in TARGET_CROPS)
                )
            ]
            if filtered:
                cache.set(cache_key, (filtered, district), 3600)
                return filtered, district
    except Exception as e:
        print(f"[_fetch_district_records] {district}: {e}")

    return [], district


# ═══════════════════════════════════════════════════════════════
from django.views.decorators.http import require_http_methods
from datetime import datetime, timedelta

@require_http_methods(["GET"])
def market_rates_view(request):
    lang = request.GET.get('lang', 'en') if not request.user.is_authenticated else getattr(request.user, 'language', 'en')
    district = request.GET.get('district', 'Lucknow')
    yesterday = request.GET.get('yesterday', 'false').lower() == 'true'

    # If yesterday data requested, return static data
    if yesterday:
        rates = []
        for crop, data in YESTERDAY_MANDI_RATES.items():
            rates.append({
                'crop': CROP_TRANSLATIONS.get(crop, {}).get(lang, crop),
                'crop_en': crop,
                'price': data['price'],
                'min_price': data['min'],
                'max_price': data['max'],
                'market': f'{district} Mandi',
                'district': district,
                'unit': 'Quintal',
                'arrival_date': (datetime.now() - timedelta(1)).strftime('%d/%m/%Y')
            })
        return JsonResponse({
            'success': True,
            'rates': rates,
            'count': len(rates),
            'source': 'Yesterday\'s Data'
        })

    # Try fetching with max 2 retries
    filtered_records = []
    source = ''
    dist = district
    max_retries = 2

    for attempt in range(max_retries):
        records, fetched_dist = _fetch_district_records(district)

        if records:
            filtered_records = records
            dist = fetched_dist
            source = 'Govt API'
            break

        # Only try one fallback district
        if attempt == 0 and not records:
            for fallback in UP_FALLBACK_DISTRICTS[:3]:  # Try max 3 fallback districts
                if fallback.lower() == district.lower():
                    continue
                records, fetched_dist = _fetch_district_records(fallback)
                if records:
                    filtered_records = records
                    dist = fetched_dist
                    source = f'Govt API ({fetched_dist})'
                    break

    # If no data available after retries, return notice immediately
    if not filtered_records:
        return JsonResponse({
            'success': False,
            'rates': [],
            'count': 0,
            'source': 'No Data',
            'notice': {
                'title': '⚠️ Data Not Available',
                'message': 'Government portal is not responding. Please try again later or check yesterday\'s data.',
                'show_yesterday': True
            }
        })

    # Format the records properly
    rates = []
    seen_commodities = set()

    for r in filtered_records:
        eng_name = r.get('commodity', 'Unknown').title()
        if eng_name in seen_commodities:
            continue
        seen_commodities.add(eng_name)

        try:
            price = float(r.get('modal_price', 0))
        except:
            price = 0

        try:
            prev_price = float(r.get('min_price', price))
        except:
            prev_price = price

        rates.append({
            'crop': CROP_TRANSLATIONS.get(eng_name, {}).get(lang, eng_name),
            'crop_en': eng_name,
            'price': price,
            'min_price': prev_price,
            'max_price': r.get('max_price', ''),
            'market': r.get('market', 'Local Mandi'),
            'district': dist,
            'unit': 'Quintal',
            'arrival_date': r.get('arrival_date', '')
        })

    return JsonResponse({'success': True, 'rates': rates, 'count': len(rates), 'source': source})


@require_http_methods(["GET"])
def available_crops_view(request):
    lang = request.GET.get('lang', 'en')
    crops = [{'name_en': k, 'name': v.get(lang, k), 'translations': v} for k, v in CROP_TRANSLATIONS.items()]
    return JsonResponse({'success': True, 'crops': crops, 'count': len(crops)})