from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that skips the default DRF CSRF enforcement
    for API endpoints consumed by single-page applications.
    """
    def enforce_csrf(self, request):
        return
