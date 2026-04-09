"""
AI Assistant Views - API Endpoints
"""
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
import json
import re
from django.conf import settings as app_settings

# Dynamic model switching based on AI_PROVIDER in .env
if getattr(app_settings, 'AI_PROVIDER', 'mistral') == 'gemma':
    from .gemma_service import assistant
else:
    from .mistral_service import assistant

from apps.scanner.models import CropInsectData


LANG_INSTRUCTIONS = {
    'hi-IN':  'CRITICAL: User is writing in Hindi. You MUST reply ONLY in Hindi Devanagari script. Do NOT use English except for pesticide names (e.g. Mancozeb, Carbendazim) and scientific/technical terms.',
    'en-IN':  'CRITICAL: User is writing in English. Reply in clear, helpful English.',
    'pa-IN':  'CRITICAL: User is writing in Punjabi. Reply in Punjabi Gurmukhi script.',
    'bn-IN':  'CRITICAL: User is writing in Bengali. Reply in Bengali script.',
    'ta-IN':  'CRITICAL: User is writing in Tamil. Reply in Tamil script.',
    'te-IN':  'CRITICAL: User is writing in Telugu. Reply in Telugu script.',
    'kn-IN':  'CRITICAL: User is writing in Kannada. Reply in Kannada script.',
    'ml-IN':  'CRITICAL: User is writing in Malayalam. Reply in Malayalam script.',
    'gu-IN':  'CRITICAL: User is writing in Gujarati. Reply in Gujarati script.',
    'or-IN':  'CRITICAL: User is writing in Odia. Reply in Odia script.',
}


def _extract_lang_and_clean(message):
    """Extract [LANG:xx-XX] tag from message, return (clean_message, lang_code)"""
    match = re.match(r'^\[LANG:([a-z]{2}-[A-Z]{2})\]\s*', message)
    if match:
        lang = match.group(1)
        clean_msg = message[match.end():].strip()
        return clean_msg, lang
    return message, 'en-IN'


def _encode_stream(generator):
    """
    Wraps any generator and encodes str chunks to bytes.
    StreamingHttpResponse requires Iterable[bytes], not str.
    """
    for chunk in generator:
        if isinstance(chunk, bytes):
            yield chunk
        elif isinstance(chunk, str):
            yield chunk.encode('utf-8')


@ensure_csrf_cookie
@require_http_methods(["POST"])
def assistant_chat_view(request):
    """API endpoint for AI Assistant chat (Streaming)"""
    try:
        data = json.loads(request.body)
        raw_message = data.get('message', '')
        client_lang = data.get('lang', '')

        if not raw_message:
            return JsonResponse({'error': 'Message required'}, status=400)

        # Extract language tag embedded by frontend
        user_message, detected_lang = _extract_lang_and_clean(raw_message)

        # Prefer client-sent lang over parsed tag
        final_lang = client_lang or detected_lang

        # Build language instruction to inject into system prompt
        lang_instruction = LANG_INSTRUCTIONS.get(final_lang, LANG_INSTRUCTIONS['en-IN'])

        # Inject language instruction into the message context
        message_with_lang = f"{lang_instruction}\n\nUser question: {user_message}"

        # Return Streaming Response — encode str → bytes to satisfy Django's type requirement
        return StreamingHttpResponse(
            _encode_stream(assistant.chat_stream(message_with_lang)),
            content_type='text/event-stream'
        )

    except Exception as e:
        print(f"Assistant Error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def search_pesticides_view(request):
    """Search pesticides by crop or disease"""
    query = request.GET.get('q', '')
    crop = request.GET.get('crop', '')

    if not query and not crop:
        return JsonResponse({'success': False, 'error': 'Query or crop required'})

    results = CropInsectData.objects.filter(
        crop__icontains=crop if crop else query
    )[:20]

    pesticides = []
    seen = set()

    for record in results:
        if record.pesticide_options and record.pesticide_options not in seen:
            pesticides.append({
                'name': record.pesticide_options,
                'crop': record.crop,
                'disease': record.insect_name,
                'price': record.mrp_2026,
                'application': record.application_method,
                'control_time': record.best_control_time
            })
            seen.add(record.pesticide_options)

    return JsonResponse({
        'success': True,
        'pesticides': pesticides,
        'count': len(pesticides)
    })


@require_http_methods(["GET"])
def crop_recommendations_view(request):
    """Get crop recommendations by season and location"""
    season = request.GET.get('season', 'Rabi')
    district = request.GET.get('district', '')

    crops = CropInsectData.objects.filter(
        season__icontains=season
    ).values('crop').distinct()[:20]

    crop_list = [c['crop'] for c in crops if c['crop']]

    return JsonResponse({
        'success': True,
        'season': season,
        'crops': crop_list,
        'count': len(crop_list)
    })


@require_http_methods(["GET"])
def price_comparison_view(request):
    """Compare prices for a specific pesticide/fertilizer"""
    pesticide = request.GET.get('pesticide', '')

    if not pesticide:
        return JsonResponse({'success': False, 'error': 'Pesticide name required'})

    records = CropInsectData.objects.filter(
        pesticide_options__icontains=pesticide
    ).exclude(mrp_2026='')[:10]

    prices = []
    for record in records:
        if record.mrp_2026:
            prices.append({
                'pesticide': record.pesticide_options,
                'price': record.mrp_2026,
                'crop': record.crop,
                'disease': record.insect_name,
                'location': f"{record.district}, {record.village}"
            })

    return JsonResponse({
        'success': True,
        'prices': prices,
        'count': len(prices)
    })