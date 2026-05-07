# apps/scanner/views.py
import os
import json
import requests
from datetime import datetime, timedelta

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.conf import settings
from django.middleware.csrf import get_token
from django.utils import timezone

from apps.authentication.models import UserProfile
from .models import ScanHistory, CropInsectData
from .ml_service import detector, get_disease_treatment, _normalize, DatasetCache


# ═══════════════════════════════════════════════════════════════
#  CSRF TOKEN
# ═══════════════════════════════════════════════════════════════

def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})


# ═══════════════════════════════════════════════════════════════
#  HELPER: User resolve karo — session ya user_id se
# ═══════════════════════════════════════════════════════════════

def _get_user(request):
    """
    Priority 1: Django session (normal login)
    Priority 2: POST mein 'user_id' — localStorage fallback ke liye
    """
    if request.user.is_authenticated:
        return request.user

    user_id = request.POST.get('user_id') or request.GET.get('user_id') or request.headers.get('X-User-Id')
    if user_id:
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            return User.objects.get(id=int(user_id))
        except Exception:
            pass
    return None


# ═══════════════════════════════════════════════════════════════
#  PROCESS LEAF SCAN
#  URL: /api/scanner/process_leaf_scan/
# ═══════════════════════════════════════════════════════════════

@csrf_exempt
@require_http_methods(["POST"])
def process_leaf_scan(request):
    image_file = request.FILES.get('image') or request.FILES.get('file')
    if not image_file:
        return JsonResponse({'success': False, 'error': 'No image uploaded.'}, status=400)

    lat           = request.POST.get('fasal-lat') or request.POST.get('lat', '')
    lng           = request.POST.get('fasal-lng') or request.POST.get('lng', '')
    user_location = request.POST.get('location', 'Uttar Pradesh')

    if lat and lng:
        resolved = _resolve_location(lat, lng)
        if resolved:
            user_location = resolved

    # ── FIX 1: Image bytes pehle memory mein read karo ──────────
    # Temp file delete hone ke baad original file exhausted ho jaati thi
    image_bytes = image_file.read()
    image_name  = image_file.name or 'scan.jpg'

    # ── ML prediction ke liye temp file ─────────────────────────
    import tempfile
    from django.core.files.base import ContentFile

    suffix = os.path.splitext(image_name)[-1] or '.jpg'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        result = detector.predict(tmp_path, top_k=3, user_location=user_location)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    # ── FIX 2: User resolve karo (session + user_id fallback) ────
    user = _get_user(request)
    print(f"[SCAN] session_user={request.user} | resolved_user={user} | disease={result.get('top_disease')}")

    # ── FIX 3: ScanHistory save ──────────────────────────────────
    if user is not None:
        try:
            # ContentFile se fresh image object — original already read ho chuka tha
            fresh_image = ContentFile(image_bytes, name=image_name)

            severity = 'low'
            if not result.get('is_healthy', False):
                conf     = result.get('confidence', 0.0)
                severity = 'high' if conf > 0.8 else 'medium'

            scan_record = ScanHistory.objects.create(
                user             = user,
                image            = fresh_image,
                disease_name     = result.get('top_disease', ''),
                crop_name        = result.get('top_crop', ''),
                is_healthy       = result.get('is_healthy', False),
                confidence_score = result.get('confidence', 0.0),
                severity         = severity,
                remedy_data      = {
                    'treatments': result.get('treatments', []),
                    'reference':  result.get('reference_data'),
                    'llm_advice': result.get('llm_expert_advice', ''),
                }
            )

            # FIX 4: += increment nahi, DB se recount karo
            profile, _ = UserProfile.objects.get_or_create(user=user)
            all_scans              = ScanHistory.objects.filter(user=user)
            profile.total_scans    = all_scans.count()
            profile.healthy_scans  = all_scans.filter(is_healthy=True).count()
            profile.infected_scans = all_scans.filter(is_healthy=False).count()
            profile.save()

            print(f"[OK] Scan saved — ID:{scan_record.id} | user:{user.username} | {scan_record.crop_name} | {'Healthy' if scan_record.is_healthy else scan_record.disease_name}")

        except Exception as e:
            print(f"[ERROR] Scan save failed: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("[WARN] No user found — scan NOT saved. Check session/user_id.")

    return JsonResponse({
        'success':      True,
        'llm_advice':   result.get('llm_expert_advice', ''),
        'llm_location': user_location,
        **result,
    })


# ── Aliases ──────────────────────────────────────────────────────
@csrf_exempt
@require_http_methods(["POST"])
def scan_leaf(request):
    return process_leaf_scan(request)

@csrf_exempt
@require_http_methods(["POST"])
def scanner_api(request):
    return process_leaf_scan(request)


# ═══════════════════════════════════════════════════════════════
#  SAVE SCAN  (manual — legacy)
# ═══════════════════════════════════════════════════════════════

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def save_scan_view(request):
    try:
        body = json.loads(request.body)
        ScanHistory.objects.create(
            user             = request.user,
            disease_name     = body.get('disease_name', ''),
            crop_name        = body.get('crop_name', ''),
            is_healthy       = body.get('is_healthy', False),
            confidence_score = float(body.get('confidence_score', 0.0)),
        )
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


# ═══════════════════════════════════════════════════════════════
#  DASHBOARD STATS
#  URL: /api/scanner/dashboard-stats/
# ═══════════════════════════════════════════════════════════════

@require_http_methods(["GET"])
def get_dashboard_stats(request):
    user = _get_user(request)
    if user is None:
        return JsonResponse({
            'success': True,
            'total_scans': 0, 'healthy_count': 0, 'infected_count': 0, 'efficiency': '0%',
            'recent_scans': []
        })

    scans     = ScanHistory.objects.filter(user=user)
    total     = scans.count()
    healthy   = scans.filter(is_healthy=True).count()
    diseased  = total - healthy
    efficiency = f"{round((healthy / total) * 100)}%" if total > 0 else "0%"

    recent      = scans.order_by('-scanned_at')[:20]
    recent_list = []
    for s in recent:
        reference_detail = None
        if s.remedy_data:
            treatments       = s.remedy_data.get('treatments', [])
            reference        = s.remedy_data.get('reference')
            reference_detail = treatments if treatments else reference

        recent_list.append({
            'id':               s.id,
            'disease':          s.disease_name or 'Unknown',
            'disease_name':     s.disease_name or 'Unknown',
            'crop':             s.crop_name    or 'Unknown',
            'is_healthy':       s.is_healthy,
            'confidence':       s.confidence_score,
            'severity':         s.severity,
            'date':             s.scanned_at.isoformat(),
            'image_url':        request.build_absolute_uri(s.image.url) if s.image else None,
            'reference_detail': reference_detail,
        })

    return JsonResponse({
        'success':        True,
        'total_scans':    total,
        'healthy_count':  healthy,
        'infected_count': diseased,
        'efficiency':     efficiency,
        'recent_scans':   recent_list,
    })


# ═══════════════════════════════════════════════════════════════
#  ANALYTICS
#  URL: /api/scanner/analytics/
# ═══════════════════════════════════════════════════════════════

@require_http_methods(["GET"])
def get_analytics_view(request):
    user = _get_user(request)
    if user is None:
        return JsonResponse({
            'success': True,
            'scans': [],
            'stats': {'total': 0, 'healthy': 0, 'infected': 0},
            'weekly': {'labels': ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], 'data': [0,0,0,0,0,0,0]},
            'trend_labels': ['Week 1','Week 2','Week 3','Week 4'],
            'trend_data':   [0, 0, 0, 0],
            'health_data':  [1, 0],
        })

    qs       = ScanHistory.objects.filter(user=user)
    total    = qs.count()
    healthy  = qs.filter(is_healthy=True).count()
    infected = total - healthy

    today       = timezone.now().date()
    day_names   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    week_labels, week_data = [], []
    for i in range(6, -1, -1):
        day   = today - timedelta(days=i)
        count = qs.filter(scanned_at__date=day).count()
        week_labels.append(day_names[day.weekday()])
        week_data.append(count)

    trend_labels, trend_data = [], []
    for w in range(3, -1, -1):
        week_start = today - timedelta(weeks=w + 1)
        week_end   = today - timedelta(weeks=w)
        count = qs.filter(scanned_at__date__gte=week_start, scanned_at__date__lt=week_end).count()
        trend_labels.append(f"Week {4 - w}")
        trend_data.append(count)

    scans_data = [
        {
            'disease_name':     s.disease_name,
            'is_healthy':       s.is_healthy,
            'confidence_score': s.confidence_score,
            'scanned_at':       s.scanned_at.isoformat(),
        }
        for s in qs.order_by('-scanned_at')[:50]
    ]

    return JsonResponse({
        'success': True,
        'scans':   scans_data,
        'stats':   {'total': total, 'healthy': healthy, 'infected': infected},
        'weekly':  {'labels': week_labels, 'data': week_data},
        'trend_labels': trend_labels,
        'trend_data':   trend_data,
        'health_data':  [healthy, infected] if total > 0 else [1, 0],
    })


