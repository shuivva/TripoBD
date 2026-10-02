import os
import sys
import django

# Setup Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APIClient
from api.models import (
    UserProfile,
    ServiceProvider,
    ServiceProviderBooking,
    AccountSettings,
    SecurityAuditLog,
)

def run_tests():
    print("=" * 60)
    print("STARTING SECURITY FEATURES F4 & F5 VERIFICATION SUITE")
    print("=" * 60)

    # Clear cache before testing rate limits
    cache.clear()

    client = APIClient()

    # -------------------------------------------------------------
    # 1. TEST FEATURE 4: OTP RATE LIMITING (3 requests/minute)
    # -------------------------------------------------------------
    print("\n[TEST 1] Testing OTP Rate Limiting (limit: 3/minute)...")
    otp_url = '/api/auth/verify-otp/'
    otp_data = {'email': 'test_throttle@example.com', 'otp': '123456'}

    responses = []
    for i in range(1, 6):
        res = client.post(otp_url, otp_data, format='json')
        responses.append(res)
        print(f"  Attempt {i}: HTTP {res.status_code}")

    # Attempts 1-3 should be 400 (invalid OTP), Attempt 4+ should be 429
    assert responses[0].status_code == 400, f"Expected 400, got {responses[0].status_code}"
    assert responses[1].status_code == 400, f"Expected 400, got {responses[1].status_code}"
    assert responses[2].status_code == 400, f"Expected 400, got {responses[2].status_code}"
    assert responses[3].status_code == 429, f"Expected 429 on 4th attempt, got {responses[3].status_code}"
    assert 'Retry-After' in responses[3].headers or 'retry-after' in responses[3].headers, "Missing Retry-After header on 429 response"
    print("  -> SUCCESS: OTP Rate limiting enforced HTTP 429 with Retry-After header!")

    # Clear cache for next test
    cache.clear()

    # -------------------------------------------------------------
    # 2. TEST FEATURE 4: LOGIN RATE LIMITING (5 requests/minute)
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing Login Rate Limiting (limit: 5/minute)...")
    login_url = '/api/auth/login/'
    bad_login_data = {'identifier': 'nonexistent_user', 'password': 'wrongpassword'}

    login_responses = []
    for i in range(1, 8):
        res = client.post(login_url, bad_login_data, format='json')
        login_responses.append(res)
        print(f"  Attempt {i}: HTTP {res.status_code}")

    # Attempts 1-5 should be 401, Attempt 6+ should be 429
    for idx in range(5):
        assert login_responses[idx].status_code == 401, f"Expected 401, got {login_responses[idx].status_code}"
    assert login_responses[5].status_code == 429, f"Expected 429 on 6th attempt, got {login_responses[5].status_code}"
    assert 'Retry-After' in login_responses[5].headers or 'retry-after' in login_responses[5].headers, "Missing Retry-After header on 429 response"
    print("  -> SUCCESS: Login Rate limiting enforced HTTP 429 with Retry-After header!")

    # Clear cache
    cache.clear()

    # -------------------------------------------------------------
    # 3. TEST FEATURE 5: SECURITY AUDIT LOGGING SIGNALS
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing Security Audit Logging (Signals)...")
    # Clean previous test logs
    SecurityAuditLog.objects.filter(username_attempted='audit_test_user').delete()

    # Create a test user
    test_user, created = User.objects.get_or_create(username='audit_test_user', email='audit_test@example.com')
    test_user.set_password('CorrectPassword123!')
    test_user.save()

    # 3a. Failed Login
    print("  Triggering failed login...")
    failed_res = client.post('/api/auth/login/', {'identifier': 'audit_test_user', 'password': 'IncorrectPassword'}, format='json')
    assert failed_res.status_code == 401

    failed_log = SecurityAuditLog.objects.filter(event_type='login_failed', username_attempted='audit_test_user').first()
    assert failed_log is not None, "Failed login audit log not found"
    assert failed_log.ip_address is not None
    print(f"  -> SUCCESS: Failed login logged: {failed_log}")

    # 3b. Successful Login
    print("  Triggering successful login...")
    success_res = client.post('/api/auth/login/', {'identifier': 'audit_test_user', 'password': 'CorrectPassword123!'}, format='json')
    assert success_res.status_code == 200

    success_log = SecurityAuditLog.objects.filter(event_type='login_success', user=test_user).first()
    assert success_log is not None, "Successful login audit log not found"
    assert success_log.username_attempted == 'audit_test_user'
    print(f"  -> SUCCESS: Successful login logged: {success_log}")

    # 3c. Logout
    print("  Triggering logout...")
    logout_res = client.post('/api/auth/logout/')
    assert logout_res.status_code == 200
    logout_log = SecurityAuditLog.objects.filter(event_type='logout', user=test_user).first()
    assert logout_log is not None, "Logout audit log not found"
    print(f"  -> SUCCESS: Logout logged: {logout_log}")

    # -------------------------------------------------------------
    # 4. TEST FEATURE 5: HISTORICAL RECORDS TRACKING
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing HistoricalRecords Tracking...")
    # UserProfile
    profile, _ = UserProfile.objects.get_or_create(
        user=test_user,
        defaults={
            'full_name': 'Audit Tester',
            'phone_number': '01700000000',
            'date_of_birth': '1995-01-01',
            'gender': 'male',
            'division': 'dhaka',
            'district': 'Dhaka',
            'user_type': 'traveler'
        }
    )
    profile.full_name = 'Audit Tester Modified'
    profile.save()

    profile_history = profile.history.all()
    assert profile_history.count() >= 1, "UserProfile history records not found"
    print(f"  -> UserProfile history count: {profile_history.count()} (Latest full_name: '{profile_history.first().full_name}')")

    # AccountSettings
    settings_obj, _ = AccountSettings.objects.get_or_create(user_profile=profile)
    settings_obj.two_factor_enabled = True
    settings_obj.save()
    settings_history = settings_obj.history.all()
    assert settings_history.count() >= 1, "AccountSettings history records not found"
    print(f"  -> AccountSettings history count: {settings_history.count()} (two_factor_enabled: {settings_history.first().two_factor_enabled})")

    # ServiceProvider
    sp_user, _ = User.objects.get_or_create(username='audit_sp_user', email='audit_sp@example.com')
    sp_obj, _ = ServiceProvider.objects.get_or_create(
        user=sp_user,
        defaults={
            'service_type': 'tour_guide',
            'specialized_destinations': 'Sylhet',
            'years_of_experience': 3,
            'languages_offered': 'Bangla, English',
            'fee_range': '1500-2500',
            'bank_account_details': 'DBBL 123456789',
        }
    )
    sp_obj.is_verified = True
    sp_obj.fee_range = '2000-3000'
    sp_obj.save()
    sp_history = sp_obj.history.all()
    assert sp_history.count() >= 1, "ServiceProvider history records not found"
    print(f"  -> ServiceProvider history count: {sp_history.count()} (is_verified: {sp_history.first().is_verified})")

    # ServiceProviderBooking
    from datetime import date
    booking_obj, _ = ServiceProviderBooking.objects.get_or_create(
        service_provider=sp_obj,
        customer=test_user,
        defaults={
            'start_date': date(2026, 10, 1),
            'end_date': date(2026, 10, 3),
            'group_size': 2,
            'status': 'requested',
            'agreed_fee': 4000.00
        }
    )
    booking_obj.status = 'confirmed'
    booking_obj.save()
    booking_history = booking_obj.history.all()
    assert booking_history.count() >= 1, "ServiceProviderBooking history records not found"
    print(f"  -> ServiceProviderBooking history count: {booking_history.count()} (status: {booking_history.first().status})")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
