import os
import json
import requests
from django.http import JsonResponse
from django.conf import settings
<<<<<<< HEAD
from django.core.cache import cache

=======
from django.views.decorators.http import require_http_methods

# Full Crop Dictionary with translations
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
CROP_TRANSLATIONS = {
    'Wheat': {'hi': 'गेहूं', 'pa': 'ਕਣਕ', 'mr': 'गहू'},
    'Paddy': {'hi': 'धान', 'pa': 'ਝੋਨਾ', 'mr': 'भात'},
    'Bajra': {'hi': 'बाजरा', 'pa': 'ਬਾਜਰਾ', 'mr': 'बाजरी'},
    'Maize': {'hi': 'मक्का', 'pa': 'ਮੱਕੀ', 'mr': 'मका'},
    'Sugarcane': {'hi': 'गन्ना', 'pa': 'ਗੰਨਾ', 'mr': 'ऊस'},
    'Mustard': {'hi': 'सरसों', 'pa': 'ਸਰ੍ਹੋਂ', 'mr': 'मोहरी'},
<<<<<<< HEAD
=======
    'Groundnut': {'hi': 'मूंगफली', 'pa': 'ਮੂੰਗਫਲੀ', 'mr': 'भुईमूग'},
    'Soybean': {'hi': 'सोयाबीन', 'pa': 'ਸੋਇਆਬੀਨ', 'mr': 'सोयाबीन'},
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
    'Arhar': {'hi': 'अरहर', 'pa': 'ਅਰਹਰ', 'mr': 'तूर'},
    'Moong': {'hi': 'मूंग', 'pa': 'ਮੂੰਗ', 'mr': 'मूग'},
    'Potato': {'hi': 'आलू', 'pa': 'ਆਲੂ', 'mr': 'बटाटा'},
    'Tomato': {'hi': 'टमाटर', 'pa': 'ਟਮਾਟਰ', 'mr': 'टोमॅटो'},
    'Brinjal': {'hi': 'बैंगन', 'pa': 'ਬੈਂਗਣ', 'mr': 'वांगी'},
    'Bottle Gourd': {'hi': 'लौकी', 'pa': 'ਘੀਆ', 'mr': 'दुधी भोपळा'},
<<<<<<< HEAD
=======
    'Bitter Gourd': {'hi': 'करेला', 'pa': 'ਕਰੇਲਾ', 'mr': 'कारले'},
    'Cucumber': {'hi': 'खीरा', 'pa': 'ਖੀਰਾ', 'mr': 'काकडी'},
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
    'Pumpkin': {'hi': 'कद्दू', 'pa': 'ਕੱਦੂ', 'mr': 'भोपळा'},
    'Okra': {'hi': 'भिंडी', 'pa': 'ਭਿੰਡੀ', 'mr': 'भेंडी'},
    'Chilli': {'hi': 'मिर्च', 'pa': 'ਮਿਰਚ', 'mr': 'मिरची'},
    'Cauliflower': {'hi': 'फूलगोभी', 'pa': 'ਫੂਲਗੋਭੀ', 'mr': 'फ्लॉवर'},
    'Cabbage': {'hi': 'पत्तागोभी', 'pa': 'ਪੱਤਾਗੋਭੀ', 'mr': 'कोबी'},
    'Radish': {'hi': 'मूली', 'pa': 'ਮੂਲੀ', 'mr': 'मुळा'},
<<<<<<< HEAD
=======
    'Ridge Gourd': {'hi': 'तोरई', 'pa': 'ਤੋਰੀ', 'mr': 'दोडका'},
    'Sponge Gourd': {'hi': 'नेनुआ', 'pa': 'ਨੇਨੂਆ', 'mr': 'गिलके'},
    'Pointed Gourd': {'hi': 'परवल', 'pa': 'ਪਰਵਲ', 'mr': 'पडवळ'},
    'Watermelon': {'hi': 'तरबूज', 'pa': 'ਤਰਬੂਜ', 'mr': 'कलिंगड'},
    'Muskmelon': {'hi': 'खरबूजा', 'pa': 'ਖਰਬੂਜਾ', 'mr': 'खरबूज'},
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
    'Cotton': {'hi': 'कपास', 'pa': 'ਕਪਾਹ', 'mr': 'कापूस'},
    'Rice': {'hi': 'चावल', 'pa': 'ਚੌਲ', 'mr': 'तांदूळ'},
}

