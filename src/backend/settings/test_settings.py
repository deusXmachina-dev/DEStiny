"""
Test settings for destiny-backend project.
Inherits from main settings and overrides for testing environment.
"""

from .settings import *

# Override settings for testing
DEBUG = True

# Disable SSL redirects for tests
SECURE_SSL_REDIRECT = False
SECURE_REDIRECT_EXEMPT = []
SECURE_PROXY_SSL_HEADER = None
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
