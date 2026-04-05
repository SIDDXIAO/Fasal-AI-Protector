from django.urls import path
from . import views

urlpatterns = [
    path('predict/', views.scanner_api, name='scanner_api'),
    path('save_scan/', views.save_scan_view, name='save_scan'),
    path('analytics/', views.get_analytics_view, name='get_analytics'),
    path('csrf-token/', views.get_csrf_token, name='csrf_token'),
    path('process_leaf_scan/', views.process_leaf_scan, name='process_leaf_scan'),
    path('dashboard-stats/', views.get_dashboard_stats, name='dashboard_stats'),
]