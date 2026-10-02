import os
import sys

# Setup environment & Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from django.test import Client
from django.contrib.auth.models import User
from django.db import connection
from api.models import UserProfile, ServiceProvider
from api.serializers import UserProfileSerializer

print("=" * 70)
print("STARTING SECURITY FEATURE 9 (FIELD-LEVEL PII ENCRYPTION) TESTS")
print("=" * 70)

# [TEST 1] Master Encryption Key Validation
print("[TEST 1] Verifying FIELD_ENCRYPTION_KEY Configuration...")
assert hasattr(settings, 'FIELD_ENCRYPTION_KEY'), "FAIL: FIELD_ENCRYPTION_KEY not set in settings"
assert len(settings.FIELD_ENCRYPTION_KEY) > 0, "FAIL: FIELD_ENCRYPTION_KEY is empty"
print(f"  -> SUCCESS: FIELD_ENCRYPTION_KEY is active ({settings.FIELD_ENCRYPTION_KEY[:10]}...).")

# [TEST 2] Create / Update UserProfile with Sensitive PII
print("[TEST 2] Testing UserProfile PII Encryption (Phone Number & National ID)...")
user_test, _ = User.objects.get_or_create(username='pii_test_traveler', defaults={'email': 'pii_test@tripobd.test'})
user_test.set_password('SecretPiiPass123!')
user_test.save()

raw_phone = '01899123456'
raw_nid = '19958887776665554'

profile, _ = UserProfile.objects.update_or_create(
    user=user_test,
    defaults={
        'full_name': 'PII Test User',
        'phone_number': raw_phone,
        'date_of_birth': '1995-05-15',
        'gender': 'male',
        'division': 'dhaka',
        'district': 'Dhaka',
        'national_id': raw_nid,
    }
)

# Inspect raw MySQL database table via raw SQL cursor
with connection.cursor() as cursor:
    cursor.execute("SELECT phone_number, national_id FROM user_profiles WHERE id = %s", [profile.id])
    db_row = cursor.fetchone()
    db_phone, db_nid = db_row[0], db_row[1]

print(f"  -> Model Input Phone:       {raw_phone}")
print(f"  -> Raw DB Stored Phone:     {db_phone[:35]}... (Length: {len(db_phone)})")
print(f"  -> Model Input National ID: {raw_nid}")
print(f"  -> Raw DB Stored NID:       {db_nid[:35]}... (Length: {len(db_nid)})")

# Invariants: DB values must be Fernet tokens starting with gAAAAA and MUST NOT contain raw plaintext
assert db_phone.startswith('gAAAAA'), f"FAIL: Raw DB phone is not an encrypted token: {db_phone}"
assert db_nid.startswith('gAAAAA'), f"FAIL: Raw DB national ID is not an encrypted token: {db_nid}"
assert raw_phone not in db_phone, "FAIL: Plaintext phone number leaked in raw database column!"
assert raw_nid not in db_nid, "FAIL: Plaintext national ID leaked in raw database column!"
print("  -> SUCCESS: MySQL database stores strictly ciphertext Fernet tokens for UserProfile PII.")

# [TEST 3] Test ServiceProvider Financial Details Encryption
print("[TEST 3] Testing ServiceProvider PII Encryption (Bank Account Details)...")
user_guide, _ = User.objects.get_or_create(username='pii_test_guide', defaults={'email': 'pii_guide@tripobd.test'})
user_guide.set_password('SecretGuidePass123!')
user_guide.save()

raw_bank = "Dutch-Bangla Bank | A/C: 104.120.987654 | Branch: Motijheel | Routing: 090271638"

provider, _ = ServiceProvider.objects.update_or_create(
    user=user_guide,
    defaults={
        'service_type': 'tour_guide',
        'specialized_destinations': 'Sylhet, Cox\'s Bazar',
        'years_of_experience': 5,
        'languages_offered': 'Bangla, English',
        'fee_range': '2500 BDT/day',
        'bank_account_details': raw_bank,
    }
)

with connection.cursor() as cursor:
    cursor.execute("SELECT bank_account_details FROM service_providers WHERE id = %s", [provider.id])
    db_bank = cursor.fetchone()[0]

print(f"  -> Model Input Bank Info:   {raw_bank[:35]}...")
print(f"  -> Raw DB Stored Bank Info: {db_bank[:35]}... (Length: {len(db_bank)})")

assert db_bank.startswith('gAAAAA'), f"FAIL: Raw DB bank details is not an encrypted token: {db_bank}"
assert "Dutch-Bangla" not in db_bank, "FAIL: Plaintext bank name leaked in raw database column!"
assert "104.120.987654" not in db_bank, "FAIL: Plaintext bank account leaked in raw database column!"
print("  -> SUCCESS: MySQL database stores strictly ciphertext Fernet tokens for ServiceProvider bank details.")

# [TEST 4] Transparent Decryption via Django ORM
print("[TEST 4] Testing Transparent Decryption via Django ORM...")
fetched_profile = UserProfile.objects.get(id=profile.id)
assert fetched_profile.phone_number == raw_phone, f"FAIL: Expected {raw_phone}, got {fetched_profile.phone_number}"
assert fetched_profile.national_id == raw_nid, f"FAIL: Expected {raw_nid}, got {fetched_profile.national_id}"

fetched_provider = ServiceProvider.objects.get(id=provider.id)
assert fetched_provider.bank_account_details == raw_bank, f"FAIL: Expected {raw_bank}, got {fetched_provider.bank_account_details}"
print("  -> SUCCESS: Transparent on-the-fly decryption works seamlessly for models and application code.")

# [TEST 5] API Serializer and View Transparency
print("[TEST 5] Verifying API Serializer and Endpoint Transparency...")
client = Client()
client.force_login(user_test)
res = client.get(f'/api/traveler/profile/{user_test.id}/')
assert res.status_code == 200, f"FAIL: Expected HTTP 200, got {res.status_code}"
profile_data = res.json()
assert profile_data.get('phone_number') == raw_phone, "FAIL: Serialized phone_number does not match plaintext"
assert profile_data.get('national_id') == raw_nid, "FAIL: Serialized national_id does not match plaintext"
print("  -> SUCCESS: Authorized API endpoints deliver decrypted PII to authenticated owners seamlessly.")

# [TEST 6] Historical Records Tracking with Encryption
print("[TEST 6] Verifying HistoricalRecords Audit Trail with PII Encryption...")
profile.phone_number = '01899999999'
profile.save(update_fields=['phone_number'])
history_entries = profile.history.all()
assert history_entries.count() >= 2, "FAIL: HistoricalRecords not tracking updates"
latest_history = history_entries.first()
assert latest_history.phone_number == '01899999999', "FAIL: History record did not capture new phone number"
print("  -> SUCCESS: HistoricalRecords audit revisions transparently handle encrypted PII.")

print("\n" + "=" * 70)
print("ALL 6 TESTS FOR FEATURE 9 (FIELD-LEVEL PII ENCRYPTION) PASSED!")
print("=" * 70)
