import uuid
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from .models import (
    ServiceProviderBooking,
    TourRoom,
    ServiceProvider,
    TripStory,
    CommunityPost,
    TourRoomMembership,
)
from .serializers import (
    ServiceProviderBookingSerializer,
    TourRoomSerializer,
    ServiceProviderProfileSerializer,
    TripStorySerializer,
)
from .community_serializers import CommunityPostSerializer
from .permissions import (
    IsOwnerOrReadOnly,
    IsTourRoomMember,
    IsBookingParticipant,
    IsOwnerOnly,
)


class BookingViewSet(viewsets.ModelViewSet):
    """
    IDOR-protected ViewSet for Bookings.
    Enforces object-level access via IsBookingParticipant.
    Overrides get_queryset() to strictly scope results to the authenticated user's records.
    Lookups are performed via unguessable UUID.
    """
    serializer_class = ServiceProviderBookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsBookingParticipant]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return ServiceProviderBooking.objects.none()
        if user.is_staff or user.is_superuser:
            return ServiceProviderBooking.objects.all().select_related(
                'service_provider', 'service_provider__user', 'customer', 'customer__profile'
            )
        # Only customer or assigned service provider can retrieve their bookings
        return ServiceProviderBooking.objects.filter(
            Q(customer=user) | Q(service_provider__user=user)
        ).select_related(
            'service_provider', 'service_provider__user', 'customer', 'customer__profile'
        )

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class TourRoomViewSet(viewsets.ModelViewSet):
    """
    IDOR-protected ViewSet for Tour Rooms.
    Enforces room membership verification via IsTourRoomMember.
    Lookups are performed via unguessable UUID.
    """
    serializer_class = TourRoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsTourRoomMember]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return TourRoom.objects.filter(is_public=True, is_archived=False)
        if user.is_staff or user.is_superuser:
            return TourRoom.objects.all()

        # Members or owners can see their rooms; public rooms are also visible in listing
        return TourRoom.objects.filter(
            Q(owner=user) | Q(memberships__user=user) | Q(is_public=True, is_archived=False)
        ).distinct()

    def perform_create(self, serializer):
        room = serializer.save(owner=self.request.user)
        TourRoomMembership.objects.get_or_create(room=room, user=self.request.user, defaults={'is_admin': True})


class ServiceProviderViewSet(viewsets.ModelViewSet):
    """
    IDOR-protected ViewSet for Service Providers.
    Allows public read access while restricting write/update actions strictly to the owning provider.
    Lookups are performed via unguessable UUID.
    """
    serializer_class = ServiceProviderProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    lookup_field = 'uuid'
    queryset = ServiceProvider.objects.all().select_related('user', 'user__profile')


class TripStoryViewSet(viewsets.ModelViewSet):
    """
    IDOR-protected ViewSet for Trip Stories.
    Published stories are publicly readable. Draft stories are visible and editable only by the author.
    Lookups are performed via unguessable UUID.
    """
    serializer_class = TripStorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated:
            if user.is_staff or user.is_superuser:
                return TripStory.objects.all().select_related('user_profile', 'destination')
            # Author can see their drafts + all published stories
            return TripStory.objects.filter(
                Q(status='published') | Q(user_profile__user=user)
            ).select_related('user_profile', 'destination')
        return TripStory.objects.filter(status='published').select_related('user_profile', 'destination')


class CommunityPostViewSet(viewsets.ModelViewSet):
    """
    IDOR-protected ViewSet for Community Posts.
    Read is open to all; updates and deletions are restricted to the author.
    Lookups are performed via unguessable UUID.
    """
    serializer_class = CommunityPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    lookup_field = 'uuid'
    queryset = CommunityPost.objects.all().select_related('author', 'destination')
