"""Custom DRF exception handler — wraps errors in {error: {code, message}}."""
from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        # Wrap in the frontend-expected shape
        original = response.data
        if isinstance(original, dict) and "code" in original:
            response.data = {"error": original}
        elif not isinstance(original, dict) or "error" not in original:
            response.data = {"error": {"code": "ERROR", "message": str(original)}}
    return response
