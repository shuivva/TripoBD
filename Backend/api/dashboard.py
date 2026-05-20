from datetime import date

from django.db.models import Q
from django.utils import timezone

from .models import (
    Destination,
    TourRoom,
    TourRoomMembership,
    TravelerNotification,
    TripStory,
    Wishlist,
)


def _profile_photo_url(profile, request):
    if not profile.profile_photo:
        return None
    try:
        return request.build_absolute_uri(profile.profile_photo.url)
    except Exception:
        return None


def _initials(full_name):
    parts = [p for p in (full_name or '').split() if p]
    if not parts:
        return '?'
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _destination_card(dest):
    return {
        'slug': dest.slug,
        'name': dest.name,
        'country': dest.region,
        'image': dest.hero or '',
        'rating': float(dest.rating),
    }


def _recommended_destinations(profile, limit=3):
    prefs = getattr(profile, 'travel_preferences', None)
    preferred = []
    if prefs and prefs.preferred_destinations:
        preferred = [p.strip() for p in prefs.preferred_destinations.split(',') if p.strip()]

    queryset = Destination.objects.all()
    if preferred:
        q_filter = Q()
        for term in preferred:
            q_filter |= Q(name__icontains=term) | Q(region__icontains=term) | Q(category__icontains=term)
        queryset = queryset.filter(q_filter).distinct()

    results = list(queryset.order_by('-rating')[:limit])
    if len(results) < limit:
        exclude_ids = [d.id for d in results]
        filler = Destination.objects.exclude(id__in=exclude_ids).order_by('-rating')[: limit - len(results)]
        results.extend(filler)

    return [_destination_card(d) for d in results]


def _upcoming_trip(profile):
    now = timezone.now()
    membership = (
        TourRoomMembership.objects.filter(
            user_id=profile.user_id,
            room__start_datetime__gte=now,
        )
        .select_related('room', 'room__destination')
        .order_by('room__start_datetime')
        .first()
    )
    if not membership:
        return None

    room = membership.room
    dest = room.destination
    image = dest.hero if dest else ''
    start = timezone.localtime(room.start_datetime) if timezone.is_aware(room.start_datetime) else room.start_datetime
    end = timezone.localtime(room.end_datetime) if timezone.is_aware(room.end_datetime) else room.end_datetime
    return {
        'id': room.id,
        'title': room.name,
        'destination_slug': dest.slug if dest else None,
        'image': image,
        'start_date': start.date().isoformat(),
        'end_date': end.date().isoformat(),
        'date_label': f'{start.strftime("%B %d")} - {end.strftime("%B %d, %Y")}',
    }


def _active_tour_rooms(profile, limit=5):
    memberships = (
        TourRoomMembership.objects.filter(user_id=profile.user_id)
        .select_related('room', 'room__destination')
        .order_by('-joined_at')[:limit]
    )
    rooms = []
    for m in memberships:
        room = m.room
        member_count = room.memberships.count()
        image = room.destination.hero if room.destination else ''
        rooms.append(
            {
                'id': room.id,
                'name': room.name,
                'members': member_count,
                'unread': m.unread_count,
                'image': image,
            }
        )
    return rooms


def _recent_notifications(profile, limit=5):
    notifications = TravelerNotification.objects.filter(user_profile=profile).order_by('-created_at')[:limit]
    now = timezone.now()
    items = []
    for n in notifications:
        delta = now - n.created_at
        if delta.days > 0:
            time_label = f'{delta.days} day{"s" if delta.days != 1 else ""} ago'
        elif delta.seconds >= 3600:
            hours = delta.seconds // 3600
            time_label = f'{hours} hour{"s" if hours != 1 else ""} ago'
        else:
            minutes = max(1, delta.seconds // 60)
            time_label = f'{minutes} minute{"s" if minutes != 1 else ""} ago'
        items.append(
            {
                'id': n.id,
                'type': n.notification_type,
                'message': n.message,
                'time': time_label,
                'icon': n.icon,
                'is_read': n.is_read,
            }
        )
    return items


def _trending_destinations(limit=3):
    destinations = Destination.objects.order_by('-weekly_views', '-rating')[:limit]
    items = []
    for d in destinations:
        views = d.weekly_views
        if views >= 1000:
            views_label = f'{(views / 1000):.1f}K'
        else:
            views_label = str(views)
        items.append(
            {
                'slug': d.slug,
                'name': d.name,
                'country': d.region,
                'image': d.hero or '',
                'views': views_label,
            }
        )
    return items


def _trip_stories_feed(profile, limit=3):
    stories = (
        TripStory.objects.filter(status='published')
        .exclude(user_profile=profile)
        .select_related('user_profile', 'destination')
        .order_by('-likes_count', '-published_at')[:limit]
    )
    items = []
    for story in stories:
        image = ''
        if story.cover_photo:
            try:
                image = story.cover_photo.url
            except Exception:
                image = ''
        if not image and story.photos:
            image = story.photos[0] if isinstance(story.photos, list) else ''
        if not image:
            image = story.destination.hero or ''
        items.append(
            {
                'id': story.id,
                'author': story.user_profile.full_name,
                'destination': story.destination.name,
                'image': image,
                'likes': story.likes_count,
            }
        )
    return items


def _wishlist_preview(profile, limit=4):
    entries = (
        Wishlist.objects.filter(user_profile=profile)
        .select_related('destination')
        .order_by('-added_at')[:limit]
    )
    return [
        {
            'slug': w.destination.slug,
            'name': w.destination.name,
            'country': w.destination.region,
            'image': w.destination.hero or '',
        }
        for w in entries
    ]


def build_traveler_dashboard(profile, request):
    stats = profile.travel_stats
    first_name = (profile.full_name or '').split()[0] if profile.full_name else 'Traveler'

    return {
        'welcome': {
            'full_name': profile.full_name,
            'first_name': first_name,
            'avatar_initials': _initials(profile.full_name),
            'avatar_url': _profile_photo_url(profile, request),
            'stats': {
                'trips': stats.total_trips_logged,
                'countries': stats.destinations_visited,
                'connections': stats.connections_count,
            },
        },
        'upcoming_trip': _upcoming_trip(profile),
        'recommended_destinations': _recommended_destinations(profile),
        'tour_rooms': _active_tour_rooms(profile),
        'notifications': _recent_notifications(profile),
        'trending_destinations': _trending_destinations(),
        'trip_stories': _trip_stories_feed(profile),
        'wishlist': _wishlist_preview(profile),
        'ai_assistant': {
            'greeting': (
                f"Hello {first_name}! I'm your AI travel assistant. "
                'How can I help you plan your next adventure?'
            ),
        },
    }
