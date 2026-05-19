from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date
from api.models import (
    Destination,
    Attraction,
    Accommodation,
    Review,
    TourGroup,
    Guide,
    Route,
    UserProfile,
    TravelPreferences,
    TravelStats,
    Badge,
    UserBadge,
    Wishlist,
    TripStory,
    AccountSettings,
)

SAMPLE_DESTINATIONS = [
    {
        'slug': 'sundarbans',
        'name': 'Sundarbans',
        'region': 'Khulna',
        'category': 'Forest',
        'budget': 'Medium',
        'rating': 4.9,
        'duration': '3-5 days',
        'season': 'Winter',
        'summary': 'Explore the world’s largest mangrove forest with boat safaris and wildlife spotting.',
        'description': 'A UNESCO World Heritage site offering boat safaris, tiger tracking and eco camps.',
        'hero': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        'coords': [22.0, 89.0],
        'attractions': ['Sajnekhali Watchtower', 'Dobanki Jungle Camp', 'Hiron Point'],
        'accommodations': [
            {'name': 'Eco River Lodge', 'price': '4500', 'summary': 'Comfortable riverfront rooms with guided tours.'},
            {'name': 'Mangrove Campsite', 'price': '3200', 'summary': 'Tented eco-camp with bonfire evenings.'},
        ],
        'reviews': [
            {'author': 'Ayesha', 'score': 5, 'note': 'Amazing wildlife and the guides were so patient.'},
            {'author': 'Tanvir', 'score': 4, 'note': 'Beautiful scenery and peaceful river travel.'},
        ],
        'groups': [
            {'name': 'Weekend Sundarbans Crew', 'members': 12, 'departure': 'Next Friday'},
        ],
    },
    {
        'slug': 'coxs-bazar',
        'name': "Cox's Bazar",
        'region': 'Chittagong',
        'category': 'Beach',
        'budget': 'Medium',
        'rating': 4.8,
        'duration': '3-5 days',
        'season': 'Winter',
        'summary': 'Walk the world’s longest beach and enjoy fresh seafood and sunset views.',
        'description': 'Sandy beaches, seafood markets and sunset strolls.',
        'hero': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        'coords': [21.4272, 92.0058],
        'attractions': ['Himchari Waterfall', 'Inani Beach'],
        'accommodations': [
            {'name': 'Sunset Beach Resort', 'price': '5200', 'summary': 'Seafront rooms with private balconies.'},
        ],
        'reviews': [
            {'author': 'Farah', 'score': 5, 'note': 'Perfect beach days and excellent local guide recommendations.'},
        ],
        'groups': [
            {'name': "Beach Group 2026", 'members': 18, 'departure': 'Next month'},
        ],
    },
]

SAMPLE_GUIDES = [
    {'name': 'Rafiq Hasan', 'location': 'Sundarbans', 'rating': 4.9, 'bio': 'Experienced wildlife guide.'},
    {'name': 'Nazma Begum', 'location': "Cox's Bazar", 'rating': 4.8, 'bio': 'Beach guide and host.'},
]

SAMPLE_ROUTES = [
    {'from': 'Dhaka', 'to': "Cox's Bazar", 'mode': 'Bus', 'operator': 'Shyamoli Paribahan', 'fare': 1200, 'duration': '10h', 'departure': '22:00', 'travel_class': 'Volvo AC', 'tips': 'Book overnight bus.' , 'path': [[23.8103, 90.4125], [21.4272, 92.0058]]},
    {'from': 'Dhaka', 'to': 'Sundarbans', 'mode': 'Mixed', 'operator': 'Sundarban Tour Express', 'fare': 1800, 'duration': '12h', 'departure': '08:30', 'travel_class': 'Bus + Boat', 'tips': 'Morning bus and boat transfer.', 'path': [[23.8103, 90.4125], [22.0, 89.0]]},
]

