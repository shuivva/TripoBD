import urllib.request
import json

# Let's delete room 25 which we created earlier (owned by user 27)
room_id = 25
url = f'http://127.0.0.1:8000/api/traveler/27/tourrooms/{room_id}/'

req = urllib.request.Request(
    url, 
    method='DELETE'
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

# Test unauthorized deletion (attempting to delete as user 999)
unauth_url = f'http://127.0.0.1:8000/api/traveler/999/tourrooms/{room_id}/'
req_unauth = urllib.request.Request(
    unauth_url, 
    method='DELETE'
)

try:
    with urllib.request.urlopen(req_unauth) as response:
        print("Unauth Status:", response.status)
except urllib.error.HTTPError as e:
    print("Unauth HTTP Error (expected 403 or 404):", e.code)
    print("Unauth Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Unauth General Error:", e)
