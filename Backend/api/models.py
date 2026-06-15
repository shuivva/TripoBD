from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    USER_TYPE_CHOICES = [
        ('traveler', 'Traveler'),
        ('service_provider', 'Service Provider'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    DIVISION_CHOICES = [
        ('dhaka', 'Dhaka'),
        ('chittagong', 'Chittagong'),
        ('rajshahi', 'Rajshahi'),
        ('khulna', 'Khulna'),
        ('barisal', 'Barisal'),
        ('sylhet', 'Sylhet'),
        ('rangpur', 'Rangpur'),
        ('mymensingh', 'Mymensingh'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    division = models.CharField(max_length=20, choices=DIVISION_CHOICES)
    district = models.CharField(max_length=50)
    profile_photo = models.BinaryField(blank=True, null=True)
    national_id = models.CharField(max_length=20, blank=True, null=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='traveler')
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f'{self.user.username} - {self.full_name}'


class OTPVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'otp_verifications'
    
    def __str__(self):
        return f'{self.user.email} - {self.otp}'


class ServiceProvider(models.Model):
    SERVICE_TYPE_CHOICES = [
        ('tour_guide', 'Tour Guide'),
        ('boat_operator', 'Boat Operator'),
        ('vehicle_rental', 'Vehicle Rental'),
        ('photography', 'Photography'),
        ('other', 'Other'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='service_provider')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    specialized_destinations = models.TextField(help_text='Comma separated list of service areas')
    years_of_experience = models.PositiveIntegerField()
    languages_offered = models.TextField(help_text='Comma separated list of languages')
    fee_range = models.CharField(max_length=50)
    nid_scan = models.ImageField(upload_to='nid_scans/')
    certification = models.FileField(upload_to='certifications/', blank=True, null=True)
    portfolio_photos = models.JSONField(default=list, blank=True)
    bank_account_details = models.TextField()
    is_verified = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'service_providers'
    
    def __str__(self):
        return f'{self.user.full_name} - {self.get_service_type_display()}'


class Destination(models.Model):
    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    region = models.CharField(max_length=80)
    category = models.CharField(max_length=80)
    budget = models.CharField(max_length=50)
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    duration = models.CharField(max_length=80, blank=True)
    season = models.CharField(max_length=80, blank=True)
    summary = models.TextField(blank=True)
    description = models.TextField(blank=True)
    hero = models.URLField(blank=True)
    weekly_views = models.PositiveIntegerField(default=0)
    coords_lat = models.FloatField(null=True, blank=True)
    coords_lng = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, blank=True)
    requirement = models.TextField(help_text='Description of how to earn this badge')

    class Meta:
        db_table = 'badges'

    def __str__(self):
        return self.name


class AccountSettings(models.Model):
    PROFILE_VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('friends_only', 'Friends Only'),
        ('private', 'Private'),
    ]

    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='account_settings')
    profile_visibility = models.CharField(max_length=20, choices=PROFILE_VISIBILITY_CHOICES, default='public')
    two_factor_enabled = models.BooleanField(default=False)
    deactivation_requested = models.BooleanField(default=False)
    deactivation_requested_at = models.DateTimeField(null=True, blank=True)
    deactivation_reason = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'account_settings'

    def request_deactivation(self, reason=None):
        self.deactivation_requested = True
        self.deactivation_requested_at = timezone.now()
        if reason is not None:
            self.deactivation_reason = reason
        self.save(update_fields=['deactivation_requested', 'deactivation_requested_at', 'deactivation_reason'])


class TravelPreferences(models.Model):
    TRAVEL_STYLE_CHOICES = [
        ('adventure', 'Adventure'),
        ('relaxed', 'Relaxed'),
        ('cultural', 'Cultural'),
        ('budget', 'Budget'),
        ('mix', 'Mix'),
    ]

    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='travel_preferences')
    preferred_destinations = models.TextField(blank=True, help_text='Comma separated list of preferred destinations')
    travel_style = models.CharField(max_length=20, choices=TRAVEL_STYLE_CHOICES, default='mix')
    group_size_preference = models.PositiveIntegerField(null=True, blank=True, help_text='Preferred group size')
    languages_spoken = models.TextField(blank=True, help_text='Comma separated list of languages')

    class Meta:
        db_table = 'travel_preferences'


class TravelStats(models.Model):
    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='travel_stats')
    total_trips_logged = models.PositiveIntegerField(default=0)
    destinations_visited = models.PositiveIntegerField(default=0)
    stories_posted = models.PositiveIntegerField(default=0)
    reviews_written = models.PositiveIntegerField(default=0)
    connections_count = models.PositiveIntegerField(default=0)
    leaderboard_rank = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'travel_stats'


