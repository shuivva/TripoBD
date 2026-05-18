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
]
