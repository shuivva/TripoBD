from datetime import date, datetime, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone

from api.models import (
    AccountSettings,
    Destination,
    TourRoom,
    TourRoomMembership,
    TravelerNotification,
    TravelPreferences,
    TravelStats,
    TripStory,
    UserProfile,
    Wishlist,
)


def ensure_traveler_profile(user, defaults):
    profile = UserProfile.objects.filter(user=user).first()
    if profile:
        return profile

    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO user_profiles (
                user_id, full_name, phone_number, date_of_birth, gender,
                division, district, user_type, is_email_verified,
                two_factor_enabled, profile_visibility,
                total_trips, destinations_visited, stories_posted, reviews_written
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 'public', 0, 0, 0, 0)
            """,
            [
                user.id,
                defaults['full_name'],
                defaults['phone_number'],
                defaults['date_of_birth'],
                defaults['gender'],
                defaults['division'],
                defaults['district'],
                defaults['user_type'],
                defaults['is_email_verified'],
            ],
        )
    return UserProfile.objects.get(user=user)


class Command(BaseCommand):
    help = 'Seed traveler dashboard data (tour rooms, notifications, wishlist, stats).'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='shuvo', help='Auth username to seed dashboard for')

    def handle(self, *args, **options):
        username = options['username']
        user = User.objects.filter(username=username).first()
        if not user:
            self.stderr.write(f'User "{username}" not found.')
            return

        profile = ensure_traveler_profile(
            user,
            {
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
        AccountSettings.objects.get_or_create(user_profile=profile)

        Destination.objects.filter(slug='sundarbans').update(weekly_views=15200)
        Destination.objects.filter(slug='coxs-bazar').update(weekly_views=12500)

        sundarbans = Destination.objects.filter(slug='sundarbans').first()
        coxs = Destination.objects.filter(slug='coxs-bazar').first()
        today = date.today()

        Wishlist.objects.filter(user_profile=profile).delete()
        for slug in ['coxs-bazar', 'sundarbans']:
            dest = Destination.objects.filter(slug=slug).first()
            if dest:
                Wishlist.objects.get_or_create(user_profile=profile, destination=dest)

        TourRoomMembership.objects.filter(user=user).delete()
        TourRoom.objects.filter(
            name__in=[
                'Sundarbans Wildlife Expedition',
                "Cox's Bazar Beach Group",
                'Dhaka Weekend Explorers',
            ]
        ).delete()

        def room_dates(start_offset, duration):
            start = timezone.make_aware(datetime.combine(today + timedelta(days=start_offset), datetime.min.time()))
            end = timezone.make_aware(
                datetime.combine(today + timedelta(days=start_offset + duration), datetime.min.time())
            )
            return start, end

        if sundarbans:
            start, end = room_dates(45, 7)
            room = TourRoom.objects.create(
                name='Sundarbans Wildlife Expedition',
                destination=sundarbans,
                start_datetime=start,
                end_datetime=end,
                description='Boat safari and mangrove exploration.',
            )
            TourRoomMembership.objects.create(user=user, room=room, unread_count=0)

        if coxs:
            start, end = room_dates(90, 5)
            room = TourRoom.objects.create(
                name="Cox's Bazar Beach Group",
                destination=coxs,
                start_datetime=start,
                end_datetime=end,
                description='Beach walks and seafood tours.',
            )
            TourRoomMembership.objects.create(user=user, room=room, unread_count=5)

        if sundarbans:
            start, end = room_dates(-10, 3)
            room = TourRoom.objects.create(
                name='Dhaka Weekend Explorers',
                destination=sundarbans,
                start_datetime=start,
                end_datetime=end,
                description='City heritage walk.',
            )
            TourRoomMembership.objects.create(user=user, room=room, unread_count=12)

        TravelerNotification.objects.filter(user_profile=profile).delete()
        for ntype, message, icon, hours_ago in [
            ('booking', 'Your Sundarbans tour is confirmed!', '✅', 2),
            ('invite', 'Sarah invited you to "Cox\'s Bazar Beach Group"', '🎉', 5),
            ('review', "Don't forget to review your Dhaka weekend trip", '⭐', 24),
            ('update', 'New destinations added to your wishlist', '📍', 48),
            ('reminder', 'Your Sundarbans trip starts in 45 days', '✈️', 72),
        ]:
            TravelerNotification.objects.create(
                user_profile=profile,
                notification_type=ntype,
                title=message[:200],
                message=message,
                icon=icon,
                created_at=timezone.now() - timedelta(hours=hours_ago),
            )

        author_profile = (
            UserProfile.objects.filter(user_type='traveler')
            .exclude(pk=profile.pk)
            .first()
        )
        if author_profile and coxs and sundarbans:
            TripStory.objects.filter(user_profile=author_profile).delete()
            TripStory.objects.create(
                user_profile=author_profile,
                destination=coxs,
                title='Beach Sunset',
                content='Golden hour on the longest beach.',
                status='published',
                published_at=timezone.now(),
                likes_count=234,
                photos=[coxs.hero],
            )
            TripStory.objects.create(
                user_profile=author_profile,
                destination=sundarbans,
                title='Mangrove Morning',
                content='Early boat ride through the channels.',
                status='published',
                published_at=timezone.now(),
                likes_count=189,
                photos=[sundarbans.hero],
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Dashboard seeded for {profile.full_name} (user_id={user.id}, profile_id={profile.id})'
            )
        )
