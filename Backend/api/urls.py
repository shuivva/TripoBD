from django.urls import path
from .views import (
    DestinationListAPIView,
    DestinationDetailAPIView,
    GuideListAPIView,
    RouteListAPIView,
    discover_filters,
    register_traveler,
    verify_otp,
    register_service_provider,
    login_view,
    logout_view,
    get_service_provider_profile,
    update_service_provider_profile,
    get_traveler_profile,
    update_traveler_profile,
    tour_rooms,
    tour_room_detail,
    join_tour_room,
    tour_groups,
    join_tour_group,
    bookings,
    booking_detail,
    traveler_reviews,
    traveler_review_detail,
    trip_stories,
    trip_story_detail,
    notifications,
    mark_notification_read,
    mark_all_notifications_read,
    wishlist,
    wishlist_item,
    travel_preferences,
    badges,
    user_badges,
    ai_conversations,
    support_tickets,
)

urlpatterns = [
    path('destinations/', DestinationListAPIView.as_view(), name='destination-list'),
    path('destinations/<slug:slug>/', DestinationDetailAPIView.as_view(), name='destination-detail'),
    path('guides/', GuideListAPIView.as_view(), name='guide-list'),
    path('routes/', RouteListAPIView.as_view(), name='route-list'),
    path('filters/', discover_filters, name='discover-filters'),
    path('auth/register/traveler/', register_traveler, name='register-traveler'),
    path('auth/verify-otp/', verify_otp, name='verify-otp'),
    path('auth/register/service-provider/', register_service_provider, name='register-service-provider'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('service-provider/profile/', get_service_provider_profile, name='get-service-provider-profile'),
    path('service-provider/profile/update/', update_service_provider_profile, name='update-service-provider-profile'),
    path('traveler/profile/', get_traveler_profile, name='get-traveler-profile'),
    path('traveler/profile/update/', update_traveler_profile, name='update-traveler-profile'),
    # Tour Room endpoints
    path('tour-rooms/', tour_rooms, name='tour-rooms'),
    path('tour-rooms/<int:pk>/', tour_room_detail, name='tour-room-detail'),
    path('tour-rooms/<int:pk>/join/', join_tour_room, name='join-tour-room'),
    # Tour Group endpoints
    path('tour-groups/', tour_groups, name='tour-groups'),
    path('tour-groups/<int:pk>/join/', join_tour_group, name='join-tour-group'),
    # Booking endpoints
    path('bookings/', bookings, name='bookings'),
    path('bookings/<int:pk>/', booking_detail, name='booking-detail'),
    # Review endpoints
    path('reviews/', traveler_reviews, name='traveler-reviews'),
    path('reviews/<int:pk>/', traveler_review_detail, name='traveler-review-detail'),
    # Trip Story endpoints
    path('stories/', trip_stories, name='trip-stories'),
    path('stories/<int:pk>/', trip_story_detail, name='trip-story-detail'),
    # Notification endpoints
    path('notifications/', notifications, name='notifications'),
    path('notifications/<int:pk>/read/', mark_notification_read, name='mark-notification-read'),
    path('notifications/mark-all-read/', mark_all_notifications_read, name='mark-all-notifications-read'),
    # Wishlist endpoints
    path('wishlist/', wishlist, name='wishlist'),
    path('wishlist/<int:pk>/', wishlist_item, name='wishlist-item'),
    # Travel Preferences endpoints
    path('travel-preferences/', travel_preferences, name='travel-preferences'),
    # Badge endpoints
    path('badges/', badges, name='badges'),
    path('user-badges/', user_badges, name='user-badges'),
    # AI Conversation endpoints
    path('ai-conversations/', ai_conversations, name='ai-conversations'),
    # Support Ticket endpoints
    path('support-tickets/', support_tickets, name='support-tickets'),
]