class TripStory(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='trip_stories')
    destination = models.ForeignKey('Destination', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    cover_photo = models.ImageField(upload_to='story_covers/', null=True, blank=True)
    photos = models.JSONField(default=list, blank=True, help_text='List of photo URLs')
    likes_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'trip_stories'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.get_status_display()})'


class UserBadge(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_badges'
        unique_together = ('user_profile', 'badge')


class Wishlist(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='wishlist')
    destination = models.ForeignKey('Destination', on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'wishlist'
        unique_together = ('user_profile', 'destination')

    def __str__(self):
        return f'{self.user_profile.full_name} → {self.destination.name}'


class Attraction(models.Model):
    destination = models.ForeignKey(Destination, related_name='attractions', on_delete=models.CASCADE)
    name = models.CharField(max_length=140)

    def __str__(self):
        return f'{self.name} — {self.destination.name}'


class Accommodation(models.Model):
    destination = models.ForeignKey(Destination, related_name='accommodations', on_delete=models.CASCADE)
    name = models.CharField(max_length=180)
    price = models.CharField(max_length=100)
    summary = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Review(models.Model):
    destination = models.ForeignKey(Destination, related_name='reviews', on_delete=models.CASCADE)
    author = models.CharField(max_length=120)
    score = models.PositiveSmallIntegerField()
    note = models.TextField(blank=True)

    def __str__(self):
        return f'{self.author} — {self.destination.name}'


class TourGroup(models.Model):
    destination = models.ForeignKey(Destination, related_name='groups', on_delete=models.CASCADE)
    name = models.CharField(max_length=180)
    members = models.PositiveSmallIntegerField()
    departure = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Guide(models.Model):
    name = models.CharField(max_length=160)
    location = models.CharField(max_length=120)
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    bio = models.TextField(blank=True)

    def __str__(self):
        return self.name


class TourRoom(models.Model):
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),
    ]
    
    name = models.CharField(max_length=200)
    destination = models.ForeignKey(
        Destination,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tour_rooms',
    )
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    description = models.TextField(blank=True)
    max_members = models.PositiveIntegerField(default=10)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private')
    cover_photo = models.BinaryField(blank=True, null=True)
    invite_code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_tourroom'
        ordering = ['start_datetime']

    def __str__(self):
        return self.name


class TourRoomMembership(models.Model):
    room = models.ForeignKey(
        TourRoom,
        on_delete=models.CASCADE,
        related_name='memberships',
        db_column='room_id',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tour_room_memberships',
        db_column='user_id',
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)
    unread_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'api_tourroommembership'
        unique_together = ('room', 'user')

    def __str__(self):
        return f'{self.user.username} in {self.room.name}'


class ItineraryItem(models.Model):
    room = models.ForeignKey(
        TourRoom,
        on_delete=models.CASCADE,
        related_name='itinerary_items',
        db_column='room_id',
    )
    day_number = models.PositiveIntegerField()
    activity_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    location = models.CharField(max_length=200, blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_activities',
        db_column='assigned_to_id',
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'itinerary_items'
        ordering = ['day_number', 'order']

    def __str__(self):
        return f'Day {self.day_number}: {self.activity_name}'


class Expense(models.Model):
    room = models.ForeignKey(
        TourRoom,
        on_delete=models.CASCADE,
        related_name='expenses',
        db_column='room_id',
    )
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='paid_expenses',
        db_column='payer_id',
    )
    date = models.DateField()
    category = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-date']

    def __str__(self):
        return f'{self.description}: {self.amount}'


