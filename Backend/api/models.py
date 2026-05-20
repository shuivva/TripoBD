from django.db import models
from django.contrib.auth.models import User


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
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
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
    coords_lat = models.FloatField(null=True, blank=True)
    coords_lng = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


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


class TourRoom(models.Model):
    ROOM_TYPE_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
    ]
    
    name = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    max_members = models.PositiveIntegerField(default=10)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPE_CHOICES, default='private')
    cover_photo = models.ImageField(upload_to='tour_room_covers/', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tour_rooms')
    members = models.ManyToManyField(User, through='TourRoomMember', related_name='tour_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.name} - {self.destination}'


class TourRoomMember(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]
    
    tour_room = models.ForeignKey(TourRoom, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['tour_room', 'user']
    
    def __str__(self):
        return f'{self.user.username} - {self.tour_room.name}'


class TourRoomItinerary(models.Model):
    tour_room = models.ForeignKey(TourRoom, on_delete=models.CASCADE, related_name='itinerary_items')
    day = models.PositiveIntegerField()
    activity = models.CharField(max_length=300)
    time = models.TimeField(blank=True, null=True)
    location = models.CharField(max_length=200, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['day', 'order']
    
    def __str__(self):
        return f'Day {self.day}: {self.activity}'


class TourRoomExpense(models.Model):
    tour_room = models.ForeignKey(TourRoom, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='paid_expenses')
    split_among = models.ManyToManyField(User, related_name='shared_expenses')
    date = models.DateField(auto_now_add=True)
    is_settled = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f'{self.description} - ৳{self.amount}'


class TourRoomPoll(models.Model):
    tour_room = models.ForeignKey(TourRoom, on_delete=models.CASCADE, related_name='polls')
    question = models.CharField(max_length=300)
    poll_type = models.CharField(max_length=20, default='multiple_choice')
    options = models.JSONField(default=list)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    closes_at = models.DateTimeField(blank=True, null=True)
    is_closed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.question}'


class TourRoomPollVote(models.Model):
    poll = models.ForeignKey(TourRoomPoll, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    option = models.CharField(max_length=200)
    voted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['poll', 'user']
    
    def __str__(self):
        return f'{self.user.username} voted for {self.option}'


class TourRoomChecklist(models.Model):
    tour_room = models.ForeignKey(TourRoom, on_delete=models.CASCADE, related_name='checklist_items')
    item = models.CharField(max_length=200)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    completed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='completed_checklist')
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['is_completed', 'id']
    
    def __str__(self):
        return f'{self.item}'


class TourGroup(models.Model):
    name = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(blank=True)
    max_members = models.PositiveIntegerField(default=20)
    current_members = models.PositiveIntegerField(default=0)
    membership_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_open = models.BooleanField(default=True)
    cover_photo = models.ImageField(upload_to='tour_group_covers/', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tour_groups')
    members = models.ManyToManyField(User, through='TourGroupMember', related_name='tour_groups')
    contact_method = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.name} - {self.destination}'


class TourGroupMember(models.Model):
    tour_group = models.ForeignKey(TourGroup, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['tour_group', 'user']
    
    def __str__(self):
        return f'{self.user.username} - {self.tour_group.name}'


class Booking(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    BOOKING_TYPE_CHOICES = [
        ('guide', 'Tour Guide'),
        ('boat', 'Boat Charter'),
        ('vehicle', 'Vehicle Rental'),
        ('accommodation', 'Accommodation'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    booking_type = models.CharField(max_length=20, choices=BOOKING_TYPE_CHOICES)
    service_provider = models.ForeignKey(ServiceProvider, on_delete=models.SET_NULL, null=True, blank=True)
    destination = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    group_size = models.PositiveIntegerField(default=1)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    special_requirements = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.booking_type} - {self.destination}'


class TravelerReview(models.Model):
    REVIEW_TYPE_CHOICES = [
        ('destination', 'Destination'),
        ('accommodation', 'Accommodation'),
        ('guide', 'Guide'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    review_type = models.CharField(max_length=20, choices=REVIEW_TYPE_CHOICES)
    destination = models.ForeignKey(Destination, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200)
    rating_accessibility = models.PositiveIntegerField(default=5)
    rating_safety = models.PositiveIntegerField(default=5)
    rating_value = models.PositiveIntegerField(default=5)
    rating_scenery = models.PositiveIntegerField(default=5)
    rating_food = models.PositiveIntegerField(default=5)
    rating_cleanliness = models.PositiveIntegerField(default=5)
    rating_staff = models.PositiveIntegerField(default=5)
    overall_rating = models.DecimalField(max_digits=2, decimal_places=1)
    text = models.TextField()
    photos = models.JSONField(default=list, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.title} - {self.overall_rating}★'


class TripStory(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trip_stories')
    title = models.CharField(max_length=200)
    destination = models.ForeignKey(Destination, on_delete=models.SET_NULL, null=True, blank=True)
    cover_photo = models.ImageField(upload_to='story_covers/', blank=True, null=True)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    likes_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-published_at', '-created_at']
    
    def __str__(self):
        return f'{self.title}'


class Notification(models.Model):
    CATEGORY_CHOICES = [
        ('group_update', 'Group Update'),
        ('booking_update', 'Booking Update'),
        ('review_reminder', 'Review Reminder'),
        ('community', 'Community'),
        ('system', 'System'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.URLField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.title} - {self.user.username}'


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE)
    note = models.TextField(blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'destination']
        ordering = ['-added_at']
    
    def __str__(self):
        return f'{self.user.username} - {self.destination.name}'


class TravelPreferences(models.Model):
    TRAVEL_STYLE_CHOICES = [
        ('backpacking', 'Backpacking'),
        ('luxury', 'Luxury'),
        ('group_tours', 'Group Tours'),
        ('couples', 'Couples Getaway'),
        ('solo', 'Solo Travel'),
    ]
    
    BUDGET_CHOICES = [
        ('budget', 'Budget (৳1k-৳3k/trip)'),
        ('mid', 'Mid-Range (৳3k-৳8k/trip)'),
        ('premium', 'Premium (৳8k+/trip)'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='travel_preferences')
    travel_style = models.CharField(max_length=20, choices=TRAVEL_STYLE_CHOICES, default='backpacking')
    budget_range = models.CharField(max_length=20, choices=BUDGET_CHOICES, default='mid')
    preferred_destinations = models.TextField(blank=True, help_text='Comma separated list')
    group_size_preference = models.PositiveIntegerField(default=2)
    languages = models.TextField(blank=True, help_text='Comma separated list')
    favorite_categories = models.TextField(blank=True, help_text='Comma separated list')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'travel_preferences'
    
    def __str__(self):
        return f'{self.user.username} - Preferences'


class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, blank=True)
    requirement = models.TextField(help_text='Criteria to earn this badge')
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f'{self.name}'


class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'badge']
        ordering = ['-earned_at']
    
    def __str__(self):
        return f'{self.user.username} - {self.badge.name}'


class AIConversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_conversations')
    language = models.CharField(max_length=10, default='en')
    messages = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f'{self.user.username} - AI Chat'


class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    CATEGORY_CHOICES = [
        ('account', 'Account'),
        ('booking', 'Booking'),
        ('technical', 'Technical'),
        ('feature', 'Feature Request'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    subject = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    screenshot = models.ImageField(upload_to='support_screenshots/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_reply = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.subject} - {self.user.username}'
