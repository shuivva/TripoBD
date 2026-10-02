import os
import sys
import uuid

# Setup Django Environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from api.models import (
    UserProfile,
    ServiceProvider,
    ServiceProviderBooking,
    TourRoom,
    TourRoomMembership,
    TourRoomActivity,
    TripStory,
    Destination,
    AccountSettings,
)
from api.permissions import (
    IsOwnerOrReadOnly,
    IsTourRoomMember,
    IsBookingParticipant,
    IsOwnerOnly,
)


def run_tests():
    print("=" * 65)
    print("STARTING SECURITY FEATURE 3 (IDOR & OBJECT ACCESS) VERIFICATION")
    print("=" * 65)

    client = APIClient()

    # -------------------------------------------------------------
    # TEST 1: DATABASE UUID VERIFICATION
    # -------------------------------------------------------------
    print("\n[TEST 1] Verifying Model UUID Integrity & Uniqueness...")
    models_to_check = [
        ('ServiceProviderBooking', ServiceProviderBooking),
        ('TourRoom', TourRoom),
        ('ServiceProvider', ServiceProvider),
        ('TripStory', TripStory),
    ]

    for name, ModelClass in models_to_check:
        total = ModelClass.objects.count()
        null_count = ModelClass.objects.filter(uuid__isnull=True).count()
        assert null_count == 0, f"Found {null_count} null UUIDs in {name}"
        uuids = list(ModelClass.objects.values_list('uuid', flat=True))
        unique_uuids = set(uuids)
        assert len(uuids) == len(unique_uuids), f"Duplicate UUIDs found in {name}!"
        print(f"  -> {name}: {total} records, all valid & unique UUIDs.")

    print("  -> SUCCESS: Database UUID integrity verified.")

    # -------------------------------------------------------------
    # SETUP TEST USERS & DATA
    # -------------------------------------------------------------
    print("\n[SETUP] Creating isolated test users and resources...")
    user_a, _ = User.objects.get_or_create(username='idor_user_a', defaults={'email': 'usera@test.com'})
    user_a.set_password('Pass1234!')
    user_a.save()
    profile_a, _ = UserProfile.objects.get_or_create(
        user=user_a,
        defaults={
            'full_name': 'User Alpha',
            'phone_number': '01711111111',
            'date_of_birth': '1995-01-01',
            'gender': 'male',
            'division': 'dhaka',
            'district': 'Dhaka',
            'user_type': 'traveler',
        }
    )
    AccountSettings.objects.get_or_create(user_profile=profile_a)

    user_b, _ = User.objects.get_or_create(username='idor_user_b', defaults={'email': 'userb@test.com'})
    user_b.set_password('Pass1234!')
    user_b.save()
    profile_b, _ = UserProfile.objects.get_or_create(
        user=user_b,
        defaults={
            'full_name': 'User Beta',
            'phone_number': '01722222222',
            'date_of_birth': '1996-02-02',
            'gender': 'female',
            'division': 'chittagong',
            'district': 'Chittagong',
            'user_type': 'traveler',
        }
    )
    AccountSettings.objects.get_or_create(user_profile=profile_b)

    guide_user, _ = User.objects.get_or_create(username='idor_guide_user', defaults={'email': 'guide@test.com'})
    guide_user.set_password('Pass1234!')
    guide_user.save()
    guide_profile, _ = UserProfile.objects.get_or_create(
        user=guide_user,
        defaults={
            'full_name': 'Guide Test',
            'phone_number': '01733333333',
            'date_of_birth': '1990-03-03',
            'gender': 'male',
            'division': 'sylhet',
            'district': 'Sylhet',
            'user_type': 'service_provider',
        }
    )
    sp, _ = ServiceProvider.objects.get_or_create(
        user=guide_user,
        defaults={
            'service_type': 'tour_guide',
            'specialized_destinations': 'Sylhet, Sreemangal',
            'years_of_experience': 5,
            'languages_offered': 'Bangla, English',
            'fee_range': '2000-3000 BDT/day',
            'bank_account_details': 'DBBL 1234567890',
            'is_verified': True,
        }
    )

    dest = Destination.objects.first()
    if not dest:
        dest = Destination.objects.create(
            name='Sylhet Valley',
            slug='sylhet-valley',
            region='sylhet',
            category='Nature',
            rating=4.5,
            reviews_count=10,
        )

    # User A creates a booking with Guide
    booking_a, _ = ServiceProviderBooking.objects.get_or_create(
        customer=user_a,
        service_provider=sp,
        defaults={
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date(),
            'group_size': 2,
            'status': 'requested',
            'message': 'Private trip for User A',
        }
    )

    # User A creates a private TourRoom
    room_a, _ = TourRoom.objects.get_or_create(
        name='User A Private Room',
        owner=user_a,
        defaults={
            'start_datetime': timezone.now(),
            'end_datetime': timezone.now(),
            'is_public': False,
        }
    )
    TourRoomMembership.objects.get_or_create(room=room_a, user=user_a, defaults={'is_admin': True})

    # User A creates a draft TripStory
    story_a, _ = TripStory.objects.get_or_create(
        user_profile=profile_a,
        title='User A Secret Draft Story',
        destination=dest,
        defaults={
            'content': 'Confidential itinerary and thoughts',
            'status': 'draft',
        }
    )

    # -------------------------------------------------------------
    # TEST 2: PERMISSION CLASSES UNIT TESTING
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing DRF Custom Permission Classes...")
    perm_owner = IsOwnerOrReadOnly()
    perm_room = IsTourRoomMember()
    perm_booking = IsBookingParticipant()
    perm_owner_only = IsOwnerOnly()

    class DummyReq:
        def __init__(self, user, method='GET'):
            self.user = user
            self.method = method

    # IsBookingParticipant
    assert perm_booking.has_object_permission(DummyReq(user_a), None, booking_a) is True, "User A (customer) should have permission"
    assert perm_booking.has_object_permission(DummyReq(guide_user), None, booking_a) is True, "Guide should have permission"
    assert perm_booking.has_object_permission(DummyReq(user_b), None, booking_a) is False, "User B (stranger) must NOT have permission"
    print("  -> IsBookingParticipant: customer=True, provider=True, stranger=False [OK]")

    # IsTourRoomMember
    assert perm_room.has_object_permission(DummyReq(user_a), None, room_a) is True, "Owner/member A should have access"
    assert perm_room.has_object_permission(DummyReq(user_b), None, room_a) is False, "Non-member B must NOT have access"
    print("  -> IsTourRoomMember: member=True, non-member=False [OK]")

    # IsOwnerOrReadOnly
    assert perm_owner.has_object_permission(DummyReq(user_b, 'GET'), None, story_a) is True, "Read-only GET allowed by base permission"
    assert perm_owner.has_object_permission(DummyReq(user_b, 'DELETE'), None, story_a) is False, "Stranger cannot DELETE"
    assert perm_owner.has_object_permission(DummyReq(user_a, 'DELETE'), None, story_a) is True, "Owner CAN DELETE"
    print("  -> IsOwnerOrReadOnly: safe GET=True, stranger DELETE=False, owner DELETE=True [OK]")

    # IsOwnerOnly
    assert perm_owner_only.has_object_permission(DummyReq(user_b, 'GET'), None, profile_a) is False, "Stranger cannot read private profile"
    assert perm_owner_only.has_object_permission(DummyReq(user_a, 'GET'), None, profile_a) is True, "Owner can read own profile"
    print("  -> IsOwnerOnly: stranger=False, owner=True [OK]")

    # -------------------------------------------------------------
    # TEST 3: API ENDPOINT IDOR DEFENSE (BOOKINGS)
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing Booking Endpoints IDOR Protection...")
    # User B logs in
    client.force_authenticate(user=user_b)

    # User B attempts to read User A's bookings list
    res = client.get(f'/api/traveler/{user_a.id}/bookings/')
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403 on reading another user's bookings, got {res.status_code}"
    print(f"  -> User B accessing /api/traveler/{user_a.id}/bookings/ -> Blocked (HTTP 403) [OK]")

    # User B attempts to tamper with User A's booking status using integer ID
    res = client.post(f'/api/traveler/bookings/{booking_a.id}/status/', {'status': 'cancelled'})
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403 on tampering with another user's booking, got {res.status_code}"
    print(f"  -> User B tampering with booking ID {booking_a.id} status -> Blocked (HTTP 403) [OK]")

    # User B attempts to tamper with User A's booking status using UUID
    res = client.post(f'/api/traveler/bookings/{booking_a.uuid}/status/', {'status': 'cancelled'})
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403 on tampering via UUID, got {res.status_code}"
    print(f"  -> User B tampering with booking UUID {booking_a.uuid} status -> Blocked (HTTP 403) [OK]")

    # User A accesses own bookings
    client.force_authenticate(user=user_a)
    res = client.get(f'/api/traveler/{user_a.id}/bookings/')
    assert res.status_code == status.HTTP_200_OK, f"Expected 200 for User A, got {res.status_code}"
    print(f"  -> User A accessing own bookings -> Allowed (HTTP 200, count: {len(res.data)}) [OK]")

    # User A updates own booking status
    res = client.post(f'/api/traveler/bookings/{booking_a.uuid}/status/', {'status': 'confirmed'})
    assert res.status_code == status.HTTP_200_OK, f"Expected 200 for User A, got {res.status_code}"
    booking_a.refresh_from_db()
    assert booking_a.status == 'confirmed', "Booking status should have updated"
    print(f"  -> User A updating own booking status via UUID -> Allowed (HTTP 200, status={booking_a.status}) [OK]")

    # -------------------------------------------------------------
    # TEST 4: API ENDPOINT IDOR DEFENSE (TOUR ROOMS)
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing Tour Room Endpoints IDOR Protection...")
    client.force_authenticate(user=user_b)

    # User B attempts to inspect User A's private room
    res = client.get(f'/api/traveler/{user_a.id}/tourrooms/{room_a.id}/')
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res.status_code}"
    print(f"  -> User B accessing User A's Tour Room -> Blocked (HTTP 403) [OK]")

    # User B attempts to inject activity into User A's private room using UUID
    res = client.post(f'/api/tourrooms/{room_a.uuid}/activities/', {'title': 'Malicious Activity', 'day_number': 1})
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res.status_code}"
    print(f"  -> User B injecting activity into room UUID {room_a.uuid} -> Blocked (HTTP 403) [OK]")

    # User B attempts to record expense in User A's private room
    res = client.post(f'/api/tourrooms/{room_a.id}/expenses/', {'payer': user_b.id, 'amount': 1000, 'description': 'Fake'})
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res.status_code}"
    print(f"  -> User B recording expense in room ID {room_a.id} -> Blocked (HTTP 403) [OK]")

    # User A accesses own room via int ID and UUID
    client.force_authenticate(user=user_a)
    res_int = client.get(f'/api/traveler/{user_a.id}/tourrooms/{room_a.id}/')
    assert res_int.status_code == status.HTTP_200_OK, f"Expected 200 for int lookup, got {res_int.status_code}"
    res_uuid = client.get(f'/api/traveler/{user_a.id}/tourrooms/{room_a.uuid}/')
    assert res_uuid.status_code == status.HTTP_200_OK, f"Expected 200 for UUID lookup, got {res_uuid.status_code}"
    print(f"  -> User A accessing own room via ID ({room_a.id}) & UUID ({room_a.uuid}) -> Allowed (HTTP 200) [OK]")

    # -------------------------------------------------------------
    # TEST 5: API ENDPOINT IDOR DEFENSE (PROFILE & SETTINGS)
    # -------------------------------------------------------------
    print("\n[TEST 5] Testing Traveler Profile & Settings IDOR Protection...")
    client.force_authenticate(user=user_b)

    # User B attempts to modify User A's profile
    res = client.patch(f'/api/traveler/profile/{user_a.id}/update/', {'full_name': 'Hacked User A'})
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res.status_code}"
    print(f"  -> User B updating User A's profile -> Blocked (HTTP 403) [OK]")

    # User B attempts to access User A's dashboard
    res = client.get(f'/api/traveler/dashboard/{user_a.id}/')
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res.status_code}"
    print(f"  -> User B accessing User A's dashboard -> Blocked (HTTP 403) [OK]")

    # User B attempts to change User A's password
    res = client.post(f'/api/traveler/profile/{user_a.id}/change-password/', {
        'current_password': 'Pass1234!',
        'new_password': 'NewPass1234!'
    })
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res.status_code}"
    print(f"  -> User B changing User A's password -> Blocked (HTTP 403) [OK]")

    # -------------------------------------------------------------
    # TEST 6: API ENDPOINT IDOR DEFENSE (TRIP STORIES)
    # -------------------------------------------------------------
    print("\n[TEST 6] Testing Trip Stories Draft & Deletion IDOR Protection...")
    client.force_authenticate(user=user_b)

    # User B attempts to read User A's draft story
    res = client.get(f'/api/traveler/stories/{story_a.id}/')
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403 on draft story, got {res.status_code}"
    print(f"  -> User B reading User A's draft story -> Blocked (HTTP 403) [OK]")

    # User B attempts to delete User A's story using UUID
    res = client.delete(f'/api/traveler/stories/{story_a.uuid}/')
    assert res.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403 on delete, got {res.status_code}"
    print(f"  -> User B deleting User A's story via UUID -> Blocked (HTTP 403) [OK]")

    # User A reads own draft story via UUID
    client.force_authenticate(user=user_a)
    res = client.get(f'/api/traveler/stories/{story_a.uuid}/')
    assert res.status_code == status.HTTP_200_OK, f"Expected 200, got {res.status_code}"
    print(f"  -> User A reading own draft story via UUID -> Allowed (HTTP 200) [OK]")

    # -------------------------------------------------------------
    # TEST 7: DRF VIEWSETS USER-SCOPED QUERYSET & UUID LOOKUP
    # -------------------------------------------------------------
    print("\n[TEST 7] Testing DRF ViewSets Scoped Querysets & UUID Lookup...")
    client.force_authenticate(user=user_b)

    # User B calls /api/v1/bookings/
    res = client.get('/api/v1/bookings/')
    assert res.status_code == status.HTTP_200_OK
    booking_ids_in_feed = [b['uuid'] for b in res.data]
    assert str(booking_a.uuid) not in booking_ids_in_feed, "User A's booking must NOT appear in User B's scoped queryset"
    print("  -> User B GET /api/v1/bookings/ -> User A's bookings excluded from queryset [OK]")

    # User B attempts direct UUID lookup on User A's booking
    res = client.get(f'/api/v1/bookings/{booking_a.uuid}/')
    assert res.status_code == status.HTTP_404_NOT_FOUND, f"Expected 404 (scoped out), got {res.status_code}"
    print(f"  -> User B GET /api/v1/bookings/{booking_a.uuid}/ -> Not Found (HTTP 404) [OK]")

    # User A accesses own booking via ViewSet UUID route
    client.force_authenticate(user=user_a)
    res = client.get(f'/api/v1/bookings/{booking_a.uuid}/')
    assert res.status_code == status.HTTP_200_OK, f"Expected 200, got {res.status_code}"
    assert res.data['uuid'] == str(booking_a.uuid)
    print(f"  -> User A GET /api/v1/bookings/{booking_a.uuid}/ -> Found (HTTP 200) [OK]")

    # TourRoom ViewSet UUID lookup
    res = client.get(f'/api/v1/tourrooms/{room_a.uuid}/')
    assert res.status_code == status.HTTP_200_OK, f"Expected 200, got {res.status_code}"
    assert res.data['uuid'] == str(room_a.uuid)
    print(f"  -> User A GET /api/v1/tourrooms/{room_a.uuid}/ -> Found (HTTP 200) [OK]")

    # User B attempts to access TourRoom ViewSet for private room
    client.force_authenticate(user=user_b)
    res = client.get(f'/api/v1/tourrooms/{room_a.uuid}/')
    assert res.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND), f"Expected 403/404, got {res.status_code}"
    print(f"  -> User B GET /api/v1/tourrooms/{room_a.uuid}/ -> Blocked/NotFound (HTTP {res.status_code}) [OK]")

    print("\n" + "=" * 65)
    print("ALL 7 FEATURE 3 TESTS PASSED PERFECTLY!")
    print("=" * 65)


if __name__ == '__main__':
    run_tests()
