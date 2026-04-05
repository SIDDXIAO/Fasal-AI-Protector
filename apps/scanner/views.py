# apps/scanner/views.py
from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from django.db.models import Count
from django.utils import timezone
import datetime
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