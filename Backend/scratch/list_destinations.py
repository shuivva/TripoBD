import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Destination

destinations = Destination.objects.all()
print("Destinations in Database:")
for d in destinations:
    print(f"- Name: {d.name}, Slug: {d.slug}")
