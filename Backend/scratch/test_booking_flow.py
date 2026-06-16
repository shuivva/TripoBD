import os
import sys
import django

# Add the Backend directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.test import Client
from django.contrib.auth.models import User
from api.models import ServiceProvider, ServiceProviderBooking

def test_flow():
    client = Client()
    
    # 1. Login traveler1
    print("Logging in as traveler1...")
    login_success = client.login(username='traveler1', password='Traveler@123')
    print("Login status:", login_success)
    
    # 2. Get service providers list (All)
    print("Getting service providers list (All)...")
    res = client.get('/api/traveler/bookings/service-providers/')
    assert res.status_code == 200, f"Failed: {res.status_code}"
    providers = res.json()
    print("Providers found:", [p['user']['username'] for p in providers])
    assert len(providers) >= 4
    
    # 3. Get boat operators list
    print("Getting service providers list (boat_operator)...")
    res = client.get('/api/traveler/bookings/service-providers/?service_type=boat_operator')
    assert res.status_code == 200
    boat_ops = res.json()
    print("Boat operators:", [p['user']['username'] for p in boat_ops])
    assert len(boat_ops) == 1
    assert boat_ops[0]['user']['username'] == 'boat1'
    
    # 4. Book boat1
    boat_sp = ServiceProvider.objects.get(user__username='boat1')
    traveler1 = User.objects.get(username='traveler1')
    
    print(f"Booking boat1 (ID: {boat_sp.id})...")
    payload = {
        'customer_id': traveler1.id,
        'start_date': '2026-07-01',
        'end_date': '2026-07-05',
        'group_size': 3,
        'specific_requirements': 'Need life jackets.',
        'message': 'Excited for boat tour!',
        'agreed_fee': 4500.00,
    }
    res = client.post(f'/api/traveler/bookings/service-providers/{boat_sp.id}/book/', payload, content_type='application/json')
    assert res.status_code == 201, f"Failed: {res.status_code} - {res.content}"
    booking_data = res.json()
    print("Booking created successfully:", booking_data['id'], "Status:", booking_data['status'], "Agreed Fee:", booking_data['agreed_fee'])
    assert float(booking_data['agreed_fee']) == 4500.00
    
    # 5. Fetch bookings as traveler1
    print("Fetching bookings as traveler1...")
    res = client.get(f'/api/traveler/{traveler1.id}/bookings/')
    assert res.status_code == 200
    traveler_bookings = res.json()
    print("Traveler bookings count:", len(traveler_bookings))
    assert len(traveler_bookings) > 0
    # Check that service_provider nested details exist
    last_booking = traveler_bookings[-1]
    print("Nested Service Provider details in booking:", last_booking['service_provider'])
    assert last_booking['service_provider']['user']['username'] == 'boat1'
    
    # 6. Fetch bookings as boat1 (the service provider)
    boat_user = User.objects.get(username='boat1')
    print(f"Fetching bookings as boat1 (User ID: {boat_user.id})...")
    res = client.get(f'/api/traveler/{boat_user.id}/bookings/')
    assert res.status_code == 200
    provider_bookings = res.json()
    print("Provider bookings count:", len(provider_bookings))
    assert len(provider_bookings) > 0
    print("Provider last booking customer name:", provider_bookings[-1]['customer_name'])
    assert provider_bookings[-1]['customer_name'] == traveler1.profile.full_name
    
    print("\n--- ALL TESTS PASSED SUCCESSFULLY! ---")

if __name__ == '__main__':
    test_flow()
