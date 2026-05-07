<<<<<<< HEAD
# apps/scanner/urls.py

=======
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
from django.urls import path
from . import views

urlpatterns = [
<<<<<<< HEAD
    # ── CSRF ────────────────────────────────────────────────────
    path('csrf-token/',         views.get_csrf_token,       name='csrf_token'),

    # ── SCAN (main endpoint) ─────────────────────────────────────
    path('process_leaf_scan/',  views.process_leaf_scan,    name='process_leaf_scan'),
    path('scan/',               views.process_leaf_scan,    name='api_scan'),   # alias

    # ── DASHBOARD & ANALYTICS ────────────────────────────────────
    path('dashboard-stats/',    views.get_dashboard_stats,  name='dashboard_stats'),
    path('analytics/',          views.get_analytics_view,   name='get_analytics'),

    # ── LEGACY ENDPOINTS ─────────────────────────────────────────
    path('predict/',            views.scanner_api,          name='scanner_api'),
    path('save_scan/',          views.save_scan_view,       name='save_scan'),

    # ── LOCATION / MANDI ─────────────────────────────────────────
    path('location-info/',      views.location_info,        name='api_location_info'),
    path('mandi/rates/',        views.mandi_rates,          name='api_mandi_rates'),
    path('mandi/search/',       views.mandi_search,         name='api_mandi_search'),
=======
    path('predict/',            views.scanner_api,        name='scanner_api'),
    path('save_scan/',          views.save_scan_view,     name='save_scan'),
    path('analytics/',          views.get_analytics_view, name='get_analytics'),
    path('csrf-token/',         views.get_csrf_token,     name='csrf_token'),
    path('process_leaf_scan/',  views.process_leaf_scan,  name='process_leaf_scan'),
    path('dashboard-stats/',    views.get_dashboard_stats, name='dashboard_stats'),

    # ── U.P. Release endpoints ──────────────────────────────────────
    path('scan/',               views.scan_leaf,           name='api_scan'),
    path('location-info/',      views.location_info,       name='api_location_info'),
    path('mandi/rates/',        views.mandi_rates,         name='api_mandi_rates'),
    path('mandi/search/',       views.mandi_search,        name='api_mandi_search'),
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
]