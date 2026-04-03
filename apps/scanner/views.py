from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from .ml_service import detector
from .models import ScanHistory
import json
from django.db.models import Count
from django.utils import timezone
import datetime
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os


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

        # Predict
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
    """Save scan result to history"""
    try:
        data = json.loads(request.body)

        # Skip saving if user is not authenticated
        if not request.user.is_authenticated:
            return JsonResponse({'success': True, 'skipped': 'User not authenticated'})

        # Look up disease FK if name provided
        from .models import PlantDisease
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

    # Daily counts
    daily_stats = (
        ScanHistory.objects
        .filter(scanned_at__date__gte=week_start)
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
    total = ScanHistory.objects.count()
    healthy = ScanHistory.objects.filter(is_healthy=True).count()
    infected = total - healthy

    return JsonResponse({
        'success': True,
        'weekly': {'labels': days, 'data': counts},
        'stats': {'total': total, 'healthy': healthy, 'infected': infected}
    })
