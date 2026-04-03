"""
FasAi Protector - Django Settings
"""
import os
from pathlib import Path
from decouple import config

# Disable ChromaDB telemetry
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_ANONYMIZED_TELEMETRY"] = "False"

BASE_DIR = Path(__file__).resolve().parent.parent

# ═══════════════════════════════════════
# Security
# ═══════════════════════════════════════
SECRET_KEY = config('SECRET_KEY', default='django-insecure-temp-key-change-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [h.strip() for h in v.split(',')])

# ═══════════════════════════════════════
# Applications
# ═══════════════════════════════════════
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'corsheaders',

    # Custom apps
    'apps.authentication',
    'apps.scanner',
    'apps.weather',
    'apps.market',
    'apps.assistant',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ═══════════════════════════════════════
# Database — SQLite
# ═══════════════════════════════════════
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ═══════════════════════════════════════
# Custom User Model
# ═══════════════════════════════════════
AUTH_USER_MODEL = 'authentication.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ═══════════════════════════════════════
# Internationalization
# ═══════════════════════════════════════
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ═══════════════════════════════════════
# Static & Media Files
# ═══════════════════════════════════════
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# WhiteNoise for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# ═══════════════════════════════════════
# CORS Settings
# ═══════════════════════════════════════
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:8000,http://127.0.0.1:8000',
    cast=lambda v: [o.strip() for o in v.split(',')]
)
CORS_ALLOW_CREDENTIALS = True

# ═══════════════════════════════════════
# REST Framework
# ═══════════════════════════════════════
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}

# ═══════════════════════════════════════
# AI Model Settings
# ═══════════════════════════════════════
AI_MODEL_PATH = BASE_DIR / 'models'
CNN_MODEL_PATH = AI_MODEL_PATH / 'plant_disease_cnn.h5'

# ═══════════════════════════════════════
# API Keys
# ═══════════════════════════════════════
OPENWEATHER_API_KEY = config('OPENWEATHER_API_KEY', default='')
MANDI_API_KEY = config('MANDI_API_KEY', default='')

# ═══════════════════════════════════════
# LM Studio / Local LLM Settings
# ═══════════════════════════════════════
AI_PROVIDER = config('AI_PROVIDER', default='gemma')

# Mistral 7B
MISTRAL_AI_BASE_URL = config('MISTRAL_AI_BASE_URL', default='http://localhost:1234')
MISTRAL_AI_MODEL = config('MISTRAL_AI_MODEL', default='mistral-7b')

# Gemma 2 9B
GEMMA_AI_BASE_URL = config('GEMMA_AI_BASE_URL', default='http://localhost:1234')
GEMMA_AI_MODEL = config('GEMMA_AI_MODEL', default='gemma-2-9b-it')

# ═══════════════════════════════════════
# ChromaDB / Vector DB
# ═══════════════════════════════════════
ANONYMIZED_TELEMETRY = False
VECTOR_DB_PATH = AI_MODEL_PATH / 'vector_db'

# ═══════════════════════════════════════
# Session & Upload Settings
# ═══════════════════════════════════════
SESSION_COOKIE_AGE = 86400  # 1 day
SESSION_SAVE_EVERY_REQUEST = True

FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760

# ═══════════════════════════════════════
# CSRF Settings — allow frontend to send CSRF token
# ═══════════════════════════════════════
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:8000,http://127.0.0.1:8000',
    cast=lambda v: [o.strip() for o in v.split(',')]
)
CSRF_COOKIE_HTTPONLY = False  # Allow JS to read CSRF cookie
