import os
import json
import requests
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.http import require_http_methods

# Full Crop Dictionary with translations
CROP_TRANSLATIONS = {
    'Wheat': {'hi': 'गेहूं', 'pa': 'ਕਣਕ', 'mr': 'गहू'},
    'Paddy': {'hi': 'धान', 'pa': 'ਝੋਨਾ', 'mr': 'भात'},
    'Bajra': {'hi': 'बाजरा', 'pa': 'ਬਾਜਰਾ', 'mr': 'बाजरी'},
    'Maize': {'hi': 'मक्का', 'pa': 'ਮੱਕੀ', 'mr': 'मका'},
    'Sugarcane': {'hi': 'गन्ना', 'pa': 'ਗੰਨਾ', 'mr': 'ऊस'},
    'Mustard': {'hi': 'सरसों', 'pa': 'ਸਰ੍ਹੋਂ', 'mr': 'मोहरी'},
    'Groundnut': {'hi': 'मूंगफली', 'pa': 'ਮੂੰਗਫਲੀ', 'mr': 'भुईमूग'},
    'Soybean': {'hi': 'सोयाबीन', 'pa': 'ਸੋਇਆਬੀਨ', 'mr': 'सोयाबीन'},
    'Arhar': {'hi': 'अरहर', 'pa': 'ਅਰਹਰ', 'mr': 'तूर'},
    'Moong': {'hi': 'मूंग', 'pa': 'ਮੂੰਗ', 'mr': 'मूग'},
    'Potato': {'hi': 'आलू', 'pa': 'ਆਲੂ', 'mr': 'बटाटा'},
    'Tomato': {'hi': 'टमाटर', 'pa': 'ਟਮਾਟਰ', 'mr': 'टोमॅटो'},
    'Brinjal': {'hi': 'बैंगन', 'pa': 'ਬੈਂਗਣ', 'mr': 'वांगी'},
    'Bottle Gourd': {'hi': 'लौकी', 'pa': 'ਘੀਆ', 'mr': 'दुधी भोपळा'},
    'Bitter Gourd': {'hi': 'करेला', 'pa': 'ਕਰੇਲਾ', 'mr': 'कारले'},
    'Cucumber': {'hi': 'खीरा', 'pa': 'ਖੀਰਾ', 'mr': 'काकडी'},
    'Pumpkin': {'hi': 'कद्दू', 'pa': 'ਕੱਦੂ', 'mr': 'भोपळा'},
    'Okra': {'hi': 'भिंडी', 'pa': 'ਭਿੰਡੀ', 'mr': 'भेंडी'},
    'Chilli': {'hi': 'मिर्च', 'pa': 'ਮਿਰਚ', 'mr': 'मिरची'},
    'Cauliflower': {'hi': 'फूलगोभी', 'pa': 'ਫੂਲਗੋਭੀ', 'mr': 'फ्लॉवर'},
    'Cabbage': {'hi': 'पत्तागोभी', 'pa': 'ਪੱਤਾਗੋਭੀ', 'mr': 'कोबी'},
    'Radish': {'hi': 'मूली', 'pa': 'ਮੂਲੀ', 'mr': 'मुळा'},
    'Ridge Gourd': {'hi': 'तोरई', 'pa': 'ਤੋਰੀ', 'mr': 'दोडका'},
    'Sponge Gourd': {'hi': 'नेनुआ', 'pa': 'ਨੇਨੂਆ', 'mr': 'गिलके'},
    'Pointed Gourd': {'hi': 'परवल', 'pa': 'ਪਰਵਲ', 'mr': 'पडवळ'},
    'Watermelon': {'hi': 'तरबूज', 'pa': 'ਤਰਬੂਜ', 'mr': 'कलिंगड'},
    'Muskmelon': {'hi': 'खरबूजा', 'pa': 'ਖਰਬੂਜਾ', 'mr': 'खरबूज'},
    'Cotton': {'hi': 'कपास', 'pa': 'ਕਪਾਹ', 'mr': 'कापूस'},
    'Rice': {'hi': 'चावल', 'pa': 'ਚੌਲ', 'mr': 'तांदूळ'},
}

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


@require_http_methods(["GET"])
def available_crops_view(request):
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
