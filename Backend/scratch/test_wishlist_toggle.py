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
from api.models import Wishlist, Destination

def test_wishlist_toggle():
    client = Client()
    
    # Get traveler1 user
    user = User.objects.get(username='traveler1')
    
    # 1. Verify traveler1 login
    print("Logging in as traveler1...")
    login_success = client.login(username='traveler1', password='Traveler@123')
    print("Login status:", login_success)
    assert login_success, "Login failed"
    
    # Ensure Sajek exists
    sajek, _ = Destination.objects.get_or_create(
        slug='sajek',
        defaults={'name': 'Sajek Valley', 'region': 'Chittagong', 'category': 'Hills', 'rating': 4.8}
    )
    
    # Clean up existing Sajek in traveler1's wishlist if any
    Wishlist.objects.filter(user_profile=user.profile, destination=sajek).delete()
    
    # 2. Toggle Sajek to add it to the wishlist
    print("Toggling Sajek (add)...")
    payload = {
        'destination_slug': 'sajek'
    }
    res = client.post(f'/api/traveler/{user.id}/wishlist/toggle/', payload, content_type='application/json')
    assert res.status_code == 200, f"Failed: {res.status_code} - {res.content}"
    data = res.json()
    print("Toggle response (add):", data)
    assert data['is_saved'] is True
    assert Wishlist.objects.filter(user_profile=user.profile, destination=sajek).exists()
    
    # 3. Toggle Sajek again to remove it from the wishlist
    print("Toggling Sajek (remove)...")
    res = client.post(f'/api/traveler/{user.id}/wishlist/toggle/', payload, content_type='application/json')
    assert res.status_code == 200, f"Failed: {res.status_code} - {res.content}"
    data = res.json()
    print("Toggle response (remove):", data)
    assert data['is_saved'] is False
    assert not Wishlist.objects.filter(user_profile=user.profile, destination=sajek).exists()
    
    # 4. Toggle Sajek one more time to add it back
    print("Toggling Sajek again (add back)...")
    res = client.post(f'/api/traveler/{user.id}/wishlist/toggle/', payload, content_type='application/json')
    assert res.status_code == 200
    data = res.json()
    print("Toggle response (add back):", data)
    assert data['is_saved'] is True
    
    # 5. Fetch traveler profile and verify Sajek is inside profile wishlist
    print("Fetching traveler profile details...")
    res = client.get(f'/api/traveler/profile/{user.id}/')
    assert res.status_code == 200, f"Failed: {res.status_code} - {res.content}"
    profile_data = res.json()
    
    wishlist_slugs = [item['destination']['slug'] for item in profile_data.get('wishlist', []) if item.get('destination')]
    print("Current Wishlist Slugs in profile:", wishlist_slugs)
    assert 'sajek' in wishlist_slugs, "Sajek should be in traveler profile wishlist"
    
    print("\n--- WISHLIST TOGGLE BACKEND TESTS PASSED SUCCESSFULLY! ---")

if __name__ == '__main__':
    test_wishlist_toggle()
