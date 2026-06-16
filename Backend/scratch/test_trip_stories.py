import os
import sys
import django

# Add the Backend directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.test import Client
from django.contrib.auth.models import User
from api.models import Destination, TripStory, UserProfile
import json

def test_stories_flow():
    client = Client()
    # Login traveler1
    login_success = client.login(username='traveler1', password='Traveler@123')
    assert login_success, "Login failed!"
    print("Login successful for traveler1")

    # Get user and profile
    user = User.objects.get(username='traveler1')
    profile = UserProfile.objects.get(user=user)

    # Get a destination slug
    dest = Destination.objects.first()
    if not dest:
        # Create a test destination
        dest = Destination.objects.create(
            slug='test-destination',
            name='Test Destination',
            region='Dhaka',
            category='Adventure',
            budget='Low',
            rating=4.5,
            hero='https://example.com/hero.jpg'
        )
    
    print(f"Using destination: {dest.name} ({dest.slug})")

    # 1. Create a trip story (Draft)
    payload_draft = {
        'title': 'My Draft Trip to ' + dest.name,
        'content': 'We had a lovely time but this is still a draft.',
        'destination_slug': dest.slug,
        'cover_photo': 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg',
        'status': 'draft'
    }
    
    res = client.post(f'/api/traveler/{user.id}/stories/create-update/', json.dumps(payload_draft), content_type='application/json')
    print("Draft story response status:", res.status_code)
    assert res.status_code == 200
    draft_data = res.json()
    assert draft_data['title'] == payload_draft['title']
    assert draft_data['status'] == 'draft'
    print("Draft story created successfully! ID:", draft_data['id'])

    # 2. Create a trip story (Published)
    payload_published = {
        'title': 'A Magical Journey to ' + dest.name,
        'content': 'Sajek Valley was beautiful. The morning mist and evening stars were breathtaking.',
        'destination_slug': dest.slug,
        'cover_photo': 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg',
        'status': 'published'
    }
    
    res = client.post(f'/api/traveler/{user.id}/stories/create-update/', json.dumps(payload_published), content_type='application/json')
    print("Published story response status:", res.status_code)
    assert res.status_code == 200
    pub_data = res.json()
    assert pub_data['status'] == 'published'
    print("Published story created successfully! ID:", pub_data['id'])

    # 3. Check traveler profile details endpoint (My Stories Directory source)
    res = client.get(f'/api/traveler/profile/{user.id}/')
    print("Profile detail response status:", res.status_code)
    assert res.status_code == 200
    profile_data = res.json()
    
    # Verify that the stories show up under trip_stories
    assert 'trip_stories' in profile_data, "trip_stories key missing in traveler profile response!"
    my_stories = profile_data['trip_stories']
    story_ids = [s['id'] for s in my_stories]
    assert draft_data['id'] in story_ids, "Draft story missing from profile stories!"
    assert pub_data['id'] in story_ids, "Published story missing from profile stories!"
    print("Verification passed: Saved stories correctly appear in the traveler profile detail response!")

    # 4. Check list stories endpoint /api/traveler/stories/ (Community Stories Page)
    res = client.get('/api/traveler/stories/')
    print("List stories response status:", res.status_code)
    assert res.status_code == 200
    all_stories = res.json()
    
    # Check that draft is NOT in community list, but published is
    community_ids = [s['id'] for s in all_stories]
    assert draft_data['id'] not in community_ids, "Draft story leaked to public community stories page!"
    assert pub_data['id'] in community_ids, "Published story not showing in public community stories page!"
    
    # Check that newest published is first
    assert all_stories[0]['id'] == pub_data['id'], "Recent story is not first in ordering!"
    print("Verification passed: /api/traveler/stories/ contains only published, sorted by published_at desc!")

    # 5. Check Dashboard endpoint /api/traveler/dashboard/<user_id>/
    res = client.get(f'/api/traveler/dashboard/{user.id}/')
    print("Dashboard response status:", res.status_code)
    assert res.status_code == 200
    dash_data = res.json()
    
    # Verify that trip_stories contains our published story
    dash_stories = dash_data['trip_stories']
    dash_story_ids = [s['id'] for s in dash_stories]
    assert pub_data['id'] in dash_story_ids, "My published story is not highlighted on my dashboard feed!"
    print("Verification passed: My published story successfully highlighted on my dashboard feed!")

    # 6. Test Delete Story
    res = client.delete(f'/api/traveler/stories/{pub_data["id"]}/')
    print("Delete story response status:", res.status_code)
    assert res.status_code == 200
    
    # Clean up draft as well
    res = client.delete(f'/api/traveler/stories/{draft_data["id"]}/')
    print("Delete draft story response status:", res.status_code)
    assert res.status_code == 200

    print("All trip stories flow tests passed successfully!")

if __name__ == '__main__':
    test_stories_flow()
