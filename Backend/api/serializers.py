from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Destination, Attraction, Accommodation, Review, TourGroup, Guide, Route, UserProfile, OTPVerification, ServiceProvider


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
