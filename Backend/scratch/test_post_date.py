import urllib.request
import json

url = 'http://127.0.0.1:8000/api/traveler/27/tourrooms/'
payload = {
    'name': 'Test Date Format',
    'destination': 'coxs-bazar',
    'start_date': '2026-07-01',  # YYYY-MM-DD
    'end_date': '2026-07-05',    # YYYY-MM-DD
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
