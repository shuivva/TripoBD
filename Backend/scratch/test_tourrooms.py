import os
import sys
import django

# Add current directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, TourRoomMembership, TourRoom
from api.views import _get_traveler_profile_or_404
from api.serializers import TourRoomSerializer

try:
    print("Calling _get_traveler_profile_or_404(27)...")
    profile = _get_traveler_profile_or_404(27)
    print(f"Profile: {profile}")
    
    user = User.objects.get(id=27)
    memberships = TourRoomMembership.objects.filter(user=user)
    rooms = [m.room for m in memberships if not m.room.is_archived]
    print(f"Active rooms: {rooms}")
    
    data = TourRoomSerializer(rooms, many=True).data
    print("Serialized data successfully:")
    print(data)
except Exception as e:
    import traceback
    traceback.print_exc()