# ═══════════════════════════════════════════════════════════════
#  LOCATION INFO
# ═══════════════════════════════════════════════════════════════

@require_http_methods(["GET"])
def location_info(request):
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    if not lat or not lng:
        return JsonResponse({'success': False, 'error': 'lat/lng required'}, status=400)

    cache_key = f'location_info_{lat}_{lng}'
    cached    = cache.get(cache_key)
    if cached:
        return JsonResponse(cached)

    district, state, pincode = 'Lucknow', 'Uttar Pradesh', ''
    try:
        addr     = requests.get(
            f'https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json',
            headers={'Accept-Language': 'en', 'User-Agent': 'FasalAI/1.0'}, timeout=5,
        ).json().get('address', {})
        district = addr.get('county') or addr.get('state_district') or addr.get('city') or addr.get('town') or 'Lucknow'
        state    = addr.get('state', 'Uttar Pradesh')
        pincode  = addr.get('postcode', '')
    except Exception as e:
        print(f'[LocationInfo] Geocode failed: {e}')

    month  = datetime.now().month
    season = 'Zaid' if month in (3,4,5,6) else ('Kharif' if month in (7,8,9,10) else 'Rabi')

    response_data = {
        'success': True, 'district': district, 'state': state,
        'pincode': pincode, 'season': season,
        'fertilizer_tips': _get_fertilizer_tips(),
        'common_diseases': list(
            CropInsectData.objects.filter(district__icontains=district)
            .values_list('insect_name', flat=True).distinct()[:8]
        ),
    }
    cache.set(cache_key, response_data, 3600)
    return JsonResponse(response_data)