<<<<<<< HEAD
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
=======
@require_http_methods(["GET"])
def market_rates_view(request):
    """
    Fetch live mandi rates from the locally scraped mandi_rates.json file
    (Produced by Playwright scraper)
    """
    if request.user.is_authenticated:
        lang = getattr(request.user, 'language', 'en')
    else:
        lang = request.GET.get('lang', 'en')
    
    json_path = os.path.join(settings.BASE_DIR, 'mandi_rates.json')
    try:
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                scraped_data = json.load(f)
                
            records = []
            if 'data' in scraped_data:
                for r in scraped_data['data'][:15]:  # Get top 15 results
                    eng_name = r.get('commodity', 'Unknown')
                    
                    # Translate crop name based on user language
                    translated_name = CROP_TRANSLATIONS.get(eng_name, {}).get(lang, eng_name)
                    
                    price_str = str(r.get('modal_price', '')).replace('₹', '').replace(',', '').strip()
                    try:
                        price = float(price_str) if price_str else 0
                    except ValueError:
                        price = price_str
                        
                    records.append({
                        'crop': translated_name,
                        'crop_en': eng_name,
                        'price': price,
                        'min_price': r.get('min_price'),
                        'max_price': r.get('max_price'),
                        'market': r.get('market', 'N/A'),
                        'district': r.get('district'),
                        'unit': 'Quintal',
                        'arrival_date': scraped_data.get('scraped_at')
                    })
            
                if len(records) > 0:
                    return JsonResponse({
                        'success': True,
                        'rates': records,
                        'count': len(records),
                        'source': 'Playwright Scraper'
                    })
    except Exception as e:
        print(f"Error reading scraped mandi data: {e}")
        
    # Fallback to mock data if json parsing breaks or file doesn't exist
    return JsonResponse(_get_mock_rates(lang))


def _get_mock_rates(lang='en'):
    """
    Mock mandi rates when API is unavailable.
    Returns a plain dict (NOT JsonResponse) so callers can modify it.
    """
    mock_data = [
        {'crop_en': 'Wheat', 'price': 2100, 'change': '+5%', 'market': 'Lucknow'},
        {'crop_en': 'Rice', 'price': 3200, 'change': '-2%', 'market': 'Varanasi'},
        {'crop_en': 'Cotton', 'price': 7500, 'change': '+8%', 'market': 'Agra'},
        {'crop_en': 'Sugarcane', 'price': 350, 'change': '+3%', 'market': 'Meerut'},
        {'crop_en': 'Potato', 'price': 1200, 'change': '+2%', 'market': 'Kanpur'},
        {'crop_en': 'Tomato', 'price': 1800, 'change': '-5%', 'market': 'Prayagraj'},
        {'crop_en': 'Mustard', 'price': 5500, 'change': '+4%', 'market': 'Bareilly'},
        {'crop_en': 'Bajra', 'price': 1900, 'change': '+1%', 'market': 'Moradabad'},
    ]
    
    rates = []
    for item in mock_data:
        eng_name = item['crop_en']
        translated_name = CROP_TRANSLATIONS.get(eng_name, {}).get(lang, eng_name)
        
        rates.append({
            'crop': translated_name,
            'crop_en': eng_name,
            'price': item['price'],
            'change': item.get('change'),
            'market': item['market'],
            'unit': 'Quintal'
        })
    
    return {
        'success': True,
        'rates': rates,
        'source': 'Mock Data (API Offline)'
    }
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6


@require_http_methods(["GET"])
def available_crops_view(request):
<<<<<<< HEAD
    lang = request.GET.get('lang', 'en')
    crops = [{'name_en': k, 'name': v.get(lang, k), 'translations': v} for k, v in CROP_TRANSLATIONS.items()]
    return JsonResponse({'success': True, 'crops': crops, 'count': len(crops)})
=======
    """
    Get list of available crops with translations
    """
    if request.user.is_authenticated:
        lang = getattr(request.user, 'language', 'en')
    else:
        lang = request.GET.get('lang', 'en')
    
    crops = []
    for eng_name, translations in CROP_TRANSLATIONS.items():
        crops.append({
            'name_en': eng_name,
            'name': translations.get(lang, eng_name),
            'translations': translations
        })
    
    return JsonResponse({
        'success': True,
        'crops': crops,
        'count': len(crops)
    })

def get_mandi_rates(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    search_query = request.GET.get('search') # For your manual search requirement
    
    district = None

    # If coordinates are provided, find the district
    if lat and lon:
        headers = {'User-Agent': 'FasalAIProtector/1.0'}
        geo_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        geo_response = requests.get(geo_url, headers=headers).json()
        
        # Extract the district (usually falls under state_district or county)
        address = geo_response.get('address', {})
        district = address.get('state_district', '').replace(' District', '')
    
    # If the user used the manual search bar instead of live location
    if search_query:
        district = search_query

    # Fetch Mandi rates (Example using a placeholder API/Database query)
    rates_data = fetch_rates_for_district(district) 
    
    return JsonResponse({
        "location_detected": district,
        "mandi_rates": rates_data
    })

def fetch_rates_for_district(district_name):
    # Here you would either query your own database of rates
    # OR make a request to the data.gov.in Mandi prices API filtering by state="Uttar Pradesh" and district=district_name
    
    # Dummy response structure
    return [
        {"crop": "Wheat", "price_per_quintal": 2275, "mandi": f"{district_name} Main Market"},
        {"crop": "Potato", "price_per_quintal": 1800, "mandi": f"{district_name} Main Market"}
    ]
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
