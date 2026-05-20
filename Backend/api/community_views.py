from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    UserProfile,
    OpenTourGroup,
    OpenTourGroupMember,
    OpenTourGroupInvite,
    CommunityPost,
    CommunityPostComment,
    CommunityPostLike,
    TravelerFollow,
    TravelerNotification,
)
from .community_serializers import (
    OpenTourGroupListSerializer,
    OpenTourGroupDetailSerializer,
    OpenTourGroupCreateSerializer,
    CommunityPostSerializer,
    CommunityPostCreateSerializer,
    CommentSerializer,
)


def _get_profile(user_id):
    if user_id is None or user_id == '':
        return None
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None
    return UserProfile.objects.filter(user_id=user_id, user_type='traveler').first()


def _validation_error_response(serializer):
    if isinstance(serializer.errors, dict):
        parts = []
        for field, messages in serializer.errors.items():
            if isinstance(messages, list):
                parts.append(f'{field}: {messages[0]}')
            else:
                parts.append(f'{field}: {messages}')
        return Response(
            {'error': '; '.join(parts) or 'Invalid data', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


def _notify(profile, ntype, message, icon='📌', link=''):
    TravelerNotification.objects.create(
        user_profile=profile,
        notification_type=ntype,
        title=message[:200],
        message=message,
        icon=icon,
        link=link,
    )


def _group_link(group_id, invite=False):
    base = f'/traveler/community/groups/{group_id}'
    return f'{base}?invite=1' if invite else base


def _is_group_member(profile, group):
    return OpenTourGroupMember.objects.filter(
        group=group,
        user_profile=profile,
        status='joined',
    ).exists()


def _can_invite_to_group(profile, group):
    return _is_group_member(profile, group)


def _get_pending_invite(profile, group):
    return OpenTourGroupInvite.objects.filter(
        group=group,
        invited_profile=profile,
        status='pending',
    ).first()


def _join_group(profile, group, via_invite=False):
    """Join a group; invites bypass approval and join immediately."""
    existing = OpenTourGroupMember.objects.filter(group=group, user_profile=profile).first()
    if existing:
        if existing.status == 'joined':
            return 'joined', 'Already a member'
        if existing.status == 'pending' and not via_invite:
            return 'pending', 'Request already pending'
        if via_invite:
            existing.status = 'joined'
            existing.save(update_fields=['status'])
            return 'joined', 'Joined successfully'

    if group.member_count >= group.max_members:
        return None, 'Group is full'

    if group.organizer_id == profile.id:
        return None, 'You are the organiser'

    if via_invite or group.join_type == 'open':
        OpenTourGroupMember.objects.create(
            group=group,
            user_profile=profile,
            role='member',
            status='joined',
        )
        return 'joined', 'Joined successfully'

    OpenTourGroupMember.objects.create(
        group=group,
        user_profile=profile,
        role='member',
        status='pending',
    )
    _notify(
        group.organizer,
        'invite',
        f'{profile.full_name} requested to join "{group.name}"',
        icon='👥',
        link=_group_link(group.id),
    )
    return 'pending', 'Join request sent'


@api_view(['GET', 'POST'])
def open_groups_list_create(request):
    user_id = request.query_params.get('user_id') or request.data.get('user_id')

    if request.method == 'POST':
        profile = _get_profile(user_id)
        if not profile:
            return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OpenTourGroupCreateSerializer(
            data=request.data,
            context={'organizer': profile},
        )
        if serializer.is_valid():
            group = serializer.save()
            detail = OpenTourGroupDetailSerializer(
                group,
                context={'request': request, 'user_id': user_id},
            )
            return Response(detail.data, status=status.HTTP_201_CREATED)
        return _validation_error_response(serializer)

    queryset = OpenTourGroup.objects.filter(is_active=True).select_related(
        'destination', 'organizer'
    )

    destination = request.query_params.get('destination')
    if destination:
        queryset = queryset.filter(
            Q(destination__slug=destination) | Q(destination__name__icontains=destination)
        )

    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    if date_from:
        queryset = queryset.filter(start_date__gte=date_from)
    if date_to:
        queryset = queryset.filter(end_date__lte=date_to)

    min_size = request.query_params.get('min_size')
    max_size = request.query_params.get('max_size')
    if min_size:
        queryset = queryset.filter(max_members__gte=int(min_size))
    if max_size:
        queryset = queryset.filter(max_members__lte=int(max_size))

    fee_type = request.query_params.get('fee_type')
    if fee_type in ('free', 'paid'):
        queryset = queryset.filter(fee_type=fee_type)

    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )

    serializer = OpenTourGroupListSerializer(
        queryset,
        many=True,
        context={'request': request, 'user_id': user_id},
    )
    return Response(serializer.data)


@api_view(['GET'])
def open_group_detail(request, group_id):
    user_id = request.query_params.get('user_id')
    group = OpenTourGroup.objects.filter(pk=group_id, is_active=True).select_related(
        'destination', 'organizer'
    ).prefetch_related('itinerary', 'members__user_profile').first()
    if not group:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
    profile = _get_profile(user_id)
    extra = {}
    if profile:
        pending = _get_pending_invite(profile, group)
        extra['pending_invite'] = bool(pending)
        extra['can_invite'] = _can_invite_to_group(profile, group)
    serializer = OpenTourGroupDetailSerializer(
        group,
        context={'request': request, 'user_id': user_id},
    )
    return Response({**serializer.data, **extra})


@api_view(['POST'])
def open_group_join(request, group_id):
    user_id = request.data.get('user_id')
    accept_invite = request.data.get('accept_invite', False)
    profile = _get_profile(user_id)
    if not profile:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)

    group = OpenTourGroup.objects.filter(pk=group_id, is_active=True).first()
    if not group:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    via_invite = bool(accept_invite)
    pending_invite = _get_pending_invite(profile, group)
    if accept_invite and not pending_invite:
        return Response({'error': 'No pending invite for this group'}, status=status.HTTP_400_BAD_REQUEST)
    if pending_invite and not accept_invite:
        via_invite = True

    new_status, message = _join_group(profile, group, via_invite=via_invite)
    if new_status is None:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

    if via_invite and pending_invite:
        pending_invite.status = 'accepted'
        pending_invite.responded_at = timezone.now()
        pending_invite.save(update_fields=['status', 'responded_at'])
        TravelerNotification.objects.filter(
            user_profile=profile,
            link=_group_link(group.id, invite=True),
            is_read=False,
        ).update(is_read=True)

    if new_status == 'joined':
        _notify(
            profile,
            'booking',
            f'You joined "{group.name}"',
            icon='✅',
            link=_group_link(group.id),
        )

    return Response({'message': message, 'status': new_status})


