import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate

user = authenticate(username='shuvo', password='asdf1234')
print(f"Authentication result for shuvo: {user}")
if user:
    print(f"Is staff? {user.is_staff}")
    print(f"Is superuser? {user.is_superuser}")
    print(f"Is active? {user.is_active}")
