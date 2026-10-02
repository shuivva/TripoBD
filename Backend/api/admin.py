from django.contrib import admin
from .models import (
    Destination,
    Attraction,
    Accommodation,
    Review,
    TourGroup,
    Guide,
    Route,
    TourRoom,
    TourRoomMembership,
    TravelerNotification,
    OpenTourGroup,
    OpenTourGroupItinerary,
    OpenTourGroupMember,
    OpenTourGroupInvite,
    CommunityPost,
    CommunityPostComment,
    CommunityPostLike,
    TravelerFollow,
    UserProfile,
    ServiceProvider,
    ServiceProviderBooking,
    AccountSettings,
    SecurityAuditLog,
)
from simple_history.admin import SimpleHistoryAdmin


@admin.register(UserProfile)
class UserProfileAdmin(SimpleHistoryAdmin):
    list_display = ('user', 'full_name', 'phone_number', 'user_type', 'is_email_verified')
    search_fields = ('user__username', 'full_name', 'phone_number')
    list_filter = ('user_type', 'is_email_verified', 'division')


@admin.register(ServiceProvider)
class ServiceProviderAdmin(SimpleHistoryAdmin):
    list_display = ('user', 'service_type', 'is_verified', 'years_of_experience', 'submitted_at')
    search_fields = ('user__username', 'service_type')
    list_filter = ('is_verified', 'service_type')


@admin.register(ServiceProviderBooking)
class ServiceProviderBookingAdmin(SimpleHistoryAdmin):
    list_display = ('id', 'customer', 'service_provider', 'start_date', 'end_date', 'status', 'created_at')
    search_fields = ('customer__username', 'service_provider__user__username')
    list_filter = ('status', 'start_date')


@admin.register(AccountSettings)
class AccountSettingsAdmin(SimpleHistoryAdmin):
    list_display = ('user_profile', 'profile_visibility', 'two_factor_enabled', 'deactivation_requested')
    list_filter = ('profile_visibility', 'two_factor_enabled', 'deactivation_requested')


@admin.register(SecurityAuditLog)
class SecurityAuditLogAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'username_attempted', 'user', 'ip_address', 'timestamp')
    list_filter = ('event_type', 'timestamp')
    search_fields = ('username_attempted', 'user__username', 'ip_address')
    readonly_fields = ('event_type', 'username_attempted', 'user', 'ip_address', 'user_agent', 'details', 'timestamp')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


admin.site.register(Destination)
admin.site.register(Attraction)
admin.site.register(Accommodation)
admin.site.register(Review)
admin.site.register(TourGroup)
admin.site.register(Guide)
admin.site.register(Route)
admin.site.register(TourRoom)
admin.site.register(TourRoomMembership)
admin.site.register(TravelerNotification)
admin.site.register(OpenTourGroup)
admin.site.register(OpenTourGroupItinerary)
admin.site.register(OpenTourGroupMember)
admin.site.register(OpenTourGroupInvite)
admin.site.register(CommunityPost)
admin.site.register(CommunityPostComment)
admin.site.register(CommunityPostLike)
admin.site.register(TravelerFollow)
