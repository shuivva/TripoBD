from rest_framework import serializers
from .models import (
    Destination,
    UserProfile,
    OpenTourGroup,
    OpenTourGroupItinerary,
    OpenTourGroupMember,
    CommunityPost,
    CommunityPostComment,
    CommunityPostLike,
    TravelerFollow,
)


def _profile_mini(profile, request=None):
    photo = None
    if profile.profile_photo:
        try:
            photo = request.build_absolute_uri(profile.profile_photo.url) if request else profile.profile_photo.url
        except Exception:
            photo = None
    parts = (profile.full_name or '').split()
    initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else (parts[0][:2].upper() if parts else '?')
    return {
        'id': profile.id,
        'user_id': profile.user_id,
        'full_name': profile.full_name,
        'avatar_initials': initials,
        'avatar_url': photo,
    }


class ItinerarySerializer(serializers.ModelSerializer):
    class Meta:
        model = OpenTourGroupItinerary
        fields = ['id', 'day_number', 'title', 'description', 'sort_order']


class GroupMemberSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = OpenTourGroupMember
        fields = ['id', 'role', 'status', 'joined_at', 'profile']

    def get_profile(self, obj):
        return _profile_mini(obj.user_profile, self.context.get('request'))


class OpenTourGroupListSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    destination_slug = serializers.CharField(source='destination.slug', read_only=True)
    organizer_name = serializers.CharField(source='organizer.full_name', read_only=True)
    member_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    user_membership_status = serializers.SerializerMethodField()

    class Meta:
        model = OpenTourGroup
        fields = [
            'id',
            'name',
            'description',
            'cover_image',
            'start_date',
            'end_date',
            'max_members',
            'join_type',
            'fee_type',
            'membership_fee',
            'destination_name',
            'destination_slug',
            'organizer_name',
            'member_count',
            'is_full',
            'user_membership_status',
        ]

    def get_member_count(self, obj):
        return obj.member_count

    def get_is_full(self, obj):
        return obj.member_count >= obj.max_members

    def get_user_membership_status(self, obj):
        user_id = self.context.get('user_id')
        if not user_id:
            return None
        m = obj.members.filter(user_profile__user_id=user_id).first()
        return m.status if m else None


class OpenTourGroupDetailSerializer(OpenTourGroupListSerializer):
    organizer = serializers.SerializerMethodField()
    itinerary = ItinerarySerializer(many=True, read_only=True)
    members = serializers.SerializerMethodField()

    class Meta(OpenTourGroupListSerializer.Meta):
        fields = OpenTourGroupListSerializer.Meta.fields + [
            'contact_method',
            'contact_value',
            'organizer',
            'itinerary',
            'members',
            'created_at',
        ]

    def get_organizer(self, obj):
        return _profile_mini(obj.organizer, self.context.get('request'))

    def get_members(self, obj):
        joined = obj.members.filter(status='joined').select_related('user_profile')
        return GroupMemberSerializer(joined, many=True, context=self.context).data


class OpenTourGroupCreateSerializer(serializers.ModelSerializer):
    itinerary = ItinerarySerializer(many=True, required=False)
    destination_slug = serializers.SlugField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = OpenTourGroup
        fields = [
            'name',
            'description',
            'cover_image',
            'start_date',
            'end_date',
            'max_members',
            'join_type',
            'fee_type',
            'membership_fee',
            'contact_method',
            'contact_value',
            'destination_slug',
            'itinerary',
        ]

    def create(self, validated_data):
        itinerary_data = validated_data.pop('itinerary', [])
        slug = validated_data.pop('destination_slug', None)
        organizer = self.context['organizer']
        destination = None
        if slug:
            destination = Destination.objects.filter(slug=slug).first()

        if not validated_data.get('cover_image') and destination:
            validated_data['cover_image'] = destination.hero or ''

        group = OpenTourGroup.objects.create(
            organizer=organizer,
            destination=destination,
            **validated_data,
        )
        OpenTourGroupMember.objects.create(
            group=group,
            user_profile=organizer,
            role='organizer',
            status='joined',
        )
        for item in itinerary_data:
            OpenTourGroupItinerary.objects.create(group=group, **item)
        return group


class CommunityPostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    destination_name = serializers.CharField(source='destination.name', read_only=True, default=None)
    liked_by_me = serializers.SerializerMethodField()
    following_author = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            'id',
            'post_type',
            'title',
            'content',
            'image_url',
            'destination_name',
            'likes_count',
            'comments_count',
            'created_at',
            'author',
            'liked_by_me',
            'following_author',
        ]

    def get_author(self, obj):
        return _profile_mini(obj.author, self.context.get('request'))

    def get_liked_by_me(self, obj):
        profile = self.context.get('viewer_profile')
        if not profile:
            return False
        return CommunityPostLike.objects.filter(post=obj, user_profile=profile).exists()

    def get_following_author(self, obj):
        profile = self.context.get('viewer_profile')
        if not profile:
            return False
        return TravelerFollow.objects.filter(follower=profile, following=obj.author).exists()


class CommunityPostCreateSerializer(serializers.ModelSerializer):
    destination_slug = serializers.SlugField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CommunityPost
        fields = ['post_type', 'title', 'content', 'image_url', 'destination_slug']

    def create(self, validated_data):
        slug = validated_data.pop('destination_slug', None)
        destination = Destination.objects.filter(slug=slug).first() if slug else None
        return CommunityPost.objects.create(
            author=self.context['author'],
            destination=destination,
            **validated_data,
        )


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPostComment
        fields = ['id', 'content', 'created_at', 'author']

    def get_author(self, obj):
        return _profile_mini(obj.author, self.context.get('request'))
