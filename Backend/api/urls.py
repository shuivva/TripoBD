from django.urls import path
from .views import *
from .community_views import (
    open_groups_list_create,
    open_group_detail,
    open_group_join,
    open_group_invite,
    my_groups,
    community_feed,
    post_like_toggle,
    post_comments,
    follow_traveler,
)
from .guide_admin_views import (
    guide_dashboard_stats,
    guide_profile_detail_update,
    guide_booking_actions,
    guide_earnings_list,
    guide_support_tickets,
    admin_dashboard_stats,
    admin_user_management,
    admin_guide_verification,
    admin_destination_management,
    admin_content_moderation,
    admin_tour_groups_list,
    admin_support_tickets,
    admin_system_config,
    admin_audit_logs,
    admin_send_announcement,
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
    path('traveler/dashboard/<int:user_id>/', traveler_dashboard, name='traveler-dashboard'),
    path('traveler/profile/<int:user_id>/', traveler_profile_detail, name='traveler-profile-detail'),
    path('traveler/profile/<int:user_id>/update/', traveler_profile_update, name='traveler-profile-update'),
    path('traveler/profile/<int:user_id>/preferences/', traveler_preferences_update, name='traveler-preferences-update'),
    path('traveler/profile/<int:user_id>/account-settings/', traveler_account_settings_update, name='traveler-account-settings-update'),
    path('traveler/profile/<int:user_id>/change-password/', traveler_change_password, name='traveler-change-password'),
    path('traveler/profile/<int:user_id>/photo/', traveler_profile_photo_update, name='traveler-profile-photo-update'),
    path('community/groups/', open_groups_list_create, name='community-groups'),
    path('community/groups/my/', my_groups, name='community-my-groups'),
    path('community/groups/<int:group_id>/', open_group_detail, name='community-group-detail'),
    path('community/groups/<int:group_id>/join/', open_group_join, name='community-group-join'),
    path('community/groups/<int:group_id>/invite/', open_group_invite, name='community-group-invite'),
    path('community/feed/', community_feed, name='community-feed'),
    path('community/posts/<int:post_id>/like/', post_like_toggle, name='community-post-like'),
    path('community/posts/<int:post_id>/comments/', post_comments, name='community-post-comments'),
    path('community/follow/', follow_traveler, name='community-follow'),

    # ==========================================
    # RESTORED AND NEW API ENDPOINTS
    # ==========================================
    
    # 3.3 AI Travel Assistant
    path('traveler/<int:user_id>/ai/sessions/', ai_sessions_list_create, name='ai-sessions'),
    path('traveler/ai/sessions/<int:session_id>/', ai_session_detail, name='ai-session-detail'),
    path('traveler/ai/sessions/<int:session_id>/respond/', ai_session_respond, name='ai-session-respond'),
    path('traveler/ai/messages/<int:message_id>/feedback/', ai_message_feedback, name='ai-message-feedback'),
    path('traveler/ai/sessions/<int:session_id>/save-itinerary/', ai_save_itinerary, name='ai-save-itinerary'),

    # 3.4 Tour Room (Group Planner)
    path('traveler/<int:user_id>/tourrooms/', tourroom_list_create, name='tourrooms-list-create'),
    path('traveler/<int:user_id>/tourrooms/<int:room_id>/', tourroom_detail, name='tourroom-detail'),
    path('traveler/<int:user_id>/tourrooms/<int:room_id>/invite/', tourroom_invite_member, name='tourroom-invite-member'),
    path('traveler/<int:user_id>/tourrooms/invites/', tourroom_invites_list, name='tourroom-invites-list'),
    path('traveler/<int:user_id>/tourrooms/invites/<int:invite_id>/respond/', tourroom_invite_respond, name='tourroom-invite-respond'),
    
    path('tourrooms/<int:room_id>/activities/', tourroom_activity_create, name='tourroom-activity-create'),
    path('tourrooms/activities/<int:activity_id>/', tourroom_activity_detail, name='tourroom-activity-detail'),
    path('tourrooms/<int:room_id>/expenses/', tourroom_expense_create, name='tourroom-expense-create'),
    path('tourrooms/expenses/participants/<int:participant_id>/', tourroom_expense_participant_paid, name='tourroom-expense-participant-paid'),
    path('tourrooms/<int:room_id>/polls/', tourroom_poll_create, name='tourroom-poll-create'),
    path('tourrooms/polls/<int:poll_id>/vote/', tourroom_poll_vote, name='tourroom-poll-vote'),
    path('tourrooms/<int:room_id>/checklist/', tourroom_checklist_create, name='tourroom-checklist-create'),
    path('tourrooms/checklist/<int:item_id>/', tourroom_checklist_detail, name='tourroom-checklist-detail'),
    path('tourrooms/<int:room_id>/chat/', tourroom_chat_messages, name='tourroom-chat-messages'),
    path('tourrooms/<int:room_id>/mappins/', tourroom_mappin_create, name='tourroom-mappin-create'),
    path('tourrooms/mappins/<int:pin_id>/', tourroom_mappin_delete, name='tourroom-mappin-delete'),
    path('tourrooms/<int:room_id>/booking-notes/', tourroom_bookingnote_create, name='tourroom-bookingnote-create'),
    path('tourrooms/<int:room_id>/settings/', tourroom_settings_update, name='tourroom-settings-update'),

    # 3.6 Tour Guide & Local Bookings
    path('traveler/bookings/service-providers/', service_provider_list, name='service-provider-list'),
    path('traveler/bookings/service-providers/<int:sp_id>/', service_provider_detail, name='service-provider-detail'),
    path('traveler/bookings/service-providers/<int:sp_id>/book/', service_provider_book, name='service-provider-book'),
    path('traveler/<int:user_id>/bookings/', my_bookings_list, name='my-bookings-list'),
    path('traveler/bookings/<int:booking_id>/status/', booking_status_update, name='booking-status-update'),
    path('traveler/bookings/service-providers/<int:sp_id>/review/', service_provider_review, name='service-provider-review'),

    # 3.7 Reviews & Trip Stories
    path('traveler/destinations/<slug:dest_slug>/review/', destination_review_create, name='destination-review-create'),
    path('traveler/accommodations/<int:accom_id>/review/', accommodation_review_create, name='accommodation-review-create'),
    path('traveler/<int:user_id>/stories/create-update/', trip_story_create_update, name='trip-story-create-update'),
    path('traveler/stories/<int:story_id>/', trip_story_detail, name='trip-story-detail'),
    path('traveler/<int:user_id>/reviews/', my_reviews_list, name='my-reviews-list'),
    path('traveler/reviews/<str:review_type>/<int:review_id>/', review_delete, name='review-delete'),
    path('traveler/leaderboard/', traveler_leaderboard, name='traveler-leaderboard'),

    # 3.8 Notifications Centre
    path('traveler/<int:user_id>/notifications/', notifications_list, name='notifications-list'),
    path('traveler/notifications/<int:notification_id>/read/', notification_mark_read, name='notification-mark-read'),
    path('traveler/<int:user_id>/notifications/read-all/', notifications_mark_all_read, name='notifications-mark-all-read'),
    path('traveler/<int:user_id>/notifications/preferences/', notification_preferences_get_update, name='notification-preferences-get-update'),

    # 3.9 Saved / Wishlist
    path('traveler/wishlist/<int:wishlist_id>/notes/', wishlist_add_note, name='wishlist-add-note'),
    path('traveler/wishlist/<int:wishlist_id>/delete/', wishlist_delete, name='wishlist-delete'),
    path('traveler/wishlist/<int:wishlist_id>/share/', wishlist_share, name='wishlist-share'),
    path('traveler/wishlist/<int:wishlist_id>/convert/', wishlist_convert_to_room, name='wishlist-convert-to-room'),

    # ==========================================
    # SECTION 4 & 5: GUIDE & ADMIN ENDPOINTS
    # ==========================================
    
    # Guide Portal APIs
    path('guide/<int:user_id>/dashboard/', guide_dashboard_stats, name='guide-dashboard'),
    path('guide/<int:user_id>/profile/', guide_profile_detail_update, name='guide-profile'),
    path('guide/bookings/<int:booking_id>/action/', guide_booking_actions, name='guide-booking-action'),
    path('guide/<int:user_id>/earnings/', guide_earnings_list, name='guide-earnings'),
    path('guide/<int:user_id>/support/tickets/', guide_support_tickets, name='guide-support-tickets'),

    # Admin Portal APIs
    path('admin/stats/', admin_dashboard_stats, name='admin-dashboard-stats'),
    path('admin/users/', admin_user_management, name='admin-users'),
    path('admin/guides/verification/', admin_guide_verification, name='admin-guide-verification'),
    path('admin/destinations/', admin_destination_management, name='admin-destinations'),
    path('admin/destinations/<slug:dest_slug>/', admin_destination_management, name='admin-destination-detail'),
    path('admin/moderation/flagged/', admin_content_moderation, name='admin-content-moderation'),
    path('admin/tour-groups/', admin_tour_groups_list, name='admin-tour-groups'),
    path('admin/support/tickets/', admin_support_tickets, name='admin-support-tickets'),
    path('admin/config/system/', admin_system_config, name='admin-system-config'),
    path('admin/config/audit-logs/', admin_audit_logs, name='admin-audit-logs'),
    path('admin/announcements/', admin_send_announcement, name='admin-announcements'),
]
