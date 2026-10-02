import logging
from django.contrib.auth.signals import user_logged_in, user_login_failed, user_logged_out
from django.dispatch import receiver
from .models import SecurityAuditLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Safely extracts client IP address from HTTP request headers."""
    if not request:
        return ''
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip


def get_user_agent(request):
    """Safely extracts User-Agent string from HTTP request headers."""
    if not request:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')


@receiver(user_logged_in)
def handle_user_logged_in(sender, request, user, **kwargs):
    try:
        ip = get_client_ip(request)
        ua = get_user_agent(request)
        SecurityAuditLog.objects.create(
            user=user,
            username_attempted=getattr(user, 'username', ''),
            event_type='login_success',
            ip_address=ip,
            user_agent=ua,
            details={
                'auth_method': 'session/token',
                'path': getattr(request, 'path', '') if request else '',
            }
        )
    except Exception as e:
        logger.error(f"Failed to record login_success audit log: {e}")


@receiver(user_login_failed)
def handle_user_login_failed(sender, credentials, request, **kwargs):
    try:
        ip = get_client_ip(request)
        ua = get_user_agent(request)
        attempted = ''
        if isinstance(credentials, dict):
            attempted = credentials.get('username') or credentials.get('email') or ''
        
        SecurityAuditLog.objects.create(
            user=None,
            username_attempted=attempted,
            event_type='login_failed',
            ip_address=ip,
            user_agent=ua,
            details={
                'reason': 'invalid_credentials',
                'path': getattr(request, 'path', '') if request else '',
            }
        )
    except Exception as e:
        logger.error(f"Failed to record login_failed audit log: {e}")


@receiver(user_logged_out)
def handle_user_logged_out(sender, request, user, **kwargs):
    try:
        if not user or not getattr(user, 'is_authenticated', False):
            return
        ip = get_client_ip(request)
        ua = get_user_agent(request)
        SecurityAuditLog.objects.create(
            user=user,
            username_attempted=getattr(user, 'username', ''),
            event_type='logout',
            ip_address=ip,
            user_agent=ua,
            details={
                'path': getattr(request, 'path', '') if request else '',
            }
        )
    except Exception as e:
        logger.error(f"Failed to record logout audit log: {e}")
