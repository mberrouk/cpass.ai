"""
Dev settings.
"""

from .base import *

DEBUG = True

# CORS settings
CORS_ALLOWED_ORIGINS = getenv(
    "CORS_ALLOWED_ORIGINS",
    "https://cpass.cpass.linkpc.net,https://cpass.linkpc.net,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080",
).split(",")

ALLOWED_HOSTS = ["*"]

print("DEBUG INSTALLED APP = ", INSTALLED_APPS)
# quit()

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
