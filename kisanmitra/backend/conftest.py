import django
from django.conf import settings


def pytest_configure():
    settings.DATABASES["default"]["NAME"] = ":memory:"
