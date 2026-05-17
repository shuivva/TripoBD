from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Q
from .models import Destination, Guide, Route
from .serializers import (
    DestinationListSerializer,
    DestinationDetailSerializer,
    GuideSerializer,
    RouteSerializer,
)


class DestinationListAPIView(generics.ListAPIView):
    queryset = Destination.objects.all()
    serializer_class = DestinationListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params
        search = query.get('search')
        region = query.get('region')
        category = query.get('category')
        budget = query.get('budget')
        season = query.get('season')
        duration = query.get('duration')

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(summary__icontains=search))
        if region:
            queryset = queryset.filter(region__iexact=region)
        if category:
            queryset = queryset.filter(category__iexact=category)
        if budget:
            queryset = queryset.filter(budget__iexact=budget)
        if season:
            queryset = queryset.filter(season__iexact=season)
        if duration:
            queryset = queryset.filter(duration__iexact=duration)

        return queryset


class DestinationDetailAPIView(generics.RetrieveAPIView):
    queryset = Destination.objects.all()
    serializer_class = DestinationDetailSerializer
    lookup_field = 'slug'


class GuideListAPIView(generics.ListAPIView):
    queryset = Guide.objects.all().order_by('-rating')[:10]
    serializer_class = GuideSerializer


class RouteListAPIView(generics.ListAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        from_location = self.request.query_params.get('from')
        to_location = self.request.query_params.get('to')
        mode = self.request.query_params.get('mode')

        if from_location:
            queryset = queryset.filter(from_location__icontains=from_location)
        if to_location:
            queryset = queryset.filter(to_location__icontains=to_location)
        if mode and mode.lower() != 'mixed':
            queryset = queryset.filter(mode__iexact=mode)

        return queryset


@api_view(['GET'])
def discover_filters(request):
    return Response(
        {
            'regions': sorted(Destination.objects.values_list('region', flat=True).distinct()),
            'categories': sorted(Destination.objects.values_list('category', flat=True).distinct()),
            'seasons': sorted(Destination.objects.values_list('season', flat=True).distinct()),
            'durations': sorted(Destination.objects.values_list('duration', flat=True).distinct()),
            'budgets': sorted(Destination.objects.values_list('budget', flat=True).distinct()),
        }
    )
