from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, datetime, timedelta
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
    TourRoom,
    TourRoomMembership,
    TravelerNotification,
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

        # Guides / routes (optional — DB schema may include extra columns)
        try:
            Guide.objects.all().delete()
            for g in SAMPLE_GUIDES:
                Guide.objects.create(name=g['name'], location=g['location'], rating=g['rating'], bio=g.get('bio', ''))
            self.stdout.write('Guides seeded')
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f'Skipped guides seed: {exc}'))

        try:
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
                    tips=r.get('tips', ''),
                    path=r.get('path', []),
                )
            self.stdout.write('Routes seeded')
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f'Skipped routes seed: {exc}'))

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
                'total_trips_logged': 12,
                'destinations_visited': 8,
                'stories_posted': 3,
                'reviews_written': 5,
                'connections_count': 156,
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

        # Weekly view counts for trending
        Destination.objects.filter(slug='sundarbans').update(weekly_views=15200)
        Destination.objects.filter(slug='coxs-bazar').update(weekly_views=12500)

        Wishlist.objects.filter(user_profile=profile).delete()
        for slug, notes in [
            ('coxs-bazar', 'Plan for winter'),
            ('sundarbans', 'Wildlife safari'),
        ]:
            dest = Destination.objects.filter(slug=slug).first()
            if dest:
                Wishlist.objects.get_or_create(
                    user_profile=profile,
                    destination=dest,
                    defaults={'notes': notes},
                )

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

        # Second traveler for community trip stories
        author_user, _ = User.objects.get_or_create(
            username='traveler2',
            defaults={'email': 'traveler2@example.com'},
        )
        author_user.set_password('Traveler@123')
        author_user.save()
        author_profile, _ = UserProfile.objects.update_or_create(
            user=author_user,
            defaults={
                'full_name': 'Emma Wilson',
                'phone_number': '01700000001',
                'date_of_birth': date(1992, 3, 8),
                'gender': 'female',
                'division': 'chittagong',
                'district': "Cox's Bazar",
                'user_type': 'traveler',
                'is_email_verified': True,
            },
        )
        TravelPreferences.objects.get_or_create(user_profile=author_profile)
        TravelStats.objects.get_or_create(user_profile=author_profile)
        AccountSettings.objects.get_or_create(user_profile=author_profile)

        cox_dest = Destination.objects.filter(slug='coxs-bazar').first()
        if cox_dest and story_dest:
            TripStory.objects.filter(user_profile=author_profile).delete()
            TripStory.objects.create(
                user_profile=author_profile,
                destination=cox_dest,
                title='Beach Sunset',
                content='Golden hour on the longest beach.',
                status='published',
                published_at=timezone.now(),
                likes_count=234,
                photos=[cox_dest.hero],
            )
            TripStory.objects.create(
                user_profile=author_profile,
                destination=story_dest,
                title='Mangrove Morning',
                content='Early boat ride through the channels.',
                status='published',
                published_at=timezone.now(),
                likes_count=189,
                photos=[story_dest.hero],
            )

        # Tour rooms and memberships
        sundarbans = Destination.objects.filter(slug='sundarbans').first()
        coxs = Destination.objects.filter(slug='coxs-bazar').first()
        today = date.today()

        TourRoomMembership.objects.filter(user=user).delete()
        TourRoom.objects.filter(name__in=[
            'Sundarbans Wildlife Expedition',
            "Cox's Bazar Beach Group",
            'Dhaka Weekend Explorers',
        ]).delete()

        def _room_dates(start_day_offset, duration_days):
            start = timezone.make_aware(
                datetime.combine(today + timedelta(days=start_day_offset), datetime.min.time())
            )
            end = timezone.make_aware(
                datetime.combine(
                    today + timedelta(days=start_day_offset + duration_days),
                    datetime.min.time(),
                )
            )
            return start, end

        if sundarbans:
            start, end = _room_dates(45, 7)
            upcoming_room = TourRoom.objects.create(
                name='Sundarbans Wildlife Expedition',
                destination=sundarbans,
                start_datetime=start,
                end_datetime=end,
                description='Boat safari and mangrove exploration.',
            )
            TourRoomMembership.objects.create(user=user, room=upcoming_room, unread_count=0)

        if coxs:
            start, end = _room_dates(90, 5)
            beach_room = TourRoom.objects.create(
                name="Cox's Bazar Beach Group",
                destination=coxs,
                start_datetime=start,
                end_datetime=end,
                description='Beach walks and seafood tours.',
            )
            TourRoomMembership.objects.create(user=user, room=beach_room, unread_count=5)

        if sundarbans:
            start, end = _room_dates(-10, 3)
            explorers_room = TourRoom.objects.create(
                name='Dhaka Weekend Explorers',
                destination=sundarbans,
                start_datetime=start,
                end_datetime=end,
                description='City heritage walk.',
            )
            TourRoomMembership.objects.create(user=user, room=explorers_room, unread_count=12)

        # Notifications
        TravelerNotification.objects.filter(user_profile=profile).delete()
        notification_seed = [
            ('booking', 'Your Sundarbans tour is confirmed!', '✅', 2),
            ('invite', 'Sarah invited you to "Cox\'s Bazar Beach Group"', '🎉', 5),
            ('review', "Don't forget to review your Dhaka weekend trip", '⭐', 24),
            ('update', 'New destinations added to your wishlist', '📍', 48),
            ('reminder', 'Your Sundarbans trip starts in 45 days', '✈️', 72),
        ]
        for ntype, message, icon, hours_ago in notification_seed:
            TravelerNotification.objects.create(
                user_profile=profile,
                notification_type=ntype,
                title=message[:200],
                message=message,
                icon=icon,
                created_at=timezone.now() - timedelta(hours=hours_ago),
            )

        self.stdout.write('Traveler profile seeded')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
