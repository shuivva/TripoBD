"""
Authentication & Hardened JWT Views with HttpOnly Cookies and TOTP 2FA.
Implements:
- Feature 1: Advanced Two-Factor Authentication (2FA) with TOTP (pyotp, qrcode)
- Feature 2: Hardened JSON Web Token (JWT) Authentication with HttpOnly Cookies & Refresh Token Rotation
"""

import io
import base64
import logging
from datetime import datetime, timezone, timedelta

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.signals import user_logged_in, user_login_failed, user_logged_out
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

import pyotp
import qrcode

from .models import UserProfile, AccountSettings, SecurityAuditLog
from .throttling import LoginRateThrottle

logger = logging.getLogger(__name__)

# Signer salt for 2FA pre-auth tokens
PREAUTH_SALT = 'tripobd-2fa-preauth'
PREAUTH_MAX_AGE_SECONDS = 300  # 5 minutes


def get_user_account_settings(user):
    """Retrieve or create UserProfile and AccountSettings for any user safely."""
    profile = UserProfile.objects.filter(user=user).first()
    if not profile:
        profile = UserProfile.objects.create(
            user=user,
            full_name=user.get_full_name() or user.username,
            phone_number='',
            date_of_birth='2000-01-01',
            gender='other',
            division='dhaka',
            district='Dhaka',
            user_type='admin' if (user.is_staff or user.is_superuser) else 'traveler'
        )
    account_settings, _ = AccountSettings.objects.get_or_create(user_profile=profile)
    return account_settings


def set_jwt_refresh_cookie(response, refresh_token_str):
    """
    Sets the refresh token inside a hardened HttpOnly cookie.
    Prevents XSS attacks from exfiltrating refresh tokens.
    """
    cookie_name = getattr(settings, 'AUTH_COOKIE_REFRESH', 'refresh_token')
    max_age = getattr(settings, 'AUTH_COOKIE_MAX_AGE', 7 * 24 * 60 * 60)
    secure = getattr(settings, 'AUTH_COOKIE_SECURE', not settings.DEBUG)
    httponly = getattr(settings, 'AUTH_COOKIE_HTTP_ONLY', True)
    samesite = getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax')
    path = getattr(settings, 'AUTH_COOKIE_PATH', '/')

    response.set_cookie(
        key=cookie_name,
        value=refresh_token_str,
        max_age=max_age,
        httponly=httponly,
        secure=secure,
        samesite=samesite,
        path=path,
    )
    return response


def clear_jwt_refresh_cookie(response):
    """Clears the HttpOnly refresh token cookie on logout or invalidation."""
    cookie_name = getattr(settings, 'AUTH_COOKIE_REFRESH', 'refresh_token')
    path = getattr(settings, 'AUTH_COOKIE_PATH', '/')
    samesite = getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax')
    response.delete_cookie(key=cookie_name, path=path, samesite=samesite)
    return response


def generate_pre_auth_token(user):
    """Generates a cryptographically signed, short-lived pre-auth token for 2FA."""
    signer = TimestampSigner(salt=PREAUTH_SALT)
    return signer.sign(str(user.id))


def verify_pre_auth_token(pre_auth_token):
    """Validates pre-auth token signature and expiration, returning user_id or None."""
    signer = TimestampSigner(salt=PREAUTH_SALT)
    try:
        user_id_str = signer.unsign(pre_auth_token, max_age=PREAUTH_MAX_AGE_SECONDS)
        return int(user_id_str)
    except (BadSignature, SignatureExpired, ValueError, TypeError):
        return None


