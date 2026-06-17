import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.test import Client

def test_create_tourroom():
    client = Client()
    payload = {
        'name': 'Test Tour Room',
        'destination': 'coxs-bazar',
        'start_date': '2026-07-01T10:00:00Z',
        'end_date': '2026-07-05T10:00:00Z',
        'max_members': 5,
        'is_public': True
    }
    
    res = client.post('/api/traveler/27/tourrooms/', payload, content_type='application/json')
    print("Response status:", res.status_code)
    try:
        print("Response content:", res.json())
    except Exception:
        print("Response content (raw):", res.content)

if __name__ == '__main__':
    test_create_tourroom()
