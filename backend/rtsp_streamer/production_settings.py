"""
Production settings for rtsp_streamer project.
"""

import os
import dj_database_url
from .settings import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Production hosts
ALLOWED_HOSTS = ['*']  # Configure this with your actual domain

# Database for production
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }

# Redis configuration for production
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [REDIS_URL],
        },
    },
}

# CORS for production - Update these with your actual domains
CORS_ALLOWED_ORIGINS = [
    "https://your-vercel-app.vercel.app",  # Replace with your Vercel domain
    "https://your-custom-domain.com",     # Replace with your custom domain if any
]

CORS_ALLOW_ALL_ORIGINS = False  # Set to False in production

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Static files settings for production
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'streaming': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}