import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(id=27)
    user.set_password('Traveler@123')
    user.save()
    print("Successfully set password for user 27 (souravbiswas) to 'Traveler@123'.")
except Exception as e:
    print("Error:", e)
