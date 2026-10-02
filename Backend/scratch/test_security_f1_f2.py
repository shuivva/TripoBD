"""
Automated Verification Suite for:
- Feature 1: Advanced Two-Factor Authentication (2FA) with Time-Based One-Time Password (TOTP)
- Feature 2: Hardened JSON Web Token (JWT) Authentication with HttpOnly Cookies and Refresh Token Rotation
"""

import os
import sys
import json
import time

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import pyotp

from api.models import UserProfile, AccountSettings, SecurityAuditLog
from api.auth_jwt_views import get_user_account_settings


def run_tests():
    print("=" * 70)
    print("STARTING SECURITY FEATURE 1 (TOTP 2FA) & FEATURE 2 (HARDENED JWT) TESTS")
    print("=" * 70)

    client = APIClient()

    # Create / get test user
    username = "jwt_2fa_tester"
    email = "jwt_2fa_tester@tripobd.test"
    password = "SecurePassword@2026!"

    user = User.objects.filter(username=username).first()
    if user:
        user.delete()

    user = User.objects.create_user(username=username, email=email, password=password)
    profile = UserProfile.objects.create(
        user=user,
        full_name="JWT 2FA Test User",
        phone_number="01700000000",
        date_of_birth="1995-05-15",
        gender="male",
        division="dhaka",
        district="Dhaka",
        user_type="traveler",
        is_email_verified=True,
    )
    settings_obj = get_user_account_settings(user)
    settings_obj.disable_totp_2fa()

    # -------------------------------------------------------------
    # FEATURE 2: Hardened JWT with HttpOnly Cookie & Rotation Tests
    # -------------------------------------------------------------
    print("\n--- [TEST GROUP 1: FEATURE 2 - HARDENED JWT WITH HTTPONLY COOKIE] ---")

    # TEST 1: Initial Login with CookieTokenObtainPairView
    print("[TEST 1] Logging in via /api/token/ to obtain JWT & HttpOnly refresh cookie...")
    res = client.post('/api/token/', {'identifier': username, 'password': password}, format='json')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
    data = res.data

    assert 'access' in data, "Access token missing from response JSON"
    assert 'user_id' in data and data['user_id'] == user.id, "User ID missing or incorrect"
    access_token = data['access']

    # Verify HttpOnly Cookie
    assert 'refresh_token' in res.cookies, "HttpOnly refresh_token cookie was not set in response"
    refresh_cookie = res.cookies['refresh_token']
    assert refresh_cookie['httponly'] is True, "refresh_token cookie must have HttpOnly=True"
    assert refresh_cookie['samesite'] == 'Lax', "refresh_token cookie must have SameSite=Lax"
    first_refresh_token = refresh_cookie.value
    print(f"  -> SUCCESS: Login successful. Access token received. HttpOnly cookie set (length: {len(first_refresh_token)}).")

    # TEST 2: Accessing Protected Endpoint with Access Token
    print("[TEST 2] Accessing protected endpoint with Bearer access token...")
    auth_client = APIClient()
    auth_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    res_protected = auth_client.get(f'/api/traveler/dashboard/{user.id}/')
    assert res_protected.status_code in [200, 404], f"Unexpected auth failure: {res_protected.status_code}"
    print("  -> SUCCESS: Bearer access token successfully authenticated.")

    # TEST 3: Refresh Token Rotation via HttpOnly Cookie
    print("[TEST 3] Invoking /api/token/refresh/ to test Refresh Token Rotation...")
    refresh_client = APIClient()
    # Simulate browser sending the HttpOnly cookie
    refresh_client.cookies['refresh_token'] = first_refresh_token
    res_refresh = refresh_client.post('/api/token/refresh/', format='json')
    assert res_refresh.status_code == 200, f"Expected 200 on refresh, got {res_refresh.status_code}: {res_refresh.data}"
    
    assert 'access' in res_refresh.data, "New access token missing from refresh response"
    new_access_token = res_refresh.data['access']
    assert new_access_token != access_token, "New access token should be newly generated"

    assert 'refresh_token' in res_refresh.cookies, "New rotated refresh_token cookie not set"
    second_refresh_token = res_refresh.cookies['refresh_token'].value
    assert second_refresh_token != first_refresh_token, "Refresh token was not rotated!"
    print("  -> SUCCESS: Refresh token rotated successfully. New access token and new cookie issued.")

    # TEST 4: Anti-Replay / Blacklist Test (Reusing old refresh token)
    print("[TEST 4] Testing Replay Attack Protection (Attempting reuse of blacklisted refresh token)...")
    replay_client = APIClient()
    replay_client.cookies['refresh_token'] = first_refresh_token
    res_replay = replay_client.post('/api/token/refresh/', format='json')
    assert res_replay.status_code == 401, f"Expected 401 for blacklisted token, got {res_replay.status_code}: {res_replay.data}"
    print("  -> SUCCESS: Blacklisted refresh token was rejected with HTTP 401. Replay attack prevented.")

    # TEST 5: Logout View Clears Cookie & Blacklists Token
    print("[TEST 5] Testing /api/auth/logout/ to clear cookie and blacklist active refresh token...")
    logout_client = APIClient()
    logout_client.cookies['refresh_token'] = second_refresh_token
    res_logout = logout_client.post('/api/auth/logout/', format='json')
    assert res_logout.status_code == 200, f"Expected 200, got {res_logout.status_code}"
    assert res_logout.cookies['refresh_token'].value == '', "refresh_token cookie was not cleared"

    # Verify that the logged-out token is now blacklisted
    res_after_logout = replay_client.post('/api/token/refresh/', format='json')
    replay_client.cookies['refresh_token'] = second_refresh_token
    res_after_logout2 = replay_client.post('/api/token/refresh/', format='json')
    assert res_after_logout2.status_code == 401, "Logged-out refresh token must be blacklisted"
    print("  -> SUCCESS: Logout cleared the HttpOnly cookie and blacklisted the active refresh token.")

    # -------------------------------------------------------------
    # FEATURE 1: Advanced TOTP Two-Factor Authentication (2FA) Tests
    # -------------------------------------------------------------
    print("\n--- [TEST GROUP 2: FEATURE 1 - ADVANCED TOTP 2FA AUTHENTICATION] ---")

    # Login to obtain fresh token for 2FA setup
    login_res = client.post('/api/token/', {'identifier': username, 'password': password}, format='json')
    active_access = login_res.data['access']
    user_client = APIClient()
    user_client.credentials(HTTP_AUTHORIZATION=f'Bearer {active_access}')

    # TEST 6: 2FA Setup Endpoint
    print("[TEST 6] Calling /api/2fa/setup/ to generate TOTP secret and QR code...")
    res_setup = user_client.post('/api/2fa/setup/', format='json')
    assert res_setup.status_code == 200, f"Expected 200, got {res_setup.status_code}: {res_setup.data}"
    setup_data = res_setup.data
    assert 'secret' in setup_data, "Secret missing from setup response"
    assert 'qr_code' in setup_data, "QR code missing from setup response"
    assert setup_data['qr_code'].startswith('data:image/png;base64,'), "Invalid QR code base64 format"
    totp_secret = setup_data['secret']
    print(f"  -> SUCCESS: Setup generated base32 secret ({totp_secret[:6]}...) and valid base64 QR code.")

    # Verify 2FA is NOT yet enabled before verification
    settings_obj.refresh_from_db()
    assert settings_obj.is_2fa_enabled is False, "2FA must not be enabled prior to OTP verification"

    # TEST 7: 2FA Enable with Invalid Code
    print("[TEST 7] Attempting to enable 2FA with invalid 6-digit code...")
    res_invalid = user_client.post('/api/2fa/enable/', {'code': '000000'}, format='json')
    assert res_invalid.status_code == 400, f"Expected 400 for invalid code, got {res_invalid.status_code}"
    print("  -> SUCCESS: Invalid TOTP code correctly rejected with HTTP 400.")

    # TEST 8: 2FA Enable with Valid TOTP Code
    print("[TEST 8] Enabling 2FA with valid TOTP code generated via pyotp...")
    totp = pyotp.TOTP(totp_secret)
    valid_code = totp.now()
    res_enable = user_client.post('/api/2fa/enable/', {'code': valid_code}, format='json')
    assert res_enable.status_code == 200, f"Expected 200, got {res_enable.status_code}: {res_enable.data}"
    assert res_enable.data.get('is_2fa_enabled') is True, "Response does not reflect enabled state"

    settings_obj.refresh_from_db()
    assert settings_obj.is_2fa_enabled is True, "Database is_2fa_enabled flag must be True"
    assert settings_obj.two_factor_enabled is True, "Database two_factor_enabled flag must be True"
    print("  -> SUCCESS: 2FA successfully verified and enabled on user account.")

    # TEST 9: Login Interception Requiring 2FA Challenge
    print("[TEST 9] Logging in with credentials when 2FA is active (expecting 2FA challenge)...")
    res_login_challenge = client.post('/api/token/', {'identifier': username, 'password': password}, format='json')
    assert res_login_challenge.status_code == 200, f"Expected 200, got {res_login_challenge.status_code}"
    challenge_data = res_login_challenge.data
    assert challenge_data.get('requires_2fa') is True, "requires_2fa must be True"
    assert 'pre_auth_token' in challenge_data, "pre_auth_token missing from 2FA challenge"
    assert 'access' not in challenge_data, "Access token must NOT be issued before 2FA verification!"
    assert 'refresh_token' not in res_login_challenge.cookies, "HttpOnly refresh cookie must NOT be set yet!"
    pre_auth_token = challenge_data['pre_auth_token']
    print(f"  -> SUCCESS: Login intercepted! requires_2fa=True, received pre_auth_token.")

    # TEST 10: 2FA Login Second Step with Invalid Code
    print("[TEST 10] Testing /api/2fa/verify-login/ with invalid code...")
    res_verify_fail = client.post('/api/2fa/verify-login/', {
        'pre_auth_token': pre_auth_token,
        'code': '999999'
    }, format='json')
    assert res_verify_fail.status_code == 401, f"Expected 401, got {res_verify_fail.status_code}: {res_verify_fail.data}"
    print("  -> SUCCESS: Invalid 2FA login code rejected with HTTP 401.")

    # TEST 11: 2FA Login Second Step with Valid Code
    print("[TEST 11] Testing /api/2fa/verify-login/ with valid TOTP code...")
    valid_step2_code = totp.now()
    res_verify_success = client.post('/api/2fa/verify-login/', {
        'pre_auth_token': pre_auth_token,
        'code': valid_step2_code
    }, format='json')
    assert res_verify_success.status_code == 200, f"Expected 200, got {res_verify_success.status_code}: {res_verify_success.data}"
    step2_data = res_verify_success.data
    assert 'access' in step2_data, "Access token missing after 2FA login verification"
    assert 'refresh_token' in res_verify_success.cookies, "HttpOnly refresh cookie missing after 2FA login"
    assert res_verify_success.cookies['refresh_token']['httponly'] is True
    print("  -> SUCCESS: 2FA login verified! JWT access token and HttpOnly refresh cookie issued.")

    # TEST 12: Disable 2FA
    print("[TEST 12] Disabling 2FA with current valid TOTP code...")
    auth_client_step2 = APIClient()
    auth_client_step2.credentials(HTTP_AUTHORIZATION=f"Bearer {step2_data['access']}")
    disable_code = totp.now()
    res_disable = auth_client_step2.post('/api/2fa/disable/', {'code': disable_code}, format='json')
    assert res_disable.status_code == 200, f"Expected 200, got {res_disable.status_code}: {res_disable.data}"
    assert res_disable.data.get('is_2fa_enabled') is False

    settings_obj.refresh_from_db()
    assert settings_obj.is_2fa_enabled is False, "Database flag must be False after disabling"
    assert settings_obj.totp_secret == '', "totp_secret must be cleared after disabling"

    # Clear throttle cache before final standard login test
    from django.core.cache import cache
    cache.clear()

    # Verify standard login works directly again without 2FA
    res_std_login = client.post('/api/token/', {'identifier': username, 'password': password}, format='json')
    assert res_std_login.status_code == 200
    assert res_std_login.data.get('requires_2fa') is not True
    assert 'access' in res_std_login.data
    print("  -> SUCCESS: 2FA disabled successfully and standard login restored.")

    # Clean up test user
    user.delete()

    print("\n" + "=" * 70)
    print("ALL 12 TESTS FOR FEATURE 1 (2FA) & FEATURE 2 (HARDENED JWT) PASSED!")
    print("=" * 70)


if __name__ == '__main__':
    run_tests()
