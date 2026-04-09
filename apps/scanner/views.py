# apps/scanner/views.py
from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from django.db.models import Count
from django.utils import timezone
import datetime
import os
import requests as http_requests
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json

from .ml_service import detector
from .models import ScanHistory, PlantDisease
from .utils import scan_leaf_image

def get_csrf_token(request):
    """Return CSRF token for frontend to use in requests"""
    return JsonResponse({'csrfToken': get_token(request)})


@require_http_methods(["POST"])
def scanner_api(request):
    file_name = None
    try:
        if 'image' not in request.FILES:
            return JsonResponse({'error': 'No image uploaded'}, status=400)

        image = request.FILES['image']
        location = request.POST.get('location', 'Unknown')

        # Save temp file and get its absolute OS path via default_storage
        file_name = default_storage.save(f"temp/{image.name}", ContentFile(image.read()))
        file_path = default_storage.path(file_name)

        # Predict using your ML service
        result = detector.predict(file_path, user_location=location)

        return JsonResponse(result)
    except Exception as e:
        import traceback
        print(f"Scanner Error: {str(e)}")
        traceback.print_exc()
        return JsonResponse({'error': f"Analysis failed: {str(e)}"}, status=500)
    finally:
        # Cleanup temp file after prediction is done
        if file_name and default_storage.exists(file_name):
            try:
                default_storage.delete(file_name)
            except Exception as cleanup_error:
                print(f"Cleanup Error: {cleanup_error}")


@require_http_methods(["POST"])
def save_scan_view(request):
    """Save scan result to history (Manual/Legacy Route)"""
    try:
        data = json.loads(request.body)

        # Skip saving if user is not authenticated
        if not request.user.is_authenticated:
            return JsonResponse({'success': True, 'skipped': 'User not authenticated'})

        # Look up disease FK if name provided
        disease_obj = None
        disease_name = data.get('disease', '')
        if disease_name and disease_name != 'Unknown':
            disease_obj = PlantDisease.objects.filter(name__icontains=disease_name).first()

        # Save to DB
        scan = ScanHistory.objects.create(
            user=request.user,
            disease=disease_obj,
            is_healthy=data.get('is_healthy', False),
            confidence=data.get('confidence', 0.0),
            predictions=data.get('predictions', {}),
            scan_method='upload'
        )

        return JsonResponse({'success': True, 'id': scan.id})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@require_http_methods(["GET"])
def get_analytics_view(request):
    """Get analytics data for charts"""

    # 7-day stats
    today = timezone.now().date()
    week_start = today - datetime.timedelta(days=6)

    # Filter by user if authenticated, otherwise show all
    scans_qs = ScanHistory.objects.filter(scanned_at__date__gte=week_start)
    if request.user.is_authenticated:
        scans_qs = scans_qs.filter(user=request.user)

    # Daily counts
    daily_stats = (
        scans_qs
        .values('scanned_at__date')
        .annotate(count=Count('id'))
        .order_by('scanned_at__date')
    )

    # Map to 7-day list
    days = [(week_start + datetime.timedelta(days=i)).strftime('%a') for i in range(7)]
    counts = [0] * 7

    for stat in daily_stats:
        date_idx = (stat['scanned_at__date'] - week_start).days
        if 0 <= date_idx < 7:
            counts[date_idx] = stat['count']

    # Total stats
    all_user_scans = ScanHistory.objects.all()
    if request.user.is_authenticated:
        all_user_scans = all_user_scans.filter(user=request.user)

    total = all_user_scans.count()
    healthy = all_user_scans.filter(is_healthy=True).count()
    infected = total - healthy

    return JsonResponse({
        'success': True,
        'weekly': {'labels': days, 'data': counts},
        'stats': {'total': total, 'healthy': healthy, 'infected': infected}
    })


@csrf_exempt # Use this if you are testing via Postman without CSRF tokens yet
def process_leaf_scan(request):
    """Process scan, save to DB automatically, and return results"""
    if request.method == 'POST' and request.FILES.get('leaf_image'):
        # 1. Get the uploaded image
        uploaded_image = request.FILES['leaf_image']
        
        # 2. Pass it to your ML utility function
        result = scan_leaf_image(uploaded_image)
        
        # 3. Automatically save the result to the Database if user is logged in
        if request.user.is_authenticated:
            # Try to match the predicted disease name with the PlantDisease table
            disease_name = result.get('disease_detected', '')
            disease_obj = None
            if disease_name:
                disease_obj = PlantDisease.objects.filter(name__icontains=disease_name).first()

            # Determine healthy status (adjust this logic based on how your ML returns status)
            is_healthy = False
            if result.get('status', '').lower() == 'healthy':
                is_healthy = True

            # Save the record
            ScanHistory.objects.create(
                user=request.user,
                image=uploaded_image, # Save the image file as well
                disease=disease_obj,
                is_healthy=is_healthy,
                confidence=result.get('confidence_score', 0.0),
                scan_method='upload'
            )
            
        # 4. Return the JSON response to the frontend
        return JsonResponse(result)
        
    return JsonResponse({"error": "Please upload an image via POST request."}, status=400)