class Command(BaseCommand):
    help = 'Seed the database with sample destinations, guides, routes, and traveler profiles.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding sample data...')

        for d in SAMPLE_DESTINATIONS:
            dest, created = Destination.objects.update_or_create(
                slug=d['slug'],
                defaults={
                    'name': d['name'],
                    'region': d['region'],
                    'category': d['category'],
                    'budget': d['budget'],
                    'rating': d['rating'],
                    'duration': d.get('duration', ''),
                    'season': d.get('season', ''),
                    'summary': d.get('summary', ''),
                    'description': d.get('description', ''),
                    'hero': d.get('hero', ''),
                    'coords_lat': d.get('coords', [None, None])[0],
                    'coords_lng': d.get('coords', [None, None])[1],
                }
            )

            # Attractions
            Attraction.objects.filter(destination=dest).delete()
            for a in d.get('attractions', []):
                Attraction.objects.create(destination=dest, name=a)

            # Accommodations
            Accommodation.objects.filter(destination=dest).delete()
            for a in d.get('accommodations', []):
                Accommodation.objects.create(destination=dest, name=a['name'], price=a['price'], summary=a.get('summary',''))

            # Reviews
            Review.objects.filter(destination=dest).delete()
            for r in d.get('reviews', []):
                Review.objects.create(destination=dest, author=r['author'], score=r['score'], note=r.get('note',''))

            # Groups
            TourGroup.objects.filter(destination=dest).delete()
            for g in d.get('groups', []):
                TourGroup.objects.create(destination=dest, name=g['name'], members=g['members'], departure=g['departure'])

            self.stdout.write(f'Processed destination: {dest.name}')

        # Guides
        Guide.objects.all().delete()
        for g in SAMPLE_GUIDES:
            Guide.objects.create(name=g['name'], location=g['location'], rating=g['rating'], bio=g.get('bio',''))
        self.stdout.write('Guides seeded')

        # Routes
        Route.objects.all().delete()
        for r in SAMPLE_ROUTES:
            Route.objects.create(
                from_location=r['from'],
                to_location=r['to'],
                mode=r['mode'],
                operator=r['operator'],
                fare=r['fare'],
                duration=r['duration'],
                departure=r['departure'],
                travel_class=r['travel_class'],
                tips=r.get('tips',''),
                path=r.get('path',[]),
            )
        self.stdout.write('Routes seeded')

        # Traveler profile sample
        user, created = User.objects.get_or_create(
            username='traveler1',
            defaults={'email': 'traveler1@example.com'},
        )
        if not created and user.email != 'traveler1@example.com':
            user.email = 'traveler1@example.com'
        user.set_password('Traveler@123')
        user.save()

        profile, _ = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'full_name': 'Ayesha Rahman',
                'phone_number': '01700000000',
                'date_of_birth': date(1995, 5, 12),
                'gender': 'female',
                'division': 'dhaka',
                'district': 'Dhaka',
                'user_type': 'traveler',
                'is_email_verified': True,
            },
        )

        TravelPreferences.objects.update_or_create(
            user_profile=profile,
            defaults={
                'preferred_destinations': "Cox's Bazar, Sundarbans",
                'travel_style': 'cultural',
                'group_size_preference': 4,
                'languages_spoken': 'Bangla, English',
            },
        )

        TravelStats.objects.update_or_create(
            user_profile=profile,
            defaults={
                'total_trips_logged': 8,
                'destinations_visited': 12,
                'stories_posted': 3,
                'reviews_written': 5,
                'leaderboard_rank': 14,
            },
        )

        AccountSettings.objects.filter(user_profile=profile).delete()
        AccountSettings.objects.create(
            user_profile=profile,
            profile_visibility='public',
            two_factor_enabled=False,
            deactivation_requested=False,
            deactivation_requested_at=None,
            deactivation_reason='',
        )

        explorer_badge, _ = Badge.objects.update_or_create(
            name='Explorer',
            defaults={
                'description': 'Visited 5 destinations',
                'icon': '🧭',
                'requirement': 'Visit 5 unique destinations',
            },
        )
        storyteller_badge, _ = Badge.objects.update_or_create(
            name='Storyteller',
            defaults={
                'description': 'Shared your first trip story',
                'icon': '✍️',
                'requirement': 'Publish one trip story',
            },
        )
        UserBadge.objects.get_or_create(user_profile=profile, badge=explorer_badge)
        UserBadge.objects.get_or_create(user_profile=profile, badge=storyteller_badge)

        Wishlist.objects.filter(user_profile=profile).delete()
        wishlist_dest = Destination.objects.filter(slug='coxs-bazar').first()
        if wishlist_dest:
            Wishlist.objects.create(user_profile=profile, destination=wishlist_dest, notes='Plan for winter')

        TripStory.objects.filter(user_profile=profile).delete()
        story_dest = Destination.objects.filter(slug='sundarbans').first()
        if story_dest:
            TripStory.objects.create(
                user_profile=profile,
                destination=story_dest,
                title='Mangrove Adventure',
                content='Explored the mangroves and spotted wildlife during a sunset cruise.',
                status='published',
                published_at=timezone.now(),
            )
            TripStory.objects.create(
                user_profile=profile,
                destination=story_dest,
                title='Draft: River Journey',
                content='Notes and memories from the river journey.',
                status='draft',
            )

        self.stdout.write('Traveler profile seeded')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
