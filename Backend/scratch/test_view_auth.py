import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.views import login_view
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.post('/api/auth/login/', {'identifier': 'shuvo', 'password': 'asdf1234'}, format='json')

response = login_view(request)
print("Response data:", response.data)
print("Response status:", response.status_code)
