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
    ItineraryItem,
    Expense,
    ExpenseParticipant,
    Poll,
    PollOption,
    PollVote,
    ChecklistItem,
    ChatMessage,
    ChatAttachment,
    MapPin,
    BookingNote,
    TourGuide,
    GuideAvailability,
    GuideReview,
    GuideBooking,
    BoatCharter,
    BoatCharterReview,
    BoatCharterBooking,
    VehicleRental,
    VehicleRentalReview,
    VehicleRentalBooking,
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Convert binary photo to base64 string for response
        if instance.profile_photo:
            import base64
            data['profile_photo'] = base64.b64encode(instance.profile_photo).decode('utf-8')
        return data


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
    profile_photo = serializers.CharField(required=False, allow_blank=True, allow_null=True)

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
            'profile_photo_content_type',
            'national_id',
            'user_type',
        ]
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Convert binary photo to base64 string for response
        if instance.profile_photo:
            import base64
            data['profile_photo'] = base64.b64encode(instance.profile_photo).decode('utf-8')
        return data
    
    def to_internal_value(self, data):
        # Convert base64 string to binary for storage
        if 'profile_photo' in data and data['profile_photo']:
            import base64
            try:
                # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
                photo_data = data['profile_photo']
                if ',' in photo_data:
                    photo_data = photo_data.split(',')[1]
                data['profile_photo'] = base64.b64decode(photo_data)
            except Exception:
                # If decoding fails, set to None
                data['profile_photo'] = None
        return super().to_internal_value(data)


class OTPVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPVerification
        fields = ['otp', 'is_used']


class TourRoomSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True, allow_null=True)

    class Meta:
        model = TourRoom
        fields = ['id', 'name', 'destination', 'destination_name', 'start_datetime', 'end_datetime',
                  'description', 'max_members', 'visibility', 'cover_photo',
                  'invite_code', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'invite_code']
        extra_kwargs = {
            'destination': {'required': False, 'allow_null': True},
            'cover_photo': {'required': False, 'allow_null': True}
        }

    def to_internal_value(self, data):
        if 'destination' in data and isinstance(data['destination'], str):
            try:
                from .models import Destination
                destination = Destination.objects.get(name=data['destination'])
                data['destination'] = destination.id
            except Destination.DoesNotExist:
                data['destination'] = None
        if 'cover_photo' in data and data['cover_photo']:
            import base64
            if isinstance(data['cover_photo'], str):
                if data['cover_photo'].startswith('data:'):
                    data['cover_photo'] = data['cover_photo'].split(',')[1]
                try:
                    data['cover_photo'] = base64.b64decode(data['cover_photo'])
                except Exception:
                    pass
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.cover_photo:
            import base64
            data['cover_photo'] = base64.b64encode(instance.cover_photo).decode('utf-8')
        return data


class TourRoomMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)

    class Meta:
        model = TourRoomMembership
        fields = ['id', 'room', 'user', 'username', 'full_name', 'joined_at', 
                  'is_admin', 'unread_count']
        read_only_fields = ['id', 'joined_at']


class ItineraryItemSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = ItineraryItem
        fields = ['id', 'room', 'day_number', 'activity_name', 'description', 
                  'start_time', 'end_time', 'location', 'assigned_to', 
                  'assigned_to_username', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ExpenseParticipant
        fields = ['id', 'expense', 'user', 'username', 'share_amount', 'is_paid']
        read_only_fields = ['id']


class ExpenseSerializer(serializers.ModelSerializer):
    participants = ExpenseParticipantSerializer(many=True, read_only=True)
    payer_username = serializers.CharField(source='payer.username', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'room', 'description', 'amount', 'payer', 'payer_username', 
                  'date', 'category', 'participants', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PollOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollOption
        fields = ['id', 'poll', 'option_text', 'vote_count']
        read_only_fields = ['id', 'vote_count']


class PollVoteSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    option_text = serializers.CharField(source='option.option_text', read_only=True)

    class Meta:
        model = PollVote
        fields = ['id', 'poll', 'user', 'username', 'option', 'option_text', 'voted_at']
        read_only_fields = ['id', 'voted_at']


class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ['id', 'room', 'question', 'poll_type', 'created_by', 
                  'created_by_username', 'deadline', 'is_closed', 'options', 
                  'user_vote', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                vote = obj.votes.get(user=request.user)
                return PollVoteSerializer(vote).data
            except PollVote.DoesNotExist:
                pass
        return None


class ChecklistItemSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    completed_by_username = serializers.CharField(source='completed_by.username', read_only=True)

    class Meta:
        model = ChecklistItem
        fields = ['id', 'room', 'item_name', 'description', 'assigned_to', 
                  'assigned_to_username', 'is_completed', 'completed_by', 
                  'completed_by_username', 'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']


class ChatAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatAttachment
        fields = ['id', 'message', 'file_name', 'file_data', 'file_type', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.file_data:
            import base64
            data['file_data'] = base64.b64encode(instance.file_data).decode('utf-8')
        return data


class ChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)
    attachments = ChatAttachmentSerializer(many=True, read_only=True)
    reply_to_message = serializers.CharField(source='reply_to.message', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'user', 'username', 'full_name', 'message', 
                  'is_pinned', 'reply_to', 'reply_to_message', 'attachments', 
                  'created_at']
        read_only_fields = ['id', 'created_at']


class MapPinSerializer(serializers.ModelSerializer):
    added_by_username = serializers.CharField(source='added_by.username', read_only=True)

    class Meta:
        model = MapPin
        fields = ['id', 'room', 'added_by', 'added_by_username', 'name', 
                  'latitude', 'longitude', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class BookingNoteSerializer(serializers.ModelSerializer):
    added_by_username = serializers.CharField(source='added_by.username', read_only=True)

    class Meta:
        model = BookingNote
        fields = ['id', 'room', 'added_by', 'added_by_username', 'title', 
                  'content', 'booking_reference', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


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


# Tour Guide & Local Bookings Serializers

class TourGuideSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)
    destination_names = serializers.SerializerMethodField()
    languages_list = serializers.SerializerMethodField()

    class Meta:
        model = TourGuide
        fields = ['id', 'user', 'username', 'full_name', 'service_type', 'specialties',
                  'languages', 'languages_list', 'destinations', 'destination_names',
                  'price_per_day', 'rating', 'reviews_count', 'bio', 'profile_photo',
                  'is_verified', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_destination_names(self, obj):
        return [d.name for d in obj.destinations.all()]

    def get_languages_list(self, obj):
        return obj.languages.split(',') if obj.languages else []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.profile_photo:
            import base64
            data['profile_photo'] = base64.b64encode(instance.profile_photo).decode('utf-8')
        return data


class GuideAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideAvailability
        fields = ['id', 'guide', 'date', 'is_available', 'notes']
        read_only_fields = ['id']


class GuideReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)

    class Meta:
        model = GuideReview
        fields = ['id', 'guide', 'user', 'username', 'full_name', 'rating', 'review_text', 'photo', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.photo:
            import base64
            data['photo'] = base64.b64encode(instance.photo).decode('utf-8')
        return data


class GuideBookingSerializer(serializers.ModelSerializer):
    guide_name = serializers.CharField(source='guide.user.username', read_only=True)
    guide_service_type = serializers.CharField(source='guide.service_type', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = GuideBooking
        fields = ['id', 'guide', 'guide_name', 'guide_service_type', 'user', 'user_name',
                  'start_date', 'end_date', 'group_size', 'requirements', 'message',
                  'status', 'total_price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']


class BoatCharterSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    features_list = serializers.SerializerMethodField()

    class Meta:
        model = BoatCharter
        fields = ['id', 'name', 'boat_type', 'destination', 'destination_name', 'capacity',
                  'price_per_hour', 'price_per_day', 'description', 'features', 'features_list',
                  'photos', 'rating', 'reviews_count', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_features_list(self, obj):
        return obj.features.split(',') if obj.features else []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.photos:
            import base64
            data['photos'] = base64.b64encode(instance.photos).decode('utf-8')
        return data


class BoatCharterReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)

    class Meta:
        model = BoatCharterReview
        fields = ['id', 'charter', 'user', 'username', 'full_name', 'rating', 'review_text', 'photo', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.photo:
            import base64
            data['photo'] = base64.b64encode(instance.photo).decode('utf-8')
        return data


class BoatCharterBookingSerializer(serializers.ModelSerializer):
    charter_name = serializers.CharField(source='charter.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = BoatCharterBooking
        fields = ['id', 'charter', 'charter_name', 'user', 'user_name', 'start_date', 'end_date',
                  'group_size', 'requirements', 'message', 'status', 'total_price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']


class VehicleRentalSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    features_list = serializers.SerializerMethodField()

    class Meta:
        model = VehicleRental
        fields = ['id', 'name', 'vehicle_type', 'destination', 'destination_name', 'capacity',
                  'price_per_day', 'description', 'features', 'features_list', 'photos',
                  'rating', 'reviews_count', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_features_list(self, obj):
        return obj.features.split(',') if obj.features else []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.photos:
            import base64
            data['photos'] = base64.b64encode(instance.photos).decode('utf-8')
        return data


class VehicleRentalReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.profile.full_name', read_only=True)

    class Meta:
        model = VehicleRentalReview
        fields = ['id', 'rental', 'user', 'username', 'full_name', 'rating', 'review_text', 'photo', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.photo:
            import base64
            data['photo'] = base64.b64encode(instance.photo).decode('utf-8')
        return data


class VehicleRentalBookingSerializer(serializers.ModelSerializer):
    rental_name = serializers.CharField(source='rental.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = VehicleRentalBooking
        fields = ['id', 'rental', 'rental_name', 'user', 'user_name', 'start_date', 'end_date',
                  'group_size', 'requirements', 'message', 'status', 'total_price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
