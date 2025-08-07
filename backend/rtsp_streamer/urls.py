"""
URL configuration for rtsp_streamer project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'message': 'RTSP Streamer API is running',
        'version': '1.0.0'
    })

def api_info(request):
    return JsonResponse({
        'name': 'RTSP Stream Viewer API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health/',
            'streams': '/api/streams/',
            'websocket': '/ws/stream/{stream_id}/'
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', api_info, name='api_info'),
    path('api/health/', health_check, name='health_check'),
    path('api/', include('streaming.urls')),
]