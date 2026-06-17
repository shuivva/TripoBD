import urllib.request
import json

url = 'http://127.0.0.1:8000/api/traveler/27/tourrooms/'
payload = {
    'name': 'Real HTTP Tour Room',
    'destination': 'coxs-bazar',
    'start_date': '2026-07-01T10:00:00Z',
    'end_date': '2026-07-05T10:00:00Z',
    'max_members': 5,
    'is_public': True
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(
    url, 
    data=data, 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("General Error:", e)