# ═══════════════════════════════════════════════════════════════
#  MANDI RATES
# ═══════════════════════════════════════════════════════════════

@require_http_methods(["GET"])
def mandi_rates(request):
    district = request.GET.get('district', '')
    state    = request.GET.get('state', 'Uttar Pradesh')
    pincode  = request.GET.get('pincode', '')
    cache_key = f'mandi_rates_{district}_{state}_{pincode}'
    cached    = cache.get(cache_key)
    if cached:
        return JsonResponse(cached)

    api_key = getattr(settings, 'MANDI_API_KEY', '')
    params  = {'api-key': api_key, 'format': 'json', 'offset': 0, 'limit': 500}
    if state:    params['filters[state.keyword]']    = state
    if district: params['filters[district.keyword]'] = district

    try:
        records = requests.get(
            'https://api.data.gov.in/resource/35985678-0d79-46b4-9cd6-6f13308a1d24',
            params=params, timeout=10
        ).json().get('records', [])
        rates  = [
            {'crop': r.get('commodity','Unknown'), 'price': float(r.get('modal_price',0) or 0),
             'prev': float(r.get('min_price',0) or 0), 'market': r.get('market','Local'),
             'date': r.get('price date',''), 'unit': 'qtl'}
            for r in records if r.get('commodity')
        ]
        result = {'success': True, 'rates': rates, 'total': len(rates)}
        cache.set(cache_key, result, 900)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'success': False, 'rates': [], 'error': str(e)})


@require_http_methods(["GET"])
def mandi_search(request):
    q        = request.GET.get('q', '').strip().lower()
    all_rates = cache.get('mandi_rates_all') or []
    filtered  = [r for r in all_rates if q in r.get('crop','').lower() or q in r.get('market','').lower()]
    return JsonResponse({'success': True, 'rates': filtered})


# ═══════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════

def _resolve_location(lat, lng) -> str:
    try:
        addr     = requests.get(
            f'https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json',
            headers={'Accept-Language': 'en', 'User-Agent': 'FasalAI/1.0'}, timeout=4,
        ).json().get('address', {})
        district = addr.get('county') or addr.get('state_district') or addr.get('city') or addr.get('town') or ''
        return f"{district}, {addr.get('state','')}".strip(', ')
    except Exception:
        return ''


def _get_fertilizer_tips() -> list:
    month  = datetime.now().month
    season = 'Zaid' if month in (3,4,5,6) else ('Kharif' if month in (7,8,9,10) else 'Rabi')
    tips   = {
        'Rabi':   ['Wheat mein DAP 50 kg/acre baaye.', 'Mustard mein Sulphur 8 kg/acre zaroor dein.', 'Irrigation ke saath Urea ki top dressing karein.'],
        'Kharif': ['Paddy mein transplanting ke baad 10 din mein Urea dein.', 'Maize mein Zinc Sulphate 25 kg/acre uplabdh hai.', 'Soybean mein Rhizobium culture ka use zaroor karein.'],
        'Zaid':   ['Sabziyon mein NPK 19:19:19 pani mein ghol ke dein.', 'Tomato mein Calcium Nitrate spray kare.', 'Zyada garmi mein mulching karein taki naami bani rahe.'],
    }
    return tips.get(season, tips['Rabi'])