"""
Custom DRF Throttle classes for TripoBD API security.
Protects against brute-force attacks, OTP flooding, and AI resource exhaustion.
"""
from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Throttle for authentication endpoints (login, registration, password changes).
    Restricted to 5 requests/minute per client IP address.
    """
    scope = 'login'

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }


class OTPRateThrottle(SimpleRateThrottle):
    """
    Throttle for OTP verification and generation endpoints.
    Restricted to 3 requests/minute per client IP address and email.
    """
    scope = 'otp'

    def get_cache_key(self, request, view):
        email = ''
        if hasattr(request, 'data') and isinstance(request.data, dict):
            email = request.data.get('email', '').strip().lower()
        
        ident = f"{self.get_ident(request)}_{email}" if email else self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class AIGenerationRateThrottle(UserRateThrottle):
    """
    Throttle for AI itinerary generation and chat sessions.
    Restricted to 10 requests/hour per authenticated user (or IP if unauthenticated).
    """
    scope = 'ai_gen'
