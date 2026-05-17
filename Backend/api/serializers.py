from rest_framework import serializers
from .models import Destination, Attraction, Accommodation, Review, TourGroup, Guide, Route


class AttractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attraction
        fields = ['name']


class AccommodationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accommodation
        fields = ['name', 'price', 'summary']


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['author', 'score', 'note']


class TourGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourGroup
        fields = ['name', 'members', 'departure']


class DestinationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ['slug', 'name', 'region', 'category', 'budget', 'rating', 'hero', 'summary']


class DestinationDetailSerializer(serializers.ModelSerializer):
    attractions = AttractionSerializer(many=True, read_only=True)
    accommodations = AccommodationSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    groups = TourGroupSerializer(many=True, read_only=True)

    class Meta:
        model = Destination
        fields = [
            'slug',
            'name',
            'region',
            'category',
            'budget',
            'rating',
            'duration',
            'season',
            'summary',
            'description',
            'hero',
            'coords_lat',
            'coords_lng',
            'attractions',
            'accommodations',
            'reviews',
            'groups',
        ]


class GuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guide
        fields = ['name', 'location', 'rating', 'bio']


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = [
            'from_location',
            'to_location',
            'mode',
            'operator',
            'fare',
            'duration',
            'departure',
            'travel_class',
            'tips',
            'path',
        ]
