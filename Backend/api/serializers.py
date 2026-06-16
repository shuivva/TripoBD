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
    TourRoom,
    TourRoomMembership,
    AIChatSession,
    AIChatMessage,
    NotificationPreferences,
    DestinationReview,
    AccommodationReview,
    ServiceProviderBooking,
    ServiceProviderReview,
    TourRoomActivity,
    TourRoomBookingNote,
    TourRoomChatMessage,
    TourRoomChecklistItem,
    TourRoomExpense,
    TourRoomExpenseParticipant,
    TourRoomMapPin,
    TourRoomPoll,
    TourRoomPollOption,
    TourRoomPollVote,
    TourRoomInvite,
    PayoutRequest,
    SupportTicket,
    SystemConfig,
    AdminAuditLog,
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
    author_name = serializers.CharField(source='user_profile.full_name', read_only=True)
    author_username = serializers.CharField(source='user_profile.user.username', read_only=True)

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
            'author_name',
            'author_username',
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


# ==========================================
# RESTORED AND NEW SERIALIZERS
# ==========================================

class AIChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatMessage
        fields = ['id', 'role', 'content', 'rating', 'created_at']


class AIChatSessionSerializer(serializers.ModelSerializer):
    messages_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = AIChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages_count']


class DestinationReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='user_profile.full_name', read_only=True)
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = DestinationReview
        fields = [
            'id', 'author_name', 'author_avatar', 'rating_accessibility', 'rating_safety',
            'rating_value', 'rating_scenery', 'rating_food', 'text_review', 'photos', 'created_at'
        ]

    def get_author_avatar(self, obj):
        if obj.user_profile.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user_profile.profile_photo.url)
        return None


class AccommodationReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='user_profile.full_name', read_only=True)
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = AccommodationReview
        fields = [
            'id', 'author_name', 'author_avatar', 'rating_cleanliness', 'rating_staff',
            'rating_accessibility', 'rating_safety', 'rating_value', 'rating_scenery',
            'rating_food', 'text_review', 'photos', 'created_at'
        ]

    def get_author_avatar(self, obj):
        if obj.user_profile.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user_profile.profile_photo.url)
        return None


class NestedUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='profile.full_name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name']


class NestedServiceProviderSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)
    service_type_label = serializers.CharField(source='get_service_type_display', read_only=True)

    class Meta:
        model = ServiceProvider
        fields = [
            'id', 'service_type', 'service_type_label', 'specialized_destinations',
            'years_of_experience', 'languages_offered', 'fee_range', 'is_verified', 'user'
        ]


class ServiceProviderReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.profile.full_name', read_only=True)

    class Meta:
        model = ServiceProviderReview
        fields = ['id', 'service_provider', 'booking', 'author', 'author_name', 'rating', 'text_review', 'photo_url', 'created_at']


class ServiceProviderBookingSerializer(serializers.ModelSerializer):
    service_provider = NestedServiceProviderSerializer(read_only=True)
    service_provider_name = serializers.CharField(source='service_provider.user.profile.full_name', read_only=True)
    service_provider_type = serializers.CharField(source='service_provider.service_type', read_only=True)
    customer_name = serializers.CharField(source='customer.profile.full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.profile.phone_number', read_only=True)
    review = ServiceProviderReviewSerializer(read_only=True)

    class Meta:
        model = ServiceProviderBooking
        fields = [
            'id', 'service_provider', 'service_provider_name', 'service_provider_type',
            'customer', 'customer_name', 'customer_username', 'customer_email', 'customer_phone',
            'start_date', 'end_date', 'group_size', 'specific_requirements', 'message',
            'status', 'created_at', 'agreed_fee', 'internal_notes', 'rejection_reason', 'review'
        ]


class NotificationPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreferences
        exclude = ['id', 'user_profile']


class TourRoomActivitySerializer(serializers.ModelSerializer):
    assigned_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_name = serializers.CharField(source='assigned_to.profile.full_name', read_only=True)

    class Meta:
        model = TourRoomActivity
        fields = [
            'id', 'room', 'day_number', 'title', 'description', 'start_time',
            'end_time', 'notes', 'assigned_to', 'assigned_username', 'assigned_name', 'sort_order'
        ]


class TourRoomBookingNoteSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source='added_by.profile.full_name', read_only=True)

    class Meta:
        model = TourRoomBookingNote
        fields = ['id', 'room', 'added_by', 'added_by_name', 'title', 'confirmation_text', 'created_at']


class TourRoomChatMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_name = serializers.CharField(source='sender.profile.full_name', read_only=True)
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = TourRoomChatMessage
        fields = ['id', 'room', 'sender', 'sender_username', 'sender_name', 'sender_avatar', 'message', 'attachment_url', 'is_pinned', 'created_at']

    def get_sender_avatar(self, obj):
        try:
            if obj.sender.profile.profile_photo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.sender.profile.profile_photo.url)
        except Exception:
            pass
        return None


class TourRoomChecklistItemSerializer(serializers.ModelSerializer):
    assigned_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_name = serializers.CharField(source='assigned_to.profile.full_name', read_only=True)

    class Meta:
        model = TourRoomChecklistItem
        fields = ['id', 'room', 'title', 'is_completed', 'assigned_to', 'assigned_username', 'assigned_name', 'created_at']


class TourRoomExpenseParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)

    class Meta:
        model = TourRoomExpenseParticipant
        fields = ['id', 'user', 'username', 'full_name', 'share_amount', 'is_paid']


class TourRoomExpenseSerializer(serializers.ModelSerializer):
    payer_username = serializers.CharField(source='payer.username', read_only=True)
    payer_name = serializers.CharField(source='payer.profile.full_name', read_only=True)
    participants = TourRoomExpenseParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = TourRoomExpense
        fields = ['id', 'room', 'payer', 'payer_username', 'payer_name', 'amount', 'description', 'date', 'participants', 'created_at']


class TourRoomMapPinSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source='added_by.profile.full_name', read_only=True)

    class Meta:
        model = TourRoomMapPin
        fields = ['id', 'room', 'added_by', 'added_by_name', 'label', 'description', 'latitude', 'longitude', 'created_at']


class TourRoomPollOptionSerializer(serializers.ModelSerializer):
    votes_count = serializers.IntegerField(source='votes.count', read_only=True)

    class Meta:
        model = TourRoomPollOption
        fields = ['id', 'text', 'votes_count']


class TourRoomPollSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.profile.full_name', read_only=True)
    options = TourRoomPollOptionSerializer(many=True, read_only=True)
    user_votes = serializers.SerializerMethodField()

    class Meta:
        model = TourRoomPoll
        fields = ['id', 'room', 'creator', 'creator_name', 'question', 'is_multichoice', 'deadline', 'is_closed', 'options', 'user_votes', 'created_at']

    def get_user_votes(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return list(obj.votes.filter(user=request.user).values_list('option_id', flat=True))
        user_id = self.context.get('user_id')
        if user_id:
            return list(obj.votes.filter(user_id=user_id).values_list('option_id', flat=True))
        return []


class TourRoomInviteSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.profile.full_name', read_only=True)

    class Meta:
        model = TourRoomInvite
        fields = ['id', 'room', 'room_name', 'invited_by', 'invited_by_name', 'status', 'created_at']


class TourRoomSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    destination_slug = serializers.CharField(source='destination.slug', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = TourRoom
        fields = [
            'id', 'name', 'destination', 'destination_name', 'destination_slug',
            'start_datetime', 'end_datetime', 'description', 'owner', 'owner_username',
            'cover_photo', 'invite_code', 'is_archived', 'is_public', 'max_members', 'created_at'
        ]


class ServiceProviderProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)
    profile_photo = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceProvider
        fields = [
            'id', 'username', 'email', 'full_name', 'service_type',
            'specialized_destinations', 'years_of_experience', 'languages_offered',
            'fee_range', 'nid_scan', 'certification', 'portfolio_photos',
            'bank_account_details', 'is_verified', 'submitted_at', 'verified_at',
            'bio', 'speciality_tags', 'availability_calendar', 'pricing_rates', 'contact_preferences', 'profile_photo'
        ]

    def get_profile_photo(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.profile_photo:
            try:
                return profile.profile_photo.url
            except Exception:
                return None
        return None


class ServiceProviderBookingDetailSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    customer_name = serializers.CharField(source='customer.profile.full_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.profile.phone_number', read_only=True)
    provider_name = serializers.CharField(source='service_provider.user.profile.full_name', read_only=True)
    service_provider = NestedServiceProviderSerializer(read_only=True)
    
    class Meta:
        model = ServiceProviderBooking
        fields = [
            'id', 'service_provider', 'provider_name', 'customer', 'customer_username',
            'customer_name', 'customer_email', 'customer_phone',
            'start_date', 'end_date', 'group_size', 'specific_requirements',
            'message', 'status', 'created_at', 'agreed_fee', 'internal_notes', 'rejection_reason'
        ]


class PayoutRequestSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='service_provider.user.profile.full_name', read_only=True)
    
    class Meta:
        model = PayoutRequest
        fields = ['id', 'service_provider', 'provider_name', 'amount', 'method', 'status', 'details', 'created_at', 'processed_at']


class SupportTicketSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)
    assigned_username = serializers.CharField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'user', 'username', 'full_name', 'subject', 'description',
            'category', 'priority', 'status', 'assigned_to', 'assigned_username',
            'conversation', 'internal_notes', 'created_at', 'updated_at'
        ]


class AdminAuditLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.username', read_only=True)
    
    class Meta:
        model = AdminAuditLog
        fields = ['id', 'admin', 'admin_username', 'action', 'details', 'ip_address', 'created_at']


class UserManagementSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='profile.full_name', read_only=True)
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True)
    user_type = serializers.CharField(source='profile.user_type', read_only=True)
    registration_date = serializers.DateTimeField(source='profile.created_at', read_only=True)
    status = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone_number', 'user_type', 'registration_date', 'status', 'last_login']

    def get_status(self, obj):
        profile = getattr(obj, 'profile', None)
        if not profile:
            return 'Active'
        settings = getattr(profile, 'account_settings', None)
        if settings:
            if settings.deactivation_requested:
                return 'Deactivated'
        if not obj.is_active:
            return 'Suspended'
        return 'Active'
