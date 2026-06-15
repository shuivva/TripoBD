from django.core.management.base import BaseCommand
from api.models import TravelStats, UserProfile


class Command(BaseCommand):
    help = 'Update leaderboard ranks and connections count for all travelers'

    def handle(self, *args, **options):
        # First, update connections count for all travelers
        all_profiles = UserProfile.objects.filter(user_type='traveler')
        for profile in all_profiles:
            # Connections = followers + following
            followers_count = profile.followers.count()
            following_count = profile.following.count()
            total_connections = followers_count + following_count
            
            # Update the travel stats
            stats, created = TravelStats.objects.get_or_create(user_profile=profile)
            stats.connections_count = total_connections
            stats.save(update_fields=['connections_count'])
        
        # Calculate score for each traveler
        # Score = (total_trips_logged * 10) + (destinations_visited * 5) + (stories_posted * 3) + (reviews_written * 2) + (connections_count * 1)
        
        all_stats = TravelStats.objects.select_related('user_profile').filter(
            user_profile__user_type='traveler'
        )
        
        # Calculate scores
        scored_stats = []
        for stats in all_stats:
            score = (
                stats.total_trips_logged * 10 +
                stats.destinations_visited * 5 +
                stats.stories_posted * 3 +
                stats.reviews_written * 2 +
                stats.connections_count * 1
            )
            scored_stats.append((stats, score))
        
        # Sort by score (descending)
        scored_stats.sort(key=lambda x: x[1], reverse=True)
        
        # Update ranks
        for rank, (stats, score) in enumerate(scored_stats, start=1):
            stats.leaderboard_rank = rank
            stats.save(update_fields=['leaderboard_rank'])
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated leaderboard ranks and connections for {len(scored_stats)} travelers')
        )
