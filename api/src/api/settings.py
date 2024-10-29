from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-rm#p9c7f!%q1&=-l+m6lx^9=cl2f301=+d3eu0n3x^yfy1yg51'

# SECURITY WARNING: don't run with debug turned on in production!
MAILGUN_API_KEY = os.environ.get('MAILGUN_API_KEY')
DEBUG = bool(int(os.environ.get('DEBUG', '0')))
DEBUG_EMAILS = DEBUG  # Print emails instead of sending them

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.humanize',
    'forms.apps.FormsConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'api.urls'
APPEND_SLASH = False


WSGI_APPLICATION = 'api.wsgi.application'

DATABASE_BACKUPS_DIR = Path('/var/db-backups')
DATABASE_PATH = Path('/var/db/api.db')
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DATABASE_PATH,
    }
}

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "APP_DIRS": True,
    }
]

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '%(asctime)s %(levelname)s [%(name)s:%(lineno)d] %(message)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'default',
        },
        'betterstack': {
            'class': 'logtail.LogtailHandler',
            'formatter': 'default',
            'source_token': os.environ.get('BETTERSTACK_SOURCE_TOKEN')
        },
    },
    'loggers': {
        '': {
            'handlers': ['console', 'betterstack'] if os.environ.get('BETTERSTACK_SOURCE_TOKEN') else ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'level': 'ERROR',
        },
        'gunicorn': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        }
    },
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.BasicAuthentication',
    ),
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
