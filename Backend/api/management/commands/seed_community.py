from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import (
    Destination,
    UserProfile,
    OpenTourGroup,
    OpenTourGroupItinerary,
    OpenTourGroupMember,
    CommunityPost,
)


class Command(BaseCommand):
    help = 'Seed open tour groups and community feed posts.'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='shuvo')

    def handle(self, *args, **options):
        user = User.objects.filter(username=options['username']).first()
        if not user:
            self.stderr.write(f'User {options["username"]} not found')
            return

        organizer = UserProfile.objects.filter(user=user, user_type='traveler').first()
        if not organizer:
            self.stderr.write('Traveler profile not found')
            return

        other = UserProfile.objects.filter(user_type='traveler').exclude(pk=organizer.pk).first()
        sundarbans = Destination.objects.filter(slug='sundarbans').first()
        coxs = Destination.objects.filter(slug='coxs-bazar').first()
        today = date.today()

        OpenTourGroup.objects.filter(name__in=[
            'Sundarbans Eco Explorers',
            "Cox's Bazar Beach Buddies",
            'Heritage Dhaka Walkers',
        ]).delete()

        groups_data = []
        if sundarbans:
            groups_data.append({
                'name': 'Sundarbans Eco Explorers',
                'destination': sundarbans,
                'start_date': today + timedelta(days=30),
                'end_date': today + timedelta(days=34),
                'max_members': 12,
                'join_type': 'open',
                'fee_type': 'paid',
                'membership_fee': 3500,
                'description': 'Mangrove boat safari, wildlife spotting, and eco-lodge stays.',
                'itinerary': [
                    {'day_number': 1, 'title': 'Khulna to Mongla', 'description': 'Boat transfer and briefing.'},
                    {'day_number': 2, 'title': 'Creek Safari', 'description': 'Full-day wildlife cruise.'},
                ],
            })
        if coxs:
            groups_data.append({
                'name': "Cox's Bazar Beach Buddies",
                'destination': coxs,
                'start_date': today + timedelta(days=60),
                'end_date': today + timedelta(days=64),
                'max_members': 20,
                'join_type': 'request',
                'fee_type': 'free',
                'membership_fee': 0,
                'description': 'Sunset beach walks, seafood tours, and group photos.',
                'itinerary': [
                    {'day_number': 1, 'title': 'Beach Arrival', 'description': 'Check-in and sunset meetup.'},
                ],
            })

        groups_data.append({
            'name': 'Heritage Dhaka Walkers',
            'destination': sundarbans,
            'start_date': today + timedelta(days=14),
            'end_date': today + timedelta(days=15),
            'max_members': 8,
            'join_type': 'open',
            'fee_type': 'free',
            'membership_fee': 0,
            'description': 'Old Dhaka food walk and heritage sites.',
            'itinerary': [
                {'day_number': 1, 'title': 'Old Town Walk', 'description': 'Rickshaw tour and street food.'},
            ],
        })

        for data in groups_data:
            dest = data.pop('destination', None)
            itinerary = data.pop('itinerary', [])
            group = OpenTourGroup.objects.create(
                organizer=organizer,
                destination=dest,
                cover_image=dest.hero if dest else '',
                contact_method='app',
                **data,
            )
            OpenTourGroupMember.objects.get_or_create(
                group=group,
                user_profile=organizer,
                defaults={'role': 'organizer', 'status': 'joined'},
            )
            for item in itinerary:
                OpenTourGroupItinerary.objects.create(group=group, **item)

            if other and group.join_type == 'open' and group.name != 'Heritage Dhaka Walkers':
                OpenTourGroupMember.objects.get_or_create(
                    group=group,
                    user_profile=other,
                    defaults={'role': 'member', 'status': 'joined'},
                )

        CommunityPost.objects.filter(author=organizer, title__in=[
            'First mangrove sunrise',
            'Packing light for Bangladesh',
        ]).delete()

        if sundarbans:
            CommunityPost.objects.create(
                author=organizer,
                post_type='story',
                title='First mangrove sunrise',
                content='Woke up on the boat to dolphins and mist over the channels. Best trip yet!',
                image_url=sundarbans.hero,
                destination=sundarbans,
                likes_count=12,
                comments_count=2,
            )
        CommunityPost.objects.create(
            author=organizer,
            post_type='tip',
            title='Packing light for Bangladesh',
            content='Bring rain gear in monsoon, power bank, and cash for remote areas.',
            image_url='',
            likes_count=8,
            comments_count=1,
        )

        if other and coxs:
            CommunityPost.objects.create(
                author=other,
                post_type='photo',
                title='Golden hour at Inani',
                content='The colours were unreal last evening.',
                image_url=coxs.hero,
                destination=coxs,
                likes_count=24,
                comments_count=3,
            )

        self.stdout.write(self.style.SUCCESS('Community data seeded.'))
