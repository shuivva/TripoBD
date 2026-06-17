import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import (
    AppStat, ValueCard, LandingStory, FAQCategory, FAQItem, VideoTutorial,
    AboutFeature, AboutPainPoint, Destination
)

def populate():
    print("Populating AppStats...")
    stats = [
        {'label': 'Destinations Listed', 'value': 128},
        {'label': 'Active Tour Groups', 'value': 64},
        {'label': 'Verified Guides', 'value': 42},
        {'label': 'Community Members', 'value': 9800},
    ]
    for s in stats:
        AppStat.objects.get_or_create(label=s['label'], defaults={'value': s['value']})

    print("Populating ValueCards...")
    cards = [
        {'title': 'All-in-One Planning', 'description': 'Build itineraries, budgets and group plans in one place.'},
        {'title': 'Group Coordination', 'description': 'Invite travelers, split tasks and stay synced with your crew.'},
        {'title': 'Local Expertise', 'description': 'Trusted local guides and insider tips for every destination.'},
        {'title': 'Budget-Friendly', 'description': 'Compare options and keep your trip affordable without sacrifice.'},
    ]
    for c in cards:
        ValueCard.objects.get_or_create(title=c['title'], defaults={'description': c['description']})

    print("Populating LandingStories...")
    stories = [
        {
            'title': 'Sundarbans Adventure With Friends',
            'summary': 'A sunrise boat safari with expert guides and a community camping plan.',
            'image': 'https://images.unsplash.com/photo-1516542076529-1ea3854896f4?auto=format&fit=crop&w=1200&q=80',
            'location': 'Sundarbans',
            'rating': 4.9
        },
        {
            'title': 'Beach Escape at Cox’s Bazar',
            'summary': 'A weekend group book that covered food, ferry, and a guided beach walk.',
            'image': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            'location': 'Cox\'s Bazar',
            'rating': 4.8
        },
        {
            'title': 'Tea Trails in Sreemangal',
            'summary': 'A family trip with local homestays and a curated tea garden itinerary.',
            'image': 'https://images.unsplash.com/photo-1541364983171-a8ba01b7cb11?auto=format&fit=crop&w=1200&q=80',
            'location': 'Sreemangal',
            'rating': 4.7
        }
    ]
    for s in stories:
        LandingStory.objects.get_or_create(title=s['title'], defaults=s)

    print("Populating VideoTutorials...")
    tutorials = [
        {
            'title': 'Getting Started with TripoBD',
            'duration': '3:45',
            'thumbnail': 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
            'description': 'Learn how to create an account and navigate the platform'
        },
        {
            'title': 'Planning Your First Trip',
            'duration': '5:20',
            'thumbnail': 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
            'description': 'Step-by-step guide to searching and booking destinations'
        },
        {
            'title': 'Using Tour Groups',
            'duration': '4:15',
            'thumbnail': 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg',
            'description': 'How to join or create travel groups with friends'
        }
    ]
    for t in tutorials:
        VideoTutorial.objects.get_or_create(title=t['title'], defaults=t)

    print("Populating AboutFeatures...")
    features = [
        {
            'icon': '🗺️',
            'title': 'Smart Discovery',
            'description': 'Curated destinations with local insights, weather forecasts, and budget estimates all in one place.'
        },
        {
            'icon': '👥',
            'title': 'Group Trip Planning',
            'description': 'Invite friends, assign tasks, coordinate bookings, and manage itineraries together seamlessly.'
        },
        {
            'icon': '🤖',
            'title': 'AI Travel Assistant',
            'description': 'Get instant recommendations for routes, local tips, and custom itineraries from our smart AI.'
        },
        {
            'icon': '🧭',
            'title': 'Local Guides & Safety',
            'description': 'Connect with verified local guides and access real-time safety advisories for offbeat paths.'
        }
    ]
    for f in features:
        AboutFeature.objects.get_or_create(title=f['title'], defaults=f)

    print("Populating AboutPainPoints...")
    pain_points = [
        {
            'n': '01',
            'icon': '🗺️',
            'title': 'Fragmented Info',
            'description': 'Difficulty finding reliable and centralized destination information in one place.'
        },
        {
            'n': '02',
            'icon': '🚌',
            'title': 'Transit Confusion',
            'description': 'Lack of clear, up-to-date transportation routes and schedules across districts.'
        },
        {
            'n': '03',
            'icon': '🗣️',
            'title': 'Language Barriers',
            'description': 'Struggling with local dialects when navigating rural and off-the-beaten-path areas.'
        },
        {
            'n': '04',
            'icon': '🏨',
            'title': 'Accommodation Issues',
            'description': 'Hard to find and verify authentic, safe stays outside the major city centres.'
        },
        {
            'n': '05',
            'icon': '🔒',
            'title': 'Safety Concerns',
            'description': 'Uncertainty regarding safe travel times and zones for both local and foreign tourists.'
        }
    ]
    for p in pain_points:
        AboutPainPoint.objects.get_or_create(title=p['title'], defaults=p)

    print("Populating FAQ Categories & Items...")
    faq_data = [
        { 'category': 'Registration', 'question': 'How do I create an account on TripoBD?', 'answer': 'Click the "Sign Up" button in the top right corner of the homepage. Fill in your name, email address, and create a password. You\'ll receive a verification email to activate your account.' },
        { 'category': 'Registration', 'question': 'Is registration free?', 'answer': 'Yes, creating an account on TripoBD is completely free. You can browse destinations, plan trips, and join groups without any subscription fees.' },
        { 'category': 'Trip Planning', 'question': 'How do I search for destinations?', 'answer': 'Use the search bar on the homepage to enter your desired destination. You can filter by category (Beaches, Hills, Forests, City) and browse through our curated list of destinations across Bangladesh.' },
        { 'category': 'Trip Planning', 'question': 'Can I save my favorite destinations?', 'answer': 'Yes! Simply click the "Save" button on any destination card. Your saved destinations will appear in your profile under "Saved Trips" for easy access later.' },
        { 'category': 'Payments', 'question': 'What payment methods do you accept?', 'answer': 'We accept bKash, Nagad, Rocket, credit/debit cards (Visa, Mastercard), and bank transfers. All transactions are secured with SSL encryption.' },
        { 'category': 'Payments', 'question': 'Is my payment information secure?', 'answer': 'Absolutely. We use industry-standard SSL encryption and comply with PCI DSS standards. We never store your complete card details on our servers.' },
        { 'category': 'Tour Groups', 'question': 'How do I join a tour group?', 'answer': 'Browse available tour groups on the Discover page, select one that matches your preferences, and click "Join Group". You\'ll need to be logged in to participate.' },
        { 'category': 'Tour Groups', 'question': 'Can I create my own tour group?', 'answer': 'Yes! After logging in, go to "My Groups" and click "Create New Group". You can invite friends, set trip dates, and coordinate your travel plans together.' },
        { 'category': 'Local Guides', 'question': 'How do I book a local guide?', 'answer': 'On the destination detail page, you\'ll find available local guides with ratings and reviews. Select your preferred guide, choose your dates, and complete the booking process.' },
        { 'category': 'Local Guides', 'question': 'Are local guides verified?', 'answer': 'All local guides on TripoBD undergo a verification process including ID verification, background checks, and skills assessment to ensure quality and safety.' },
        { 'category': 'Safety', 'question': 'What safety measures does TripoBD recommend?', 'answer': 'We recommend traveling in groups, keeping emergency contacts handy, using verified guides, and checking travel advisories. Each destination page includes specific safety tips.' },
        { 'category': 'Safety', 'question': 'What should I do in case of an emergency?', 'answer': 'In emergencies, call Bangladesh\'s national emergency number 999. For travel-specific issues, contact our 24/7 support hotline or use the in-app emergency feature.' },
        { 'category': 'App', 'question': 'Is TripoBD available on mobile?', 'answer': 'Yes! Download our app from Google Play or the App Store. The mobile app offers all features of the website plus offline maps and real-time notifications.' },
        { 'category': 'App', 'question': 'Can I use the app offline?', 'answer': 'The app supports offline mode for saved destinations and downloaded maps. You\'ll need an internet connection for booking, real-time updates, and group collaboration.' },
        { 'category': 'Permits', 'question': 'Do I need a permit to visit the Chittagong Hill Tracts?', 'answer': 'Yes, foreign nationals require a permit from the Deputy Commissioner\'s office to visit Rangamati, Bandarban, and Khagrachhari. TripoBD assists in arranging these permits for our tour group members. Local tourists generally do not need permits for Sajek or Nilgiri but should carry valid National ID.' },
        { 'category': 'Permits', 'question': 'How do I get permission for the Sundarbans?', 'answer': 'To visit the Sundarbans, you need a permit from the Divisional Forest Officer. If you book a TripoBD tour or guide, we handle all necessary permissions and boat clearances for you.' },
        { 'category': 'Transport', 'question': 'Can I book train or launch tickets through TripoBD?', 'answer': 'Yes! We partner with Bangladesh Railway and major launch operators. When planning your trip, you can seamlessly book AC/Snigdha train tickets and premium cabin launches directly through the platform.' },
        { 'category': 'Trip Planning', 'question': 'When is the best time to visit Bangladesh?', 'answer': 'The ideal tourist season is from October to March (Winter), offering pleasant weather. For the Sundarbans, November to January is best. If you love lush greenery and waterfalls in Sajek or Bandarban, the monsoon (June-September) is beautiful, but expect heavy rain.' },
    ]
    for item in faq_data:
        cat_name = item['category']
        category_obj, _ = FAQCategory.objects.get_or_create(name=cat_name)
        FAQItem.objects.get_or_create(
            category=category_obj,
            question=item['question'],
            defaults={'answer': item['answer']}
        )

    print("Updating Destinations with guide settings...")
    destination_guides = {
        'sundarbans': {
            'tagline': 'UNESCO mangrove wilderness',
            'best_for': 'Wildlife lovers, photographers, and eco-travelers',
            'highlights': ['Sunrise boat safari', 'Watchtower wildlife spotting', 'Mangrove trail walk'],
            'tips': 'Book a licensed guide and keep at least one full day for river exploration.',
            'is_featured': True
        },
        'coxs-bazar': {
            'tagline': 'The longest sea beach experience',
            'best_for': 'Family holidays and relaxed beach escapes',
            'highlights': ['Laboni and Inani Beach', 'Marine Drive sunset views', 'Fresh seafood markets'],
            'tips': 'Visit in the early morning for quieter beaches and better photo light.',
            'is_featured': True
        },
        'sajek': {
            'tagline': 'Cloud-kissed valley retreat',
            'best_for': 'Couples, friends, and weekend mountain seekers',
            'highlights': ['Konglak viewpoint', 'Misty sunrise', 'Local village culture'],
            'tips': 'Start your final uphill ride before noon to avoid low-visibility weather.',
            'is_featured': True
        },
        'bandarban': {
            'tagline': 'Adventure in the hill tracts',
            'best_for': 'Trekkers and nature adventure groups',
            'highlights': ['Nilgiri viewpoint', 'Waterfall trekking', 'Tribal village visits'],
            'tips': 'Carry grip-friendly shoes and verify road conditions before departure.',
            'is_featured': True,
            'is_spotlight': True
        },
        'sreemangal': {
            'tagline': 'Tea capital of Bangladesh',
            'best_for': 'Slow travel, nature walks, and family-friendly trips',
            'highlights': ['Tea estate cycling', 'Lawachara forest trails', 'Seven-layer tea tasting'],
            'tips': 'Plan a two-night stay to cover both tea gardens and forest areas comfortably.',
            'is_featured': True
        },
    }

    for slug, guide in destination_guides.items():
        Destination.objects.filter(slug=slug).update(
            tagline=guide['tagline'],
            best_for=guide['best_for'],
            highlights=guide['highlights'],
            tips=guide['tips'],
            is_featured=guide['is_featured'],
            is_spotlight=guide.get('is_spotlight', False)
        )

    print("Initial population completed successfully!")

if __name__ == '__main__':
    populate()
