"""
Authentication Views - Login, Signup, Logout
"""
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
import json

from .models import User, UserProfile


@ensure_csrf_cookie
@require_http_methods(["POST"])
def signup_view(request):
    """User registration"""
    try:
        data = json.loads(request.body)

        # Validate required fields
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('fullName', '')
        phone = data.get('phone', '')
        location = data.get('location', '')

        if not all([username, email, password]):
            return JsonResponse({
                'success': False,
                'message': 'Username, email and password are required'
            }, status=400)

        # Check if user exists
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'success': False,
                'message': 'Username already exists'
            }, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Email already registered'
            }, status=400)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Set additional fields
        if full_name:
            name_parts = full_name.split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''

        user.phone = phone
        user.location = location
        user.save()

        # Create profile
        UserProfile.objects.get_or_create(user=user)

        # Auto login
        login(request, user)

        return JsonResponse({
            'success': True,
            'message': 'Account created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name
            }
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }, status=500)


@ensure_csrf_cookie
@require_http_methods(["POST"])
def login_view(request):
    """User login"""
    try:
        data = json.loads(request.body)

        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return JsonResponse({
                'success': False,
                'message': 'Username and password are required'
            }, status=400)

        # Authenticate
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)

            # Get or create profile stats
            profile, _ = UserProfile.objects.get_or_create(user=user)

            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'full_name': user.full_name,
                    'phone': user.phone,
                    'location': user.location,
                    'stats': {
                        'total_scans': profile.total_scans,
                        'healthy_scans': profile.healthy_scans,
                        'infected_scans': profile.infected_scans
                    }
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid username or password'
            }, status=401)

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Login failed: {str(e)}'
        }, status=500)


@require_http_methods(["POST"])
def logout_view(request):
    """User logout"""
    logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Logged out successfully'
    })


@require_http_methods(["GET"])
def check_auth_view(request):
    """Check if user is authenticated (for page refresh persistence)"""
    if request.user.is_authenticated:
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone or '',
                'location': user.location or '',
                'stats': {
                    'total_scans': profile.total_scans,
                    'healthy_scans': profile.healthy_scans,
                    'infected_scans': profile.infected_scans
                }
            }
        })
    return JsonResponse({'authenticated': False})


@login_required
@require_http_methods(["GET"])
def profile_view(request):
    """Get user profile"""
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)

    return JsonResponse({
        'success': True,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'phone': user.phone,
            'location': user.location,
            'language': user.language,
            'stats': {
                'total_scans': profile.total_scans,
                'healthy_scans': profile.healthy_scans,
                'infected_scans': profile.infected_scans
            }
        }
    })


@login_required
@require_http_methods(["PUT"])
def update_profile_view(request):
    """Update user profile"""
    try:
        data = json.loads(request.body)
        user = request.user

        if 'fullName' in data:
            name_parts = data['fullName'].split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''

        if 'phone' in data:
            user.phone = data['phone']

        if 'location' in data:
            user.location = data['location']

        if 'language' in data:
            user.language = data['language']

        user.save()

        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully'
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Update failed: {str(e)}'
        }, status=500)


@login_required
@require_http_methods(["DELETE"])
def delete_profile_view(request):
    """Delete user account and profile permanently"""
    try:
        user = request.user
        logout(request)
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Account deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Deletion failed: {str(e)}'
        }, status=500)
