from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit or delete it.
    Assumes the model instance has an `owner`, `user`, `user_profile`, `customer`, or `author` attribute.
    Safe methods (GET, HEAD, OPTIONS) are allowed for any request unless explicitly restricted.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request for safe methods
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        # Check various ownership attributes
        if hasattr(obj, 'owner') and obj.owner:
            return obj.owner == request.user
        if hasattr(obj, 'user') and obj.user:
            return obj.user == request.user
        if hasattr(obj, 'user_profile') and obj.user_profile:
            return getattr(obj.user_profile, 'user', None) == request.user
        if hasattr(obj, 'author') and obj.author:
            if hasattr(obj.author, 'user'):
                return obj.author.user == request.user
            return obj.author == request.user
        if hasattr(obj, 'customer') and obj.customer:
            return obj.customer == request.user

        # If the object itself is a User or UserProfile
        if obj == request.user:
            return True
        if hasattr(obj, 'user') and obj.user == request.user:
            return True

        return False


class IsTourRoomMember(permissions.BasePermission):
    """
    Object-level permission ensuring only active members of a TourRoom can access or mutate it.
    Can be evaluated on a TourRoom instance or any child resource with a `room` attribute.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        from .models import TourRoom, TourRoomMembership

        # Determine target room
        room = obj if isinstance(obj, TourRoom) else getattr(obj, 'room', None)
        if not room:
            return False

        # Owner has full access
        if room.owner_id == request.user.id:
            return True

        # Check membership
        return TourRoomMembership.objects.filter(room=room, user=request.user).exists()


class IsBookingParticipant(permissions.BasePermission):
    """
    Object-level permission ensuring only the customer, assigned service provider, or staff
    can access or modify a ServiceProviderBooking.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        # Customer check
        if getattr(obj, 'customer_id', None) == request.user.id:
            return True

        # Service provider check
        sp = getattr(obj, 'service_provider', None)
        if sp and getattr(sp, 'user_id', None) == request.user.id:
            return True

        return False


class IsOwnerOnly(permissions.BasePermission):
    """
    Strict object-level permission that allows access (read AND write) ONLY to the owner.
    Useful for highly sensitive PII, account settings, drafts, and notifications.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        if hasattr(obj, 'owner') and obj.owner:
            return obj.owner == request.user
        if hasattr(obj, 'user') and obj.user:
            return obj.user == request.user
        if hasattr(obj, 'user_profile') and obj.user_profile:
            return getattr(obj.user_profile, 'user', None) == request.user
        if hasattr(obj, 'customer') and obj.customer:
            return obj.customer == request.user
        if hasattr(obj, 'author') and obj.author:
            if hasattr(obj.author, 'user'):
                return obj.author.user == request.user
            return obj.author == request.user

        if obj == request.user:
            return True

        return False
