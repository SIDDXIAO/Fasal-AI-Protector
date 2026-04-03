
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
import os

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Apps
    path('api/auth/', include('apps.authentication.urls')),
    path('api/scanner/', include('apps.scanner.urls')),
    path('api/weather/', include('apps.weather.urls')),
    path('api/market/', include('apps.market.urls')),
    path('api/assistant/', include('apps.assistant.urls')),  # AI Assistant
    
    # Service Worker (must be served from root scope)
    path('sw.js', serve, {
        'path': 'sw.js',
        'document_root': os.path.join(settings.BASE_DIR, 'static'),
    }, name='sw.js'),

    # Frontend
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
