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
)


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
