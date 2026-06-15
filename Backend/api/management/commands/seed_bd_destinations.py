from django.core.management.base import BaseCommand
from api.models import Destination


class Command(BaseCommand):
    help = 'Seed Bangladesh destinations for search suggestions'

    def handle(self, *args, **kwargs):
        bd_destinations = [
            {
                'slug': 'dhaka',
                'name': 'Dhaka',
                'region': 'Central',
                'category': 'City',
                'budget': 'Low',
                'rating': 4.2,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'The capital city of Bangladesh, known for its rich history and culture.',
                'description': 'Dhaka is the capital and largest city of Bangladesh. It is a major cultural, economic, and political center. Key attractions include Lalbagh Fort, Ahsan Manzil, and the National Museum.',
                'hero': '',
                'coords_lat': 23.8103,
                'coords_lng': 90.4125
            },
            {
                'slug': 'chittagong',
                'name': 'Chittagong',
                'region': 'Southeast',
                'category': 'City',
                'budget': 'Medium',
                'rating': 4.3,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'Bangladesh\'s second largest city and main port.',
                'description': 'Chittagong is a major coastal city and seaport. It serves as the gateway to the hill districts and Cox\'s Bazar.',
                'hero': '',
                'coords_lat': 22.3569,
                'coords_lng': 91.7832
            },
            {
                'slug': 'sylhet',
                'name': 'Sylhet',
                'region': 'Northeast',
                'category': 'City',
                'budget': 'Medium',
                'rating': 4.5,
                'duration': '2-3 days',
                'season': 'Year-round',
                'summary': 'Known for tea gardens and natural beauty.',
                'description': 'Sylhet is famous for its tea gardens, rolling hills, and religious sites. It\'s home to the famous Ratargul Swamp Forest and Jaflong.',
                'hero': '',
                'coords_lat': 24.9043,
                'coords_lng': 91.8607
            },
            {
                'slug': 'coxs-bazar',
                'name': 'Cox\'s Bazar',
                'region': 'Southeast',
                'category': 'Beach',
                'budget': 'Medium',
                'rating': 4.7,
                'duration': '3-4 days',
                'season': 'Winter',
                'summary': 'World\'s longest natural sea beach.',
                'description': 'Cox\'s Bazar is home to the world\'s longest natural sea beach, stretching 120 kilometers. It\'s a popular tourist destination with beautiful sunsets and fresh seafood.',
                'hero': '',
                'coords_lat': 21.4272,
                'coords_lng': 92.0058
            },
            {
                'slug': 'saint-martin',
                'name': 'Saint Martin',
                'region': 'Southeast',
                'category': 'Island',
                'budget': 'High',
                'rating': 4.8,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'Bangladesh\'s only coral island.',
                'description': 'Saint Martin Island is the only coral island in Bangladesh. It offers pristine beaches, crystal clear water, and excellent snorkeling opportunities.',
                'hero': '',
                'coords_lat': 20.6333,
                'coords_lng': 92.3167
            },
            {
                'slug': 'sajek-valley',
                'name': 'Sajek Valley',
                'region': 'Rangamati',
                'category': 'Hill',
                'budget': 'Medium',
                'rating': 4.6,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'Beautiful valley in the hill tracts.',
                'description': 'Sajek Valley is known for its stunning mountain views, cloud-covered peaks, and indigenous culture. It\'s one of the most popular tourist destinations in the Chittagong Hill Tracts.',
                'hero': '',
                'coords_lat': 23.3833,
                'coords_lng': 92.2167
            },
            {
                'slug': 'rangamati',
                'name': 'Rangamati',
                'region': 'Chittagong Hill Tracts',
                'category': 'Lake',
                'budget': 'Medium',
                'rating': 4.4,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'Lake district of Bangladesh.',
                'description': 'Rangamati is known for Kaptai Lake, the largest man-made lake in Bangladesh. It offers boat rides, indigenous culture, and scenic beauty.',
                'hero': '',
                'coords_lat': 22.6333,
                'coords_lng': 92.1833
            },
            {
                'slug': 'bandarban',
                'name': 'Bandarban',
                'region': 'Chittagong Hill Tracts',
                'category': 'Hill',
                'budget': 'Medium',
                'rating': 4.5,
                'duration': '3-4 days',
                'season': 'Winter',
                'summary': 'Home to the highest peaks in Bangladesh.',
                'description': 'Bandarban is known for its tribal culture, waterfalls, and hiking trails. It\'s home to Keokradong and Tahjindong, the highest peaks in Bangladesh.',
                'hero': '',
                'coords_lat': 22.2000,
                'coords_lng': 92.2167
            },
            {
                'slug': 'khagrachari',
                'name': 'Khagrachari',
                'region': 'Chittagong Hill Tracts',
                'category': 'Hill',
                'budget': 'Medium',
                'rating': 4.3,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'Known for its natural beauty and tribal culture.',
                'description': 'Khagrachari is famous for Alutila Cave, Richhang waterfall, and its diverse indigenous communities.',
                'hero': '',
                'coords_lat': 23.1167,
                'coords_lng': 91.9833
            },
            {
                'slug': 'sundarbans',
                'name': 'Sundarbans',
                'region': 'Southwest',
                'category': 'Forest',
                'budget': 'High',
                'rating': 4.7,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'World\'s largest mangrove forest.',
                'description': 'The Sundarbans is the largest mangrove forest in the world, home to the Royal Bengal Tiger. It\'s a UNESCO World Heritage Site.',
                'hero': '',
                'coords_lat': 21.9497,
                'coords_lng': 89.1833
            },
            {
                'slug': 'kuakata',
                'name': 'Kuakata',
                'region': 'South',
                'category': 'Beach',
                'budget': 'Low',
                'rating': 4.4,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'Daughter of the Sea - known for sunrise and sunset.',
                'description': 'Kuakata is a rare beach where you can see both sunrise and sunset. It\'s located in Patuakhali district and offers a serene beach experience.',
                'hero': '',
                'coords_lat': 21.8333,
                'coords_lng': 90.1167
            },
            {
                'slug': 'paharpur',
                'name': 'Paharpur',
                'region': 'North',
                'category': 'Historical',
                'budget': 'Low',
                'rating': 4.3,
                'duration': '1 day',
                'season': 'Winter',
                'summary': 'Home to Somapura Mahavihara, a UNESCO site.',
                'description': 'Paharpur is home to Somapura Mahavihara, one of the most important archaeological sites in Bangladesh. It\'s a UNESCO World Heritage Site.',
                'hero': '',
                'coords_lat': 25.5000,
                'coords_lng': 88.9833
            },
            {
                'slug': 'mahasthangarh',
                'name': 'Mahasthangarh',
                'region': 'North',
                'category': 'Historical',
                'budget': 'Low',
                'rating': 4.2,
                'duration': '1 day',
                'season': 'Winter',
                'summary': 'Ancient archaeological site dating back to 3rd century BC.',
                'description': 'Mahasthangarh is the earliest urban archaeological site in Bangladesh, dating back to the 3rd century BC. It\'s located in Bogra district.',
                'hero': '',
                'coords_lat': 24.9667,
                'coords_lng': 89.3667
            },
            {
                'slug': 'mainamati',
                'name': 'Mainamati',
                'region': 'East',
                'category': 'Historical',
                'budget': 'Low',
                'rating': 4.1,
                'duration': '1 day',
                'season': 'Winter',
                'summary': 'Ancient Buddhist archaeological site.',
                'description': 'Mainamati is an important Buddhist archaeological site in Comilla district, featuring numerous ancient stupas and monasteries.',
                'hero': '',
                'coords_lat': 23.4500,
                'coords_lng': 91.1833
            },
            {
                'slug': 'sonargaon',
                'name': 'Sonargaon',
                'region': 'Central',
                'category': 'Historical',
                'budget': 'Low',
                'rating': 4.0,
                'duration': '1 day',
                'season': 'Winter',
                'summary': 'Ancient capital of Bengal.',
                'description': 'Sonargaon was the ancient capital of Bengal. It features Panam City, a historic trading center with preserved Mughal-era buildings.',
                'hero': '',
                'coords_lat': 23.6333,
                'coords_lng': 90.6167
            },
            {
                'slug': 'bagerhat',
                'name': 'Bagerhat',
                'region': 'Southwest',
                'category': 'Historical',
                'budget': 'Low',
                'rating': 4.4,
                'duration': '1-2 days',
                'season': 'Winter',
                'summary': 'Home to the Sixty Dome Mosque, a UNESCO site.',
                'description': 'Bagerhat is home to the Sixty Dome Mosque (Shat Gombuj Masjid), a UNESCO World Heritage Site built by Khan Jahan Ali.',
                'hero': '',
                'coords_lat': 22.6500,
                'coords_lng': 89.7833
            },
            {
                'slug': 'mymensingh',
                'name': 'Mymensingh',
                'region': 'North',
                'category': 'City',
                'budget': 'Low',
                'rating': 4.1,
                'duration': '1-2 days',
                'season': 'Winter',
                'summary': 'Known for educational institutions and rural beauty.',
                'description': 'Mymensingh is known for Bangladesh Agricultural University and beautiful rural landscapes. It\'s a gateway to the Garo Hills.',
                'hero': '',
                'coords_lat': 24.7333,
                'coords_lng': 90.4167
            },
            {
                'slug': 'srimangal',
                'name': 'Srimangal',
                'region': 'Sylhet',
                'category': 'Nature',
                'budget': 'Medium',
                'rating': 4.5,
                'duration': '2-3 days',
                'season': 'Year-round',
                'summary': 'Tea capital of Bangladesh.',
                'description': 'Srimangal is known as the tea capital of Bangladesh. It features lush tea gardens, Lawachara National Park, and the Seven Colored Tea Garden.',
                'hero': '',
                'coords_lat': 24.3167,
                'coords_lng': 91.7333
            },
            {
                'slug': 'madhabkunda',
                'name': 'Madhabkunda',
                'region': 'Sylhet',
                'category': 'Waterfall',
                'budget': 'Low',
                'rating': 4.3,
                'duration': '1 day',
                'season': 'Monsoon',
                'summary': 'Largest waterfall in Bangladesh.',
                'description': 'Madhabkunda is the largest waterfall in Bangladesh, located in Moulvibazar district. It\'s surrounded by tea gardens and hills.',
                'hero': '',
                'coords_lat': 24.5667,
                'coords_lng': 91.8333
            },
            {
                'slug': 'jaflong',
                'name': 'Jaflong',
                'region': 'Sylhet',
                'category': 'Nature',
                'budget': 'Low',
                'rating': 4.4,
                'duration': '1 day',
                'season': 'Year-round',
                'summary': 'Known for stone collection and natural beauty.',
                'description': 'Jaflong is known for its stone collection activities and scenic beauty. It\'s located near the Meghalaya border.',
                'hero': '',
                'coords_lat': 25.1500,
                'coords_lng': 91.8833
            },
            {
                'slug': 'hakaluki-haor',
                'name': 'Hakaluki Haor',
                'region': 'Sylhet',
                'category': 'Wetland',
                'budget': 'Low',
                'rating': 4.2,
                'duration': '1 day',
                'season': 'Winter',
                'summary': 'One of the largest haors in Bangladesh.',
                'description': 'Hakaluki Haor is one of the largest wetlands in Bangladesh, important for biodiversity and migratory birds.',
                'hero': '',
                'coords_lat': 24.5667,
                'coords_lng': 91.5000
            },
            {
                'slug': 'tanguar-haor',
                'name': 'Tanguar Haor',
                'region': 'Sylhet',
                'category': 'Wetland',
                'budget': 'Medium',
                'rating': 4.5,
                'duration': '2-3 days',
                'season': 'Winter',
                'summary': 'UNESCO Ramsar site with rich biodiversity.',
                'description': 'Tanguar Haor is a Ramsar site known for its rich biodiversity and importance for migratory birds.',
                'hero': '',
                'coords_lat': 25.0833,
                'coords_lng': 91.6667
            },
            {
                'slug': 'lawachara-national-park',
                'name': 'Lawachara National Park',
                'region': 'Sylhet',
                'category': 'Forest',
                'budget': 'Medium',
                'rating': 4.4,
                'duration': '1 day',
                'season': 'Year-round',
                'summary': 'Tropical forest with diverse wildlife.',
                'description': 'Lawachara National Park is a tropical forest home to diverse wildlife including hoolock gibbons and various bird species.',
                'hero': '',
                'coords_lat': 24.3833,
                'coords_lng': 91.7500
            },
            {
                'slug': 'bhawal-national-park',
                'name': 'Bhawal National Park',
                'region': 'Central',
                'category': 'Forest',
                'budget': 'Low',
                'rating': 4.0,
                'duration': '1 day',
                'season': 'Winter',
                'summary': 'National park near Dhaka.',
                'description': 'Bhawal National Park is located in Gazipur district, offering a natural escape near Dhaka with diverse flora and fauna.',
                'hero': '',
                'coords_lat': 24.0333,
                'coords_lng': 90.4167
            },
        ]

        created_count = 0
        updated_count = 0

        for dest_data in bd_destinations:
            dest, created = Destination.objects.update_or_create(
                slug=dest_data['slug'],
                defaults=dest_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created: {dest.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'Updated: {dest.name}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} destinations created, {updated_count} destinations updated'
            )
        )