class ExpenseParticipant(models.Model):
    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name='participants',
        db_column='expense_id',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expense_participations',
        db_column='user_id',
    )
    share_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)

    class Meta:
        db_table = 'expense_participants'
        unique_together = ('expense', 'user')

    def __str__(self):
        return f'{self.user.username}: {self.share_amount}'


class Poll(models.Model):
    POLL_TYPE_CHOICES = [
        ('yes_no', 'Yes/No'),
        ('multiple_choice', 'Multiple Choice'),
    ]
    
    room = models.ForeignKey(
        TourRoom,
        on_delete=models.CASCADE,
        related_name='polls',
        db_column='room_id',
    )
    question = models.CharField(max_length=200)
    poll_type = models.CharField(max_length=20, choices=POLL_TYPE_CHOICES, default='yes_no')
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_polls',
        db_column='created_by_id',
    )
    deadline = models.DateTimeField(blank=True, null=True)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'polls'
        ordering = ['-created_at']

    def __str__(self):
        return self.question


class PollOption(models.Model):
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name='options',
        db_column='poll_id',
    )
    option_text = models.CharField(max_length=200)
    vote_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'poll_options'

    def __str__(self):
        return self.option_text


class PollVote(models.Model):
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name='votes',
        db_column='poll_id',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='poll_votes',
        db_column='user_id',
    )
    option = models.ForeignKey(
        PollOption,
        on_delete=models.CASCADE,
        related_name='votes',
        db_column='option_id',
        null=True,
        blank=True,
    )
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'poll_votes'
        unique_together = ('poll', 'user')

    def __str__(self):
        return f'{self.user.username} voted on {self.poll.question}'


class ChecklistItem(models.Model):
    room = models.ForeignKey(
        TourRoom,
        on_delete=models.CASCADE,
        related_name='checklist_items',
        db_column='room_id',
    )
    item_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_checklist_items',
        db_column='assigned_to_id',
    )
    is_completed = models.BooleanField(default=False)
    completed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_checklist_items',
        db_column='completed_by_id',
    )
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'checklist_items'
        ordering = ['is_completed', '-created_at']

    def __str__(self):
        return self.item_name


class ChatMessage(models.Model):
    room = models.ForeignKey(
        TourRoom,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        db_column='room_id',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        db_column='user_id',
    )
    message = models.TextField()
    is_pinned = models.BooleanField(default=False)
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies',
        db_column='reply_to_id',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username}: {self.message[:50]}'


class ChatAttachment(models.Model):
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.CASCADE,
        related_name='attachments',
        db_column='message_id',
    )
    file_name = models.CharField(max_length=255)
    file_data = models.BinaryField()
    file_type = models.CharField(max_length=50)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_attachments'

    def __str__(self):
        return self.file_name


class MapPin(models.Model):
    room = models.ForeignKey(
        TourRoom,
        on_delete=models.CASCADE,
        related_name='map_pins',
        db_column='room_id',
    )
    added_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='added_map_pins',
        db_column='added_by_id',
    )
    name = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'map_pins'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class BookingNote(models.Model):
    room = models.ForeignKey(
        TourRoom,
        on_delete=models.CASCADE,
        related_name='booking_notes',
        db_column='room_id',
    )
    added_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='booking_notes',
        db_column='added_by_id',
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    booking_reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'booking_notes'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class TravelerNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('booking', 'Booking Update'),
        ('invite', 'Group Invite'),
        ('group_invite', 'Tour Group Invite'),
        ('review', 'Review Reminder'),
        ('update', 'General Update'),
        ('reminder', 'Reminder'),
    ]

    user_profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200, blank=True, default='')
    message = models.TextField()
    icon = models.CharField(max_length=10, default='📌')
    link = models.CharField(max_length=255, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_notification_type_display()}: {self.message[:40]}'


# Tour Guide & Local Bookings Models