@login_required
def get_dashboard_stats(request):
    """API for the frontend to fetch current user's stats and history"""
    
    # Fetch only the logged-in user's scans
    user_scans = ScanHistory.objects.filter(user=request.user)
    
    # Calculate counts
    total_scans = user_scans.count()
    healthy_count = user_scans.filter(is_healthy=True).count()
    infected_count = user_scans.filter(is_healthy=False).count()
    
    # Fetch the 10 most recent scans for the history tab
    recent_scans_qs = user_scans.order_by('-scanned_at')[:10]
    
    # Use the `result_json` property defined in your models.py
    recent_scans = [scan.result_json for scan in recent_scans_qs]

    # Calculate average confidence for "Efficiency" metric
    avg_confidence = "0%"
    if total_scans > 0:
        conf_sum = sum([scan.confidence for scan in user_scans])
        avg_confidence = f"{round((conf_sum / total_scans) * 100, 1)}%"

    return JsonResponse({
        "total_scans": total_scans,
        "healthy_count": healthy_count,
        "infected_count": infected_count,
        "efficiency": avg_confidence,
        "recent_scans": recent_scans
    })


# ═══════════════════════════════════════════════════════════════════
# U.P. RELEASE — NEW ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@require_http_methods(["POST"])
def scan_leaf(request):
    """
    Enhanced scan endpoint: runs ViT prediction + enriches with LLM advice.
    Accepts same FormData as scanner_api (field: 'image').
    Returns everything scanner_api returns PLUS 'llm_advice'.
    """
    file_name = None
    try:
        if 'image' not in request.FILES:
            return JsonResponse({'error': 'No image uploaded'}, status=400)

        image = request.FILES['image']
        location = request.POST.get('location', 'Uttar Pradesh')
        lat = request.POST.get('lat', '')
        lng = request.POST.get('lng', '')

        # Save temp file
        file_name = default_storage.save(f"temp/{image.name}", ContentFile(image.read()))
        file_path = default_storage.path(file_name)

        # ViT Prediction
        result = detector.predict(file_path, user_location=location)

        # LLM enrichment via llm_advisor
        try:
            from dataset_loader import get_disease_context
            from llm_advisor import enrich_scan_response

            predicted_class = f"{result.get('top_crop', 'Unknown')}___{result.get('top_disease', 'Unknown')}"
            disease_context = get_disease_context(predicted_class, district=location)
            location_dict = {'district': location, 'lat': lat, 'lng': lng}
            result = enrich_scan_response(result, disease_context, location_dict)
        except Exception as llm_err:
            print(f"[scan_leaf] LLM enrichment skipped: {llm_err}")
            result['llm_advice'] = result.get('llm_expert_advice', '')

        return JsonResponse(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f"Scan failed: {str(e)}"}, status=500)
    finally:
        if file_name and default_storage.exists(file_name):
            try:
                default_storage.delete(file_name)
            except Exception:
                pass


