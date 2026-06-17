import urllib.request
import json

url = 'http://127.0.0.1:8000/api/traveler/27/tourrooms/25/'

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", json.dumps(json.loads(response.read().decode('utf-8')), indent=2))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("General Error:", e)
