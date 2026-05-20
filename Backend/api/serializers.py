from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Destination,
    Attraction,
    Accommodation,
    Review,
    TourGroup,
    Guide,
    Route,
    UserProfile,
    OTPVerification,
    ServiceProvider,
    Badge,
    AccountSettings,
    TravelPreferences,
    TravelStats,
    TripStory,
    UserBadge,
    Wishlist,
)


class AttractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attraction
        fields = ['name']


class AccommodationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accommodation
        fields = ['name', 'price', 'summary']


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['author', 'score', 'note']


class TourGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourGroup
        fields = ['name', 'members', 'departure']


class DestinationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ['slug', 'name', 'region', 'category', 'budget', 'rating', 'hero', 'summary']


class DestinationDetailSerializer(serializers.ModelSerializer):
    attractions = AttractionSerializer(many=True, read_only=True)
    accommodations = AccommodationSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    groups = TourGroupSerializer(many=True, read_only=True)

    class Meta:
        model = Destination
        fields = [
            'slug',
            'name',
            'region',
            'category',
            'budget',
            'rating',
            'duration',
            'season',
            'summary',
            'description',
            'hero',
            'coords_lat',
            'coords_lng',
            'attractions',
            'accommodations',
            'reviews',
            'groups',
        ]


class TravelPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelPreferences
        fields = [
            'preferred_destinations',
            'travel_style',
            'group_size_preference',
            'languages_spoken',
        ]


class TravelStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelStats
        fields = [
            'total_trips_logged',
            'destinations_visited',
            'stories_posted',
            'reviews_written',
            'connections_count',
            'leaderboard_rank',
        ]


class AccountSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountSettings
        fields = [
            'profile_visibility',
            'two_factor_enabled',
            'deactivation_requested',
            'deactivation_requested_at',
            'deactivation_reason',
        ]


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'requirement']


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'earned_at']


class WishlistDestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ['slug', 'name', 'region', 'category', 'budget', 'rating', 'hero']


class WishlistSerializer(serializers.ModelSerializer):
    destination = WishlistDestinationSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'destination', 'added_at', 'notes']


class TripStorySerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    destination_slug = serializers.CharField(source='destination.slug', read_only=True)

    class Meta:
        model = TripStory
        fields = [
            'id',
            'title',
            'content',
            'cover_photo',
            'photos',
            'status',
            'created_at',
            'updated_at',
            'published_at',
            'destination_name',
            'destination_slug',
        ]


class TravelerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    travel_preferences = TravelPreferencesSerializer(read_only=True)
    travel_stats = TravelStatsSerializer(read_only=True)
    account_settings = AccountSettingsSerializer(read_only=True)
    badges = UserBadgeSerializer(many=True, read_only=True)
    wishlist = WishlistSerializer(many=True, read_only=True)
    trip_stories = TripStorySerializer(many=True, read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'phone_number',
            'date_of_birth',
            'gender',
            'division',
            'district',
            'profile_photo',
            'travel_preferences',
            'travel_stats',
            'account_settings',
            'badges',
            'wishlist',
            'trip_stories',
        ]


class GuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guide
        fields = ['name', 'location', 'rating', 'bio']


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = [
            'from_location',
            'to_location',
            'mode',
            'operator',
            'fare',
            'duration',
            'departure',
            'travel_class',
            'tips',
            'path',
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'confirm_password',
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    # allow writing the related user by primary key so the view can pass user id
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'user',
            'full_name',
            'phone_number',
            'date_of_birth',
            'gender',
            'division',
            'district',
            'profile_photo',
            'national_id',
            'user_type',
        ]


class OTPVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPVerification
        fields = ['otp', 'is_used']


class ServiceProviderSerializer(serializers.ModelSerializer):
    # accept user id when creating service provider entries
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True)
    class Meta:
        model = ServiceProvider
        fields = [
            'user',
            'service_type',
            'specialized_destinations',
            'years_of_experience',
            'languages_offered',
            'fee_range',
            'nid_scan',
            'certification',
            'portfolio_photos',
            'bank_account_details',
        ]
