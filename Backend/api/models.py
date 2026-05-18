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