class CookieTokenObtainPairView(APIView):
    """
    Authenticates user credentials and issues:
    - 2FA challenge if TOTP 2FA is enabled on the account.
    - Short-lived Access Token in JSON response.
    - Long-lived Rotated Refresh Token in HttpOnly cookie.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        identifier = request.data.get('identifier') or request.data.get('username') or request.data.get('email')
        password = request.data.get('password')

        if not identifier or not password:
            return Response(
                {'error': 'Identifier and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        username_to_auth = identifier
        if '@' in identifier:
            u = User.objects.filter(email__iexact=identifier).first()
            if u:
                username_to_auth = u.username

        user = authenticate(request, username=username_to_auth, password=password)

        if user is None:
            user_login_failed.send(
                sender=self.__class__,
                credentials={'username': username_to_auth},
                request=request
            )
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check 2FA requirement
        account_settings = get_user_account_settings(user)
        if account_settings.is_2fa_enabled and account_settings.totp_secret:
            pre_auth_token = generate_pre_auth_token(user)
            return Response({
                'requires_2fa': True,
                'pre_auth_token': pre_auth_token,
                'user_id': user.id,
                'username': user.username,
                'message': 'Two-Factor Authentication required. Please enter your 6-digit TOTP code.'
            }, status=status.HTTP_200_OK)

        # If 2FA not required, issue JWT tokens
        return _issue_login_tokens(request, user)


class CookieTokenRefreshView(APIView):
    """
    Refreshes JWT access token and rotates refresh token using HttpOnly cookie.
    Enforces refresh token rotation and blacklists previous token.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        cookie_name = getattr(settings, 'AUTH_COOKIE_REFRESH', 'refresh_token')
        refresh_token_str = request.COOKIES.get(cookie_name) or request.data.get('refresh') or request.data.get('refresh_token')

        if not refresh_token_str:
            return Response(
                {'error': 'Refresh token missing from cookie or request body'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            old_refresh = RefreshToken(refresh_token_str)
            user_id = old_refresh.payload.get('user_id')
            user = User.objects.filter(id=user_id, is_active=True).first()
            if not user:
                raise TokenError('User not found or inactive')

            # Blacklist old refresh token (Token Rotation & Blacklisting)
            try:
                old_refresh.blacklist()
            except AttributeError:
                pass  # Blacklist app might not be enabled or already blacklisted

            # Issue new token pair
            new_refresh = RefreshToken.for_user(user)
            new_access_token = str(new_refresh.access_token)
            new_refresh_str = str(new_refresh)

            response = Response({
                'access': new_access_token,
                'message': 'Token refreshed successfully'
            }, status=status.HTTP_200_OK)

            set_jwt_refresh_cookie(response, new_refresh_str)
            return response

        except (TokenError, InvalidToken) as e:
            response = Response(
                {'error': 'Invalid, expired, or blacklisted refresh token. Please sign in again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            clear_jwt_refresh_cookie(response)
            return response


class CookieTokenLogoutView(APIView):
    """
    Logs out the user by blacklisting the active refresh token and clearing HttpOnly cookies.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        cookie_name = getattr(settings, 'AUTH_COOKIE_REFRESH', 'refresh_token')
        refresh_token_str = request.COOKIES.get(cookie_name) or request.data.get('refresh') or request.data.get('refresh_token')

        if refresh_token_str:
            try:
                token = RefreshToken(refresh_token_str)
                token.blacklist()
            except Exception:
                pass

        if request.user.is_authenticated:
            user_logged_out.send(sender=request.user.__class__, request=request, user=request.user)

        try:
            logout(request)
        except Exception:
            pass

        response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        clear_jwt_refresh_cookie(response)
        return response


def _issue_login_tokens(request, user):
    """Helper to generate JWT tokens, set HttpOnly cookie, and format login response."""
    try:
        login(request, user)
    except Exception:
        pass

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token_str = str(refresh)

    profile = UserProfile.objects.filter(user=user).first()
    user_type = profile.user_type if profile else None
    is_admin = user.is_staff or user.is_superuser

    user_logged_in.send(sender=user.__class__, request=request, user=user)

    response = Response({
        'message': 'Login successful',
        'access': access_token,
        'user_id': user.id,
        'username': user.username,
        'user_type': user_type,
        'is_admin': is_admin
    }, status=status.HTTP_200_OK)

    set_jwt_refresh_cookie(response, refresh_token_str)
    return response


# =========================================================================
# FEATURE 1: 2FA ENDPOINTS
# =========================================================================

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    """
    Generates a TOTP secret and renders a QR code base64 image pointing to:
    otpauth://totp/TripoBD:user@email.com?secret=...
    """
    account_settings = get_user_account_settings(request.user)
    secret = pyotp.random_base32()
    
    # Temporarily store secret on AccountSettings until verified
    account_settings.totp_secret = secret
    account_settings.save(update_fields=['totp_secret'])

    account_name = request.user.email or request.user.username
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=account_name, issuer_name='TripoBD')

    # Render QR code image to base64
    qr_img = qrcode.make(otpauth_url)
    buffer = io.BytesIO()
    qr_img.save(buffer, format='PNG')
    qr_base64 = 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('utf-8')

    return Response({
        'secret': secret,
        'qr_code': qr_base64,
        'otpauth_url': otpauth_url,
        'message': 'Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code to enable 2FA.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_2fa(request):
    """
    Verifies initial 6-digit TOTP token using totp.verify(code) before enabling 2FA.
    """
    code = str(request.data.get('code') or request.data.get('totp_code') or '').strip()
    if not code or len(code) != 6 or not code.isdigit():
        return Response(
            {'error': 'A 6-digit numeric verification code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    account_settings = get_user_account_settings(request.user)
    if not account_settings.totp_secret:
        return Response(
            {'error': '2FA setup not initiated. Please run setup first.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    totp = pyotp.TOTP(account_settings.totp_secret)
    if totp.verify(code, valid_window=1):
        account_settings.enable_totp_2fa(account_settings.totp_secret)
        
        # Security audit log
        try:
            ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            ua = request.META.get('HTTP_USER_AGENT', '')
            SecurityAuditLog.objects.create(
                user=request.user,
                username_attempted=request.user.username,
                event_type='2fa_enabled',
                ip_address=ip.split(',')[0].strip() if ip else None,
                user_agent=ua[:255] if ua else '',
                details={'action': 'TOTP 2FA enabled successfully'}
            )
        except Exception:
            pass

        return Response({
            'success': True,
            'message': 'Two-factor authentication has been successfully enabled!',
            'is_2fa_enabled': True
        }, status=status.HTTP_200_OK)

    return Response(
        {'error': 'Invalid 6-digit code. Please ensure your authenticator clock is synced.'},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """
    Disables 2FA after validating the user's password or TOTP code.
    """
    code = str(request.data.get('code') or request.data.get('totp_code') or '').strip()
    password = request.data.get('password')

    account_settings = get_user_account_settings(request.user)
    if not account_settings.is_2fa_enabled:
        return Response(
            {'message': 'Two-factor authentication is not currently enabled.', 'is_2fa_enabled': False},
            status=status.HTTP_200_OK
        )

    verified = False
    if code and account_settings.totp_secret:
        totp = pyotp.TOTP(account_settings.totp_secret)
        if totp.verify(code, valid_window=1):
            verified = True

    if not verified and password:
        if request.user.check_password(password):
            verified = True

    if not verified:
        return Response(
            {'error': 'Verification failed. Please provide your current 6-digit code or account password.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    account_settings.disable_totp_2fa()

    # Security audit log
    try:
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        ua = request.META.get('HTTP_USER_AGENT', '')
        SecurityAuditLog.objects.create(
            user=request.user,
            username_attempted=request.user.username,
            event_type='2fa_disabled',
            ip_address=ip.split(',')[0].strip() if ip else None,
            user_agent=ua[:255] if ua else '',
            details={'action': 'TOTP 2FA disabled'}
        )
    except Exception:
        pass

    return Response({
        'success': True,
        'message': 'Two-factor authentication has been disabled.',
        'is_2fa_enabled': False
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_2fa(request):
    """Returns the current 2FA status for the authenticated user."""
    account_settings = get_user_account_settings(request.user)
    return Response({
        'is_2fa_enabled': bool(account_settings.is_2fa_enabled),
        'has_secret': bool(account_settings.totp_secret),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([LoginRateThrottle])
def verify_2fa_login(request):
    """
    Second-step login verification endpoint.
    Accepts pre_auth_token and 6-digit TOTP code.
    If valid, issues short-lived access token and HttpOnly refresh token cookie.
    """
    pre_auth_token = request.data.get('pre_auth_token')
    code = str(request.data.get('code') or request.data.get('totp_code') or '').strip()

    if not pre_auth_token or not code:
        return Response(
            {'error': 'Pre-auth token and 6-digit verification code are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user_id = verify_pre_auth_token(pre_auth_token)
    if not user_id:
        return Response(
            {'error': 'Pre-authentication session expired or invalid. Please sign in again.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    user = User.objects.filter(id=user_id, is_active=True).first()
    if not user:
        return Response({'error': 'User not found or inactive'}, status=status.HTTP_404_NOT_FOUND)

    account_settings = get_user_account_settings(user)
    if not account_settings.is_2fa_enabled or not account_settings.totp_secret:
        return Response({'error': 'Two-factor authentication is not active on this account'}, status=status.HTTP_400_BAD_REQUEST)

    totp = pyotp.TOTP(account_settings.totp_secret)
    if not totp.verify(code, valid_window=1):
        user_login_failed.send(
            sender=verify_2fa_login,
            credentials={'username': user.username},
            request=request
        )
        return Response(
            {'error': 'Invalid 6-digit code. Please verify and try again.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # TOTP Verified! Issue login tokens
    return _issue_login_tokens(request, user)
