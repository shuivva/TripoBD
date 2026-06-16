import os
import sys
import django

# Add the Backend directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from api.models import UserProfile, ServiceProvider

def create_or_update_provider(username, full_name, service_type, destinations, languages, fee_range, experience):
    print(f"Processing provider {username}...")
    
    # 1. Create/get User
    user, created = User.objects.get_or_create(username=username)
    if created or not user.password:
        user.password = make_password('Guide@123')
        user.email = f"{username}@tripobd.com"
        user.save()
        print(f"Created user {username}")
    else:
        user.email = f"{username}@tripobd.com"
        user.save()
        print(f"Updated user {username}")
        
    # 2. Create/get UserProfile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'full_name': full_name,
            'phone_number': "01700000000",
            'date_of_birth': "1990-01-01",
            'gender': "male",
            'division': "dhaka",
            'district': "dhaka",
            'user_type': "service_provider",
            'is_email_verified': True
        }
    )
    if not created:
        profile.full_name = full_name
        profile.user_type = "service_provider"
        profile.is_email_verified = True
        profile.save()
    print(f"Set UserProfile for {username}")
    
    # 3. Create/get ServiceProvider
    sp, created = ServiceProvider.objects.get_or_create(
        user=user,
        defaults={
            'service_type': service_type,
            'specialized_destinations': destinations,
            'years_of_experience': experience,
            'languages_offered': languages,
            'fee_range': fee_range,
            'bank_account_details': "bKash: 01700000000",
            'is_verified': True,
            'nid_scan': "nid_scans/dummy.jpg"
        }
    )
    if not created:
        sp.service_type = service_type
        sp.specialized_destinations = destinations
        sp.languages_offered = languages
        sp.fee_range = fee_range
        sp.years_of_experience = experience
        sp.is_verified = True
        sp.save()
    print(f"Set ServiceProvider profile for {username} (Type: {service_type})")
    print("-" * 40)

def main():
    # guide1
    create_or_update_provider(
        username="guide1",
        full_name="Tour Guide One",
        service_type="tour_guide",
        destinations="Sajek, Bandarban, Cox's Bazar",
        languages="Bangla, English",
        fee_range="3000 BDT/day",
        experience=5
    )
    
    # boat1
    create_or_update_provider(
        username="boat1",
        full_name="Kalam Boat Operator",
        service_type="boat_operator",
        destinations="Kaptai Lake, Rangamati, Sundarbans",
        languages="Bangla, English",
        fee_range="2500 BDT/day",
        experience=5
    )
    
    # vehicle1
    create_or_update_provider(
        username="vehicle1",
        full_name="Rahim Rental Host",
        service_type="vehicle_rental",
        destinations="Dhaka, Chittagong, Sylhet",
        languages="Bangla, English",
        fee_range="3500 BDT/day",
        experience=4
    )
    
    # photo1
    create_or_update_provider(
        username="photo1",
        full_name="Imtiaz Photographer",
        service_type="photography",
        destinations="Srimangal, Sajek, Cox's Bazar",
        languages="Bangla, English",
        fee_range="4000 BDT/day",
        experience=3
    )

if __name__ == '__main__':
    main()
