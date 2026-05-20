from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    UserProfile,
    OpenTourGroup,
    OpenTourGroupMember,
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
    if not user_id:
        return None
    return UserProfile.objects.filter(user_id=user_id, user_type='traveler').first()


def _notify(profile, ntype, message, icon='📌', link=''):
    TravelerNotification.objects.create(
        user_profile=profile,
        notification_type=ntype,
        title=message[:200],
        message=message,
        icon=icon,
        link=link,
    )


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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
    serializer = OpenTourGroupDetailSerializer(
        group,
        context={'request': request, 'user_id': user_id},
    )
    return Response(serializer.data)


@api_view(['POST'])
def open_group_join(request, group_id):
    user_id = request.data.get('user_id')
    profile = _get_profile(user_id)
    if not profile:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)

    group = OpenTourGroup.objects.filter(pk=group_id, is_active=True).first()
    if not group:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    existing = OpenTourGroupMember.objects.filter(group=group, user_profile=profile).first()
    if existing:
        if existing.status == 'joined':
            return Response({'message': 'Already a member', 'status': 'joined'})
        if existing.status == 'pending':
            return Response({'message': 'Request already pending', 'status': 'pending'})

    if group.member_count >= group.max_members:
        return Response({'error': 'Group is full'}, status=status.HTTP_400_BAD_REQUEST)

    if group.organizer_id == profile.id:
        return Response({'error': 'You are the organiser'}, status=status.HTTP_400_BAD_REQUEST)

    new_status = 'joined' if group.join_type == 'open' else 'pending'
    OpenTourGroupMember.objects.create(
        group=group,
        user_profile=profile,
        role='member',
        status=new_status,
    )

    if new_status == 'pending':
        _notify(
            group.organizer,
            'invite',
            f'{profile.full_name} requested to join "{group.name}"',
            icon='👥',
            link=f'/traveler/community/groups/{group.id}',
        )
        return Response({'message': 'Join request sent', 'status': 'pending'})

    _notify(
        profile,
        'booking',
        f'You joined "{group.name}"',
        icon='✅',
        link=f'/traveler/community/groups/{group.id}',
    )
    return Response({'message': 'Joined successfully', 'status': 'joined'})


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
            return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)
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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