class TourGuide(models.Model):
    SERVICE_TYPE_CHOICES = [
        ('guide', 'Tour Guide'),
        ('driver', 'Driver'),
        ('translator', 'Translator'),
        ('photographer', 'Photographer'),
        ('assistant', 'Travel Assistant'),
    ]
    LANGUAGE_CHOICES = [
        ('english', 'English'),
        ('bengali', 'Bengali'),
        ('hindi', 'Hindi'),
        ('arabic', 'Arabic'),
        ('chinese', 'Chinese'),
        ('french', 'French'),
        ('german', 'German'),
        ('spanish', 'Spanish'),
        ('japanese', 'Japanese'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tour_guide')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    specialties = models.TextField(help_text='Comma-separated specialties')
    languages = models.CharField(max_length=200, help_text='Comma-separated languages')
    destinations = models.ManyToManyField(Destination, related_name='guides')
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    reviews_count = models.PositiveIntegerField(default=0)
    bio = models.TextField(blank=True)
    profile_photo = models.BinaryField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tour_guides'
        ordering = ['-rating', '-reviews_count']

    def __str__(self):
        return f'{self.user.username} - {self.get_service_type_display()}'


class GuideAvailability(models.Model):
    guide = models.ForeignKey(TourGuide, on_delete=models.CASCADE, related_name='availabilities')
    date = models.DateField()
    is_available = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'guide_availabilities'
        unique_together = ['guide', 'date']
        ordering = ['date']

    def __str__(self):
        return f'{self.guide.user.username} - {self.date}'


class GuideReview(models.Model):
    guide = models.ForeignKey(TourGuide, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='guide_reviews')
    rating = models.PositiveIntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    review_text = models.TextField()
    photo = models.BinaryField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'guide_reviews'
        ordering = ['-created_at']
        unique_together = ['guide', 'user']

    def __str__(self):
        return f'{self.user.username} - {self.guide.user.username} - {self.rating} stars'


class GuideBooking(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    guide = models.ForeignKey(TourGuide, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='guide_bookings')
    start_date = models.DateField()
    end_date = models.DateField()
    group_size = models.PositiveIntegerField(default=1)
    requirements = models.TextField(blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guide_bookings'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.guide.user.username} - {self.status}'


class BoatCharter(models.Model):
    BOAT_TYPE_CHOICES = [
        ('speedboat', 'Speedboat'),
        ('fishing_boat', 'Fishing Boat'),
        ('houseboat', 'Houseboat'),
        ('yacht', 'Yacht'),
        ('sailboat', 'Sailboat'),
    ]

    name = models.CharField(max_length=200)
    boat_type = models.CharField(max_length=20, choices=BOAT_TYPE_CHOICES)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='boat_charters')
    capacity = models.PositiveIntegerField()
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    description = models.TextField(blank=True)
    features = models.TextField(blank=True, help_text='Comma-separated features')
    photos = models.BinaryField(blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    reviews_count = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'boat_charters'
        ordering = ['-rating', '-reviews_count']

    def __str__(self):
        return f'{self.name} - {self.destination.name}'


class BoatCharterReview(models.Model):
    charter = models.ForeignKey(BoatCharter, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='boat_charter_reviews')
    rating = models.PositiveIntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    review_text = models.TextField()
    photo = models.BinaryField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'boat_charter_reviews'
        ordering = ['-created_at']
        unique_together = ['charter', 'user']

    def __str__(self):
        return f'{self.user.username} - {self.charter.name} - {self.rating} stars'


class BoatCharterBooking(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    charter = models.ForeignKey(BoatCharter, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='boat_charter_bookings')
    start_date = models.DateField()
    end_date = models.DateField()
    group_size = models.PositiveIntegerField(default=1)
    requirements = models.TextField(blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'boat_charter_bookings'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.charter.name} - {self.status}'


class VehicleRental(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('car', 'Car'),
        ('suv', 'SUV'),
        ('van', 'Van'),
        ('bus', 'Bus'),
        ('motorcycle', 'Motorcycle'),
    ]

    name = models.CharField(max_length=200)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='vehicle_rentals')
    capacity = models.PositiveIntegerField()
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    features = models.TextField(blank=True, help_text='Comma-separated features')
    photos = models.BinaryField(blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    reviews_count = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vehicle_rentals'
        ordering = ['-rating', '-reviews_count']

    def __str__(self):
        return f'{self.name} - {self.destination.name}'


class VehicleRentalReview(models.Model):
    rental = models.ForeignKey(VehicleRental, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicle_rental_reviews')
    rating = models.PositiveIntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    review_text = models.TextField()
    photo = models.BinaryField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vehicle_rental_reviews'
        ordering = ['-created_at']
        unique_together = ['rental', 'user']

    def __str__(self):
        return f'{self.user.username} - {self.rental.name} - {self.rating} stars'


class VehicleRentalBooking(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    rental = models.ForeignKey(VehicleRental, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicle_rental_bookings')
    start_date = models.DateField()
    end_date = models.DateField()
    group_size = models.PositiveIntegerField(default=1)
    requirements = models.TextField(blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vehicle_rental_bookings'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.rental.name} - {self.status}'


class OpenTourGroup(models.Model):
    JOIN_TYPE_CHOICES = [
        ('open', 'Open'),
        ('request', 'Request Approval'),
    ]
    FEE_TYPE_CHOICES = [
        ('free', 'Free'),
        ('paid', 'Paid'),
    ]
    CONTACT_METHOD_CHOICES = [
        ('app', 'In App'),
        ('phone', 'Phone'),
        ('email', 'Email'),
    ]

    organizer = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='organized_groups',
    )
    destination = models.ForeignKey(
        Destination,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='open_groups',
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    cover_image = models.URLField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    max_members = models.PositiveIntegerField()
    join_type = models.CharField(max_length=20, choices=JOIN_TYPE_CHOICES, default='open')
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES, default='free')
    membership_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contact_method = models.CharField(max_length=20, choices=CONTACT_METHOD_CHOICES, default='app')
    contact_value = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'open_tour_groups'
        ordering = ['start_date']

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.filter(status='joined').count()


class OpenTourGroupItinerary(models.Model):
    group = models.ForeignKey(
        OpenTourGroup,
        on_delete=models.CASCADE,
        related_name='itinerary',
    )
    day_number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'open_tour_group_itinerary'
        ordering = ['day_number', 'sort_order']


class OpenTourGroupMember(models.Model):
    ROLE_CHOICES = [
        ('organizer', 'Organizer'),
        ('member', 'Member'),
    ]
    STATUS_CHOICES = [
        ('joined', 'Joined'),
        ('pending', 'Pending'),
        ('rejected', 'Rejected'),
    ]

    group = models.ForeignKey(
        OpenTourGroup,
        on_delete=models.CASCADE,
        related_name='members',
    )
    user_profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='group_memberships',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='joined')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'open_tour_group_members'
        unique_together = ('group', 'user_profile')


class OpenTourGroupInvite(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    group = models.ForeignKey(
        OpenTourGroup,
        on_delete=models.CASCADE,
        related_name='invites',
    )
    invited_by = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='sent_group_invites',
    )
    invited_profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='received_group_invites',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'open_tour_group_invites'
        unique_together = ('group', 'invited_profile')

    def __str__(self):
        return f'Invite {self.invited_profile.full_name} → {self.group.name}'


class CommunityPost(models.Model):
    POST_TYPE_CHOICES = [
        ('story', 'Trip Story'),
        ('photo', 'Photo Post'),
        ('tip', 'Travel Tip'),
    ]

    author = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='community_posts',
    )
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    image_url = models.URLField(blank=True)
    destination = models.ForeignKey(
        Destination,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='community_posts',
    )
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'community_posts'
        ordering = ['-created_at']


class TravelerFollow(models.Model):
    follower = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='following',
    )
    following = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='followers',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'traveler_follows'
        unique_together = ('follower', 'following')


class CommunityPostLike(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name='likes',
    )
    user_profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='post_likes',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_post_likes'
        unique_together = ('post', 'user_profile')


class CommunityPostComment(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    author = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='post_comments',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_post_comments'
        ordering = ['created_at']


class Route(models.Model):
    from_location = models.CharField(max_length=120)
    to_location = models.CharField(max_length=120)
    mode = models.CharField(max_length=80)
    operator = models.CharField(max_length=160)
    fare = models.PositiveIntegerField()
    duration = models.CharField(max_length=80)
    departure = models.CharField(max_length=60)
    travel_class = models.CharField(max_length=120)
    tips = models.TextField(blank=True)
    path = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['from_location', 'to_location', 'mode']

    def __str__(self):
        return f'{self.from_location} → {self.to_location} ({self.mode})'
