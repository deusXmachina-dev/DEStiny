"""
Test settings for destiny-backend project.
Inherits from main settings and overrides for testing environment.
"""

import os

# Set mock OpenAI API key before any imports that might use it
os.environ.setdefault("OPENAI_API_KEY", "test-api-key-for-testing")

from .settings import *

# Override settings for testing
DEBUG = True

# Disable SSL redirects for tests
SECURE_SSL_REDIRECT = False
SECURE_REDIRECT_EXEMPT = []
SECURE_PROXY_SSL_HEADER = None
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
