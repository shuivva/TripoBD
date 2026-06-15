from django.core.management.base import BaseCommand
from api.models import TourGuide, BoatCharter, VehicleRental, Destination
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Seed sample data for tour guides, boat charters, and vehicle rentals'

    def handle(self, *args, **kwargs):
        # Get destinations
        destinations = list(Destination.objects.all())
        if not destinations:
            self.stdout.write(self.style.WARNING('No destinations found. Please seed destinations first.'))
            return

        # Seed Tour Guides (need to create users first)
        tour_guides_data = [
            {
                'username': 'rahim_guide',
                'email': 'rahim@example.com',
                'first_name': 'Rahim',
                'last_name': 'Ahmed',
                'service_type': 'guide',
                'specialties': 'cultural tours, historical sites, city exploration',
                'languages': 'english,bengali,hindi',
                'description': 'Expert guide with 10 years of experience in cultural tours across Bangladesh.',
                'price_per_day': 1500.00,
                'rating': 4.8,
                'reviews_count': 45,
            },
            {
                'username': 'fatima_guide',
                'email': 'fatima@example.com',
                'first_name': 'Fatima',
                'last_name': 'Begum',
                'service_type': 'guide',
                'specialties': 'nature tours, wildlife, photography',
                'languages': 'english,bengali',
                'description': 'Nature enthusiast specializing in Sundarbans and hill tracts tours.',
                'price_per_day': 1200.00,
                'rating': 4.6,
                'reviews_count': 32,
            },
            {
                'username': 'karim_guide',
                'email': 'karim@example.com',
                'first_name': 'Karim',
                'last_name': 'Hossain',
                'service_type': 'guide',
                'specialties': 'adventure, trekking, hiking, outdoor activities',
                'languages': 'english,bengali',
                'description': 'Adventure guide for trekking, hiking, and outdoor activities.',
                'price_per_day': 1800.00,
                'rating': 4.7,
                'reviews_count': 28,
            },
            {
                'username': 'nasreen_guide',
                'email': 'nasreen@example.com',
                'first_name': 'Nasreen',
                'last_name': 'Akter',
                'service_type': 'guide',
                'specialties': 'historical sites, heritage tours, archaeology',
                'languages': 'english,bengali,arabic',
                'description': 'Historical sites expert with deep knowledge of Bangladesh\'s heritage.',
                'price_per_day': 2000.00,
                'rating': 4.9,
                'reviews_count': 56,
            },
            {
                'username': 'jamal_guide',
                'email': 'jamal@example.com',
                'first_name': 'Jamal',
                'last_name': 'Uddin',
                'service_type': 'guide',
                'specialties': 'local culture, traditional crafts, festivals',
                'languages': 'english,bengali',
                'description': 'Local culture guide specializing in traditional crafts and festivals.',
                'price_per_day': 1000.00,
                'rating': 4.5,
                'reviews_count': 22,
            },
        ]

        for guide_data in tour_guides_data:
            username = guide_data.pop('username')
            email = guide_data.pop('email')
            first_name = guide_data.pop('first_name')
            last_name = guide_data.pop('last_name')
            description = guide_data.pop('description')
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
            
            if created:
                user.set_password('password123')
                user.save()
            
            guide, guide_created = TourGuide.objects.get_or_create(
                user=user,
                defaults={
                    **guide_data,
                    'bio': description,
                    'is_available': True,
                }
            )
            
            # Add destinations to guide
            if guide_created or guide.destinations.count() == 0:
                # Assign different destinations to each guide for better search coverage
                if guide.user.username == 'rahim_guide':
                    guide.destinations.set([destinations[0], destinations[1]])  # Bagerhat, Bandarban
                elif guide.user.username == 'fatima_guide':
                    guide.destinations.set([destinations[2], destinations[3]])  # Bhawal National Park, Chittagong
                elif guide.user.username == 'karim_guide':
                    guide.destinations.set([destinations[4], destinations[5]])  # Cox's Bazar, Dhaka
                elif guide.user.username == 'nasreen_guide':
                    guide.destinations.set([destinations[6], destinations[7]])  # Khagrachari, Kuakata
                elif guide.user.username == 'jamal_guide':
                    guide.destinations.set([destinations[8], destinations[9]])  # Paharpur, Rangamati
            
            if guide_created:
                self.stdout.write(self.style.SUCCESS(f'Created Tour Guide: {user.get_full_name()}'))
            else:
                self.stdout.write(self.style.WARNING(f'Updated Tour Guide: {user.get_full_name()}'))

        # Seed Boat Charters
        boat_charters_data = [
            {
                'name': 'Sea Explorer',
                'boat_type': 'speedboat',
                'description': 'Fast and comfortable speedboat for coastal tours and river cruises.',
                'capacity': 8,
                'price_per_hour': 3000.00,
                'rating': 4.7,
                'reviews_count': 35,
            },
            {
                'name': 'Fishing King',
                'boat_type': 'fishing_boat',
                'description': 'Traditional fishing boat for authentic fishing experiences.',
                'capacity': 6,
                'price_per_hour': 2000.00,
                'rating': 4.5,
                'reviews_count': 28,
            },
            {
                'name': 'Luxury Yacht BD',
                'boat_type': 'yacht',
                'description': 'Premium yacht for luxury cruises and special occasions.',
                'capacity': 12,
                'price_per_hour': 8000.00,
                'rating': 4.9,
                'reviews_count': 42,
            },
            {
                'name': 'Traditional Sail',
                'boat_type': 'sailboat',
                'description': 'Traditional sailboat for peaceful river journeys.',
                'capacity': 10,
                'price_per_hour': 3500.00,
                'rating': 4.6,
                'reviews_count': 31,
            },
            {
                'name': 'River Cruiser',
                'boat_type': 'speedboat',
                'description': 'Comfortable river cruiser for long-distance river tours.',
                'capacity': 15,
                'price_per_hour': 5000.00,
                'rating': 4.8,
                'reviews_count': 38,
            },
        ]

        for charter_data in boat_charters_data:
            charter, created = BoatCharter.objects.get_or_create(
                name=charter_data['name'],
                defaults={**charter_data, 'destination': destinations[0], 'is_available': True}
            )
            # Update destination for variety
            if charter.name == 'Sea Explorer':
                charter.destination = destinations[4]  # Cox's Bazar
            elif charter.name == 'Fishing King':
                charter.destination = destinations[5]  # Dhaka
            elif charter.name == 'Luxury Yacht BD':
                charter.destination = destinations[2]  # Bhawal National Park
            elif charter.name == 'Traditional Sail':
                charter.destination = destinations[3]  # Chittagong
            elif charter.name == 'River Cruiser':
                charter.destination = destinations[1]  # Bandarban
            charter.save()
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Boat Charter: {charter.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Updated Boat Charter: {charter.name}'))

        # Seed Vehicle Rentals
        vehicle_rentals_data = [
            {
                'name': 'Comfort Sedan',
                'vehicle_type': 'car',
                'description': 'Comfortable sedan for city tours and short trips.',
                'capacity': 4,
                'price_per_day': 3000.00,
                'rating': 4.6,
                'reviews_count': 45,
            },
            {
                'name': 'Family SUV',
                'vehicle_type': 'suv',
                'description': 'Spacious SUV perfect for family trips and group travel.',
                'capacity': 7,
                'price_per_day': 5000.00,
                'rating': 4.8,
                'reviews_count': 52,
            },
            {
                'name': 'Group Microbus',
                'vehicle_type': 'van',
                'description': 'Large microbus for group tours and corporate events.',
                'capacity': 12,
                'price_per_day': 7000.00,
                'rating': 4.7,
                'reviews_count': 38,
            },
            {
                'name': 'Adventure Bike',
                'vehicle_type': 'motorcycle',
                'description': 'Powerful motorcycle for adventure tours and off-road trips.',
                'capacity': 2,
                'price_per_day': 1500.00,
                'rating': 4.5,
                'reviews_count': 28,
            },
            {
                'name': 'Premium Sedan',
                'vehicle_type': 'car',
                'description': 'Luxury sedan for business travel and VIP guests.',
                'capacity': 4,
                'price_per_day': 6000.00,
                'rating': 4.9,
                'reviews_count': 35,
            },
        ]

        for rental_data in vehicle_rentals_data:
            rental, created = VehicleRental.objects.get_or_create(
                name=rental_data['name'],
                defaults={**rental_data, 'destination': destinations[0], 'is_available': True}
            )
            # Update destination for variety
            if rental.name == 'Comfort Sedan':
                rental.destination = destinations[6]  # Khagrachari
            elif rental.name == 'Family SUV':
                rental.destination = destinations[7]  # Kuakata
            elif rental.name == 'Group Microbus':
                rental.destination = destinations[8]  # Paharpur
            elif rental.name == 'Adventure Bike':
                rental.destination = destinations[9]  # Rangamati
            elif rental.name == 'Premium Sedan':
                rental.destination = destinations[10] if len(destinations) > 10 else destinations[0]  # Sylhet or fallback
            rental.save()
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Vehicle Rental: {rental.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Updated Vehicle Rental: {rental.name}'))

        self.stdout.write(
            self.style.SUCCESS(
                '\nSummary: Sample data seeded for Tour Guides, Boat Charters, and Vehicle Rentals'
            )
        )
