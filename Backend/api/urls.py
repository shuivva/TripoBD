from django.urls import path
from .views import (
    DestinationListAPIView,
    DestinationDetailAPIView,
    GuideListAPIView,
    RouteListAPIView,
    discover_filters,
)

urlpatterns = [
    path('destinations/', DestinationListAPIView.as_view(), name='destination-list'),
    path('destinations/<slug:slug>/', DestinationDetailAPIView.as_view(), name='destination-detail'),
    path('guides/', GuideListAPIView.as_view(), name='guide-list'),
    path('routes/', RouteListAPIView.as_view(), name='route-list'),
    path('filters/', discover_filters, name='discover-filters'),
]
