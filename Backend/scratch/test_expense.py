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
from api.models import TourRoom, TourRoomExpense

def test_expense():
    client = Client()
    # Login traveler1
    client.login(username='traveler1', password='Traveler@123')
    
    # Get any room
    room = TourRoom.objects.first()
    if not room:
        print("No tour room found! Please create one or skip.")
        return
        
    traveler1 = User.objects.get(username='traveler1')
    
    payload = {
        'description': 'Test group dinner',
        'amount': 150.00,
        'payer_id': traveler1.id,
        'participant_ids': [traveler1.id]
    }
    
    res = client.post(f'/api/tourrooms/{room.id}/expenses/', payload, content_type='application/json')
    print("Response status:", res.status_code)
    print("Response content:", res.content)
    assert res.status_code == 201
    print("Expense creation test passed!")

if __name__ == '__main__':
    test_expense()