@require_http_methods(["GET"])
def location_info(request):
    """
    GPS → district lookup → fertilizer advice + local disease data.

    Query params:
        lat    : float  e.g. 26.85
        lng    : float  e.g. 80.91
        crop   : str    optional e.g. "Wheat"

    Returns:
        district, state, fertilizer_tips, common_diseases, season
    """
    try:
        lat = request.GET.get('lat', '')
        lng = request.GET.get('lng', '')
        crop = request.GET.get('crop', '')

        if not lat or not lng:
            return JsonResponse({'error': 'lat and lng are required'}, status=400)

        # Reverse geocode via OpenStreetMap Nominatim (free, no API key)
        district = 'Unknown'
        state = 'Uttar Pradesh'
        try:
            nominatim_url = (
                f"https://nominatim.openstreetmap.org/reverse"
                f"?lat={lat}&lon={lng}&format=json&addressdetails=1"
            )
            headers = {'User-Agent': 'FasalAIProtector/1.0'}
            geo_res = http_requests.get(nominatim_url, headers=headers, timeout=5)
            if geo_res.ok:
                addr = geo_res.json().get('address', {})
                district = (
                    addr.get('county') or addr.get('district') or
                    addr.get('city') or addr.get('town') or 'Unknown'
                )
                state = addr.get('state', 'Uttar Pradesh')
        except Exception as geo_err:
            print(f"[location_info] Nominatim failed: {geo_err}")

        # Fertilizer recommendations per district/crop
        fertilizer_tips = _get_fertilizer_for_district(district, crop)

        # Common diseases in this district from DatasetCache
        common_diseases = []
        try:
            from dataset_loader import get_local_district_info
            local_info = get_local_district_info(district)
            common_diseases = local_info.get('common_diseases', [])[:6]
        except Exception:
            pass

        # Current season
        month = datetime.datetime.now().month
        if month in [11, 12, 1, 2, 3]:
            season = 'Rabi (Winter)'
        elif month in [6, 7, 8, 9, 10]:
            season = 'Kharif (Monsoon)'
        else:
            season = 'Zaid (Summer)'

        return JsonResponse({
            'success': True,
            'district': district,
            'state': state,
            'lat': lat,
            'lng': lng,
            'season': season,
            'fertilizer_tips': fertilizer_tips,
            'common_diseases': common_diseases,
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def _get_fertilizer_for_district(district: str, crop: str) -> list:
    """Hardcoded fertilizer recommendations for common U.P. crops."""
    crop_lower = (crop or '').lower()
    tips = []

    base = {
        'wheat':      ['Urea: 120 kg/acre before sowing',  'DAP: 50 kg/acre at sowing',    'Potash: 25 kg/acre if soil test low'],
        'paddy':      ['Urea: 100 kg/acre split 3 doses',   'DAP: 60 kg in nursery',        'Zinc Sulphate: 25 kg if deficiency'],
        'sugarcane':  ['Urea: 200 kg/acre in 3 splits',     'DAP: 80 kg at planting',       'Potash: 60 kg/acre'],
        'mustard':    ['Urea: 60 kg/acre', 'DAP: 40 kg at sowing', 'Sulphur: 20 kg/acre boosts yield'],
        'potato':     ['DAP: 80 kg/acre', 'Potash: 80 kg/acre', 'Urea: 80 kg in 2 splits'],
        'maize':      ['Urea: 140 kg/acre in 3 splits', 'DAP: 60 kg at sowing', 'Zinc: 25 kg if deficiency'],
        'tomato':     ['DAP: 60 kg/acre', 'Urea: 80 kg in splits', 'Potash: 50 kg + micronutrients'],
        'bajra':      ['Urea: 60 kg/acre', 'DAP: 30 kg at sowing'],
    }

    for key, vals in base.items():
        if key in crop_lower:
            tips = vals
            break

    if not tips:
        tips = [
            'Apply 40-50 kg DAP per acre at sowing',
            'Apply Urea in 2-3 split doses as per crop stage',
            'Conduct soil test for best results — contact local KVK',
        ]

    return tips


@require_http_methods(["GET"])
def mandi_rates(request):
    """
    Returns mandi rates from mandi_rates.json, optionally filtered.

    Query params:
        district : str  optional filter by district
        crop     : str  optional filter by crop name

    Returns:
        list of mandi rate objects
    """
    try:
        mandi_path = os.path.join(settings.BASE_DIR, 'mandi_rates.json')
        if not os.path.exists(mandi_path):
            return JsonResponse({'error': 'mandi_rates.json not found'}, status=404)

        with open(mandi_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # data may be a list or dict with a 'rates' key
        rates = data if isinstance(data, list) else data.get('rates', data.get('data', []))

        district_q = request.GET.get('district', '').lower().strip()
        crop_q = request.GET.get('crop', '').lower().strip()

        if district_q:
            rates = [r for r in rates if district_q in str(r.get('district', r.get('market', ''))).lower()]
        if crop_q:
            rates = [r for r in rates if crop_q in str(r.get('crop', r.get('commodity', ''))).lower()]

        return JsonResponse({'success': True, 'count': len(rates), 'rates': rates})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def mandi_search(request):
    """
    Full-text search across mandi_rates.json.

    Query params:
        q : str  search query e.g. "Wheat Agra"

    Returns:
        filtered list of mandi rate objects (max 50)
    """
    try:
        q = request.GET.get('q', '').lower().strip()
        if not q:
            return JsonResponse({'error': 'q parameter required'}, status=400)

        mandi_path = os.path.join(settings.BASE_DIR, 'mandi_rates.json')
        if not os.path.exists(mandi_path):
            return JsonResponse({'error': 'mandi_rates.json not found'}, status=404)

        with open(mandi_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        rates = data if isinstance(data, list) else data.get('rates', data.get('data', []))

        # Score each entry by how many query words it matches
        words = q.split()
        scored = []
        for r in rates:
            haystack = json.dumps(r, ensure_ascii=False).lower()
            score = sum(1 for w in words if w in haystack)
            if score > 0:
                scored.append((score, r))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = [r for _, r in scored[:50]]

        return JsonResponse({'success': True, 'count': len(results), 'rates': results, 'query': q})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