@api_view(['POST'])
def open_group_invite(request, group_id):
    user_id = request.data.get('user_id')
    username = (request.data.get('username') or '').strip()

    inviter = _get_profile(user_id)
    if not inviter:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

    group = OpenTourGroup.objects.filter(pk=group_id, is_active=True).select_related('organizer').first()
    if not group:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    if not _can_invite_to_group(inviter, group):
        return Response(
            {'error': 'Only group members can invite others'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if group.member_count >= group.max_members:
        return Response({'error': 'Group is full'}, status=status.HTTP_400_BAD_REQUEST)

    target_user = User.objects.filter(username__iexact=username).first()
    if not target_user:
        return Response({'error': f'No user found with username "{username}"'}, status=status.HTTP_404_NOT_FOUND)

    invitee = UserProfile.objects.filter(user=target_user, user_type='traveler').first()
    if not invitee:
        return Response(
            {'error': 'That user does not have a traveler profile'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if invitee.id == inviter.id:
        return Response({'error': 'You cannot invite yourself'}, status=status.HTTP_400_BAD_REQUEST)

    if _is_group_member(invitee, group):
        return Response({'error': 'User is already in this group'}, status=status.HTTP_400_BAD_REQUEST)

    existing_invite = OpenTourGroupInvite.objects.filter(group=group, invited_profile=invitee).first()
    if existing_invite and existing_invite.status == 'pending':
        return Response({'error': 'User already has a pending invite'}, status=status.HTTP_400_BAD_REQUEST)

    if existing_invite:
        existing_invite.status = 'pending'
        existing_invite.invited_by = inviter
        existing_invite.responded_at = None
        existing_invite.save(update_fields=['status', 'invited_by', 'responded_at'])
        invite = existing_invite
    else:
        invite = OpenTourGroupInvite.objects.create(
            group=group,
            invited_by=inviter,
            invited_profile=invitee,
            status='pending',
        )

    invite_message = (
        f'{inviter.full_name} invited you to join "{group.name}". '
        'Tap to view the group and join.'
    )
    _notify(
        invitee,
        'group_invite',
        invite_message,
        icon='🎉',
        link=_group_link(group.id, invite=True),
    )

    return Response(
        {
            'message': f'Invite sent to {invitee.full_name} (@{target_user.username})',
            'invite_id': invite.id,
            'invited_username': target_user.username,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
def my_groups(request):
    user_id = request.query_params.get('user_id')
    profile = _get_profile(user_id)
    if not profile:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)

    organized = OpenTourGroup.objects.filter(organizer=profile, is_active=True)
    joined_ids = OpenTourGroupMember.objects.filter(
        user_profile=profile,
        status='joined',
        role='member',
    ).values_list('group_id', flat=True)
    joined = OpenTourGroup.objects.filter(pk__in=joined_ids, is_active=True)

    ctx = {'request': request, 'user_id': user_id}
    return Response({
        'organized': OpenTourGroupListSerializer(organized, many=True, context=ctx).data,
        'joined': OpenTourGroupListSerializer(joined, many=True, context=ctx).data,
    })


@api_view(['GET', 'POST'])
def community_feed(request):
    user_id = request.query_params.get('user_id') or request.data.get('user_id')
    viewer = _get_profile(user_id)

    if request.method == 'POST':
        if not viewer:
            return Response(
                {
                    'error': (
                        'Traveler profile not found. Sign in with a traveler account '
                        'that has completed registration.'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = CommunityPostCreateSerializer(
            data=request.data,
            context={'author': viewer},
        )
        if serializer.is_valid():
            post = serializer.save()
            return Response(
                CommunityPostSerializer(post, context={'request': request, 'viewer_profile': viewer}).data,
                status=status.HTTP_201_CREATED,
            )
        return _validation_error_response(serializer)

    post_type = request.query_params.get('post_type')
    queryset = CommunityPost.objects.select_related('author', 'destination').all()
    if post_type in ('story', 'photo', 'tip'):
        queryset = queryset.filter(post_type=post_type)

    serializer = CommunityPostSerializer(
        queryset[:50],
        many=True,
        context={'request': request, 'viewer_profile': viewer},
    )
    return Response(serializer.data)


@api_view(['POST'])
def post_like_toggle(request, post_id):
    user_id = request.data.get('user_id')
    profile = _get_profile(user_id)
    if not profile:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)

    post = CommunityPost.objects.filter(pk=post_id).first()
    if not post:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    like, created = CommunityPostLike.objects.get_or_create(post=post, user_profile=profile)
    if not created:
        like.delete()
        post.likes_count = max(0, post.likes_count - 1)
        post.save(update_fields=['likes_count'])
        return Response({'liked': False, 'likes_count': post.likes_count})

    post.likes_count += 1
    post.save(update_fields=['likes_count'])
    return Response({'liked': True, 'likes_count': post.likes_count})


@api_view(['GET', 'POST'])
def post_comments(request, post_id):
    user_id = request.query_params.get('user_id') or request.data.get('user_id')
    profile = _get_profile(user_id)

    post = CommunityPost.objects.filter(pk=post_id).first()
    if not post:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        if not profile:
            return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)
        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'error': 'Comment content required'}, status=status.HTTP_400_BAD_REQUEST)
        comment = CommunityPostComment.objects.create(
            post=post,
            author=profile,
            content=content,
        )
        post.comments_count += 1
        post.save(update_fields=['comments_count'])
        return Response(
            CommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    comments = post.comments.select_related('author').all()
    return Response(CommentSerializer(comments, many=True, context={'request': request}).data)


@api_view(['POST', 'DELETE'])
def follow_traveler(request):
    user_id = request.data.get('user_id') or request.query_params.get('user_id')
    target_profile_id = request.data.get('target_profile_id') or request.query_params.get('target_profile_id')

    follower = _get_profile(user_id)
    if not follower:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)

    following = UserProfile.objects.filter(pk=target_profile_id, user_type='traveler').first()
    if not following:
        return Response({'error': 'Traveler not found'}, status=status.HTTP_404_NOT_FOUND)

    if follower.id == following.id:
        return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        TravelerFollow.objects.filter(follower=follower, following=following).delete()
        return Response({'following': False})

    TravelerFollow.objects.get_or_create(follower=follower, following=following)
    return Response({'following': True})
