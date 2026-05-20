from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Destination, Attraction, Accommodation, Review, TourGroup, Guide, Route, 
    UserProfile, OTPVerification, ServiceProvider, TourRoom, TourRoomMember,
    TourRoomItinerary, TourRoomExpense, TourRoomPoll, TourRoomPollVote,
    TourRoomChecklist, TourGroup as TourGroupModel, TourGroupMember, Booking,
    TravelerReview, TripStory, Notification, Wishlist, TravelPreferences,
    Badge, UserBadge, AIConversation, SupportTicket
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
        extra_kwargs = {
            'profile_photo': {'required': False, 'allow_null': True},
            'national_id': {'required': False, 'allow_blank': True},
        }


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
        extra_kwargs = {
            'nid_scan': {'required': True},
            'certification': {'required': False},
        }


# Tour Room Serializers
class TourRoomSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TourRoom
        fields = [
            'id', 'name', 'destination', 'start_date', 'end_date',
            'max_members', 'room_type', 'cover_photo', 'created_by',
            'member_count', 'created_at', 'is_archived'
        ]
        extra_kwargs = {
            'cover_photo': {'required': False}
        }
    
    def get_member_count(self, obj):
        return obj.members.count()


class TourRoomMemberSerializer(serializers.ModelSerializer):
    username = serializers.StringRelatedField(source='user.username', read_only=True)
    
    class Meta:
        model = TourRoomMember
        fields = ['id', 'user', 'username', 'role', 'joined_at']


class TourRoomItinerarySerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.StringRelatedField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = TourRoomItinerary
        fields = [
            'id', 'day', 'activity', 'time', 'location',
            'assigned_to', 'assigned_to_name', 'notes', 'order'
        ]


class TourRoomExpenseSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.StringRelatedField(source='paid_by.username', read_only=True)
    
    class Meta:
        model = TourRoomExpense
        fields = [
            'id', 'description', 'amount', 'paid_by', 'paid_by_name',
            'date', 'is_settled'
        ]


class TourRoomPollSerializer(serializers.ModelSerializer):
    created_by_name = serializers.StringRelatedField(source='created_by.username', read_only=True)
    
    class Meta:
        model = TourRoomPoll
        fields = [
            'id', 'question', 'poll_type', 'options', 'created_by',
            'created_by_name', 'created_at', 'closes_at', 'is_closed'
        ]


class TourRoomChecklistSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.StringRelatedField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = TourRoomChecklist
        fields = [
            'id', 'item', 'assigned_to', 'assigned_to_name',
            'is_completed', 'completed_at'
        ]


# Tour Group Serializers
class TourGroupModelSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, required=False)
    created_by_name = serializers.StringRelatedField(source='created_by.username', read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TourGroupModel
        fields = [
            'id', 'name', 'destination', 'start_date', 'end_date',
            'description', 'max_members', 'current_members', 'member_count',
            'membership_fee', 'is_open', 'cover_photo', 'created_by',
            'created_by_name', 'contact_method', 'created_at'
        ]
        extra_kwargs = {
            'cover_photo': {'required': False}
        }
    
    def get_member_count(self, obj):
        return obj.members.count()


class TourGroupMemberSerializer(serializers.ModelSerializer):
    username = serializers.StringRelatedField(source='user.username', read_only=True)
    
    class Meta:
        model = TourGroupMember
        fields = ['id', 'user', 'username', 'joined_at', 'is_approved']


# Booking Serializers
class BookingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    service_provider_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'booking_type', 'service_provider', 'service_provider_name',
            'destination', 'start_date', 'end_date', 'group_size',
            'total_amount', 'status', 'special_requirements',
            'created_at', 'updated_at'
        ]
    
    def get_service_provider_name(self, obj):
        if obj.service_provider:
            return obj.service_provider.user.profile.full_name
        return None


# Review Serializers
class TravelerReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    destination_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TravelerReview
        fields = [
            'id', 'user', 'review_type', 'destination', 'destination_name',
            'title', 'rating_accessibility', 'rating_safety', 'rating_value',
            'rating_scenery', 'rating_food', 'rating_cleanliness', 'rating_staff',
            'overall_rating', 'text', 'photos', 'is_verified',
            'created_at', 'updated_at'
        ]
    
    def get_destination_name(self, obj):
        return obj.destination.name if obj.destination else None


# Trip Story Serializers
class TripStorySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    destination_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TripStory
        fields = [
            'id', 'user', 'title', 'destination', 'destination_name',
            'cover_photo', 'content', 'status', 'likes_count',
            'views_count', 'created_at', 'published_at', 'updated_at'
        ]
        extra_kwargs = {
            'cover_photo': {'required': False}
        }
    
    def get_destination_name(self, obj):
        return obj.destination.name if obj.destination else None


# Notification Serializers
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'category', 'title', 'message', 'link',
            'is_read', 'created_at'
        ]


# Wishlist Serializers
class WishlistSerializer(serializers.ModelSerializer):
    destination_name = serializers.SerializerMethodField()
    destination_region = serializers.SerializerMethodField()
    destination_hero = serializers.SerializerMethodField()
    
    class Meta:
        model = Wishlist
        fields = [
            'id', 'destination', 'destination_name', 'destination_region',
            'destination_hero', 'note', 'added_at'
        ]
    
    def get_destination_name(self, obj):
        return obj.destination.name
    
    def get_destination_region(self, obj):
        return obj.destination.region
    
    def get_destination_hero(self, obj):
        return obj.destination.hero


# Travel Preferences Serializers
class TravelPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelPreferences
        fields = [
            'id', 'user', 'travel_style', 'budget_range',
            'preferred_destinations', 'group_size_preference',
            'languages', 'favorite_categories', 'updated_at'
        ]


# Badge Serializers
class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'requirement']


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    
    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'earned_at']


# AI Conversation Serializers
class AIConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIConversation
        fields = [
            'id', 'language', 'messages', 'created_at', 'updated_at'
        ]


# Support Ticket Serializers
class SupportTicketSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'user', 'subject', 'description', 'category',
            'screenshot', 'status', 'admin_reply', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'screenshot': {'required': False}
        }
