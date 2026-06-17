from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, F
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.core.mail import send_mail
from django.conf import settings
import traceback
from django.utils import timezone
from .models import (
    Destination,
    Guide,
    Route,
    UserProfile,
    OTPVerification,
    ServiceProvider,
    AccountSettings,
    TravelPreferences,
    TravelStats,
    TourRoom,
    TourRoomMembership,
    AIChatSession,
    AIChatMessage,
    NotificationPreferences,
    DestinationReview,
    AccommodationReview,
    ServiceProviderBooking,
    ServiceProviderReview,
    TourRoomActivity,
    TourRoomBookingNote,
    TourRoomChatMessage,
    TourRoomChecklistItem,
    TourRoomExpense,
    TourRoomExpenseParticipant,
    TourRoomMapPin,
    TourRoomPoll,
    TourRoomPollOption,
    TourRoomPollVote,
    TourRoomInvite,
    TravelerNotification,
    TripStory,
    Wishlist,
    Accommodation,
    SystemConfig,
    FAQCategory,
    FAQItem,
    VideoTutorial,
    LandingStory,
    AppStat,
    ValueCard,
    AboutFeature,
    AboutPainPoint,
    ContactMessage,
    BlockedUser,
    DisplaySettings,
    AppFeedback,
    BugReport,
    SupportTicket,
)
from .dashboard import build_traveler_dashboard
from .serializers import (
    DestinationListSerializer,
    DestinationDetailSerializer,
    GuideSerializer,
    RouteSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    OTPVerificationSerializer,
    ServiceProviderSerializer,
    TravelerProfileSerializer,
    TravelPreferencesSerializer,
    AccountSettingsSerializer,
    AIChatMessageSerializer,
    AIChatSessionSerializer,
    DestinationReviewSerializer,
    AccommodationReviewSerializer,
    ServiceProviderBookingSerializer,
    ServiceProviderReviewSerializer,
    NotificationPreferencesSerializer,
    TourRoomActivitySerializer,
    TourRoomBookingNoteSerializer,
    TourRoomChatMessageSerializer,
    TourRoomChecklistItemSerializer,
    TourRoomExpenseParticipantSerializer,
    TourRoomExpenseSerializer,
    TourRoomMapPinSerializer,
    TourRoomPollOptionSerializer,
    TourRoomPollSerializer,
    TourRoomInviteSerializer,
    TourRoomSerializer,
    TripStorySerializer,
    WishlistSerializer,
    FAQCategorySerializer,
    FAQItemSerializer,
    VideoTutorialSerializer,
    LandingStorySerializer,
    AppStatSerializer,
    ValueCardSerializer,
    AboutFeatureSerializer,
    AboutPainPointSerializer,
    ContactMessageSerializer,
    BlockedUserSerializer,
    DisplaySettingsSerializer,
    AppFeedbackSerializer,
    BugReportSerializer,
    SupportTicketSerializer,
)


@api_view(['POST'])
def login_view(request):
    identifier = request.data.get('identifier')
    password = request.data.get('password')

    if not identifier or not password:
        return Response({'error': 'Identifier and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Try authenticating directly by username
    user = authenticate(request, username=identifier, password=password)

    # If not found and identifier looks like an email, try resolving username by email
    if user is None and '@' in identifier:
        try:
            u = User.objects.filter(email__iexact=identifier).first()
            if u:
                user = authenticate(request, username=u.username, password=password)
        except Exception:
            user = None

    if user is not None:
        # Optionally create a session
        try:
            login(request, user)
        except Exception:
            pass
            
        from .models import UserProfile
        profile = UserProfile.objects.filter(user=user).first()
        user_type = profile.user_type if profile else None
        is_admin = user.is_staff or user.is_superuser
        
        return Response({
            'message': 'Login successful',
            'user_id': user.id,
            'username': user.username,
            'user_type': user_type,
            'is_admin': is_admin
        }, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_view(request):
    try:
        logout(request)
    except Exception:
        pass
    return Response({'message': 'Logged out'}, status=status.HTTP_200_OK)


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
    def get_clean_distinct(field):
        vals = Destination.objects.exclude(**{f"{field}__isnull": True}).values_list(field, flat=True).order_by().distinct()
        cleaned = {v.strip() for v in vals if v and isinstance(v, str) and v.strip()}
        if not cleaned and vals:
            cleaned = {v for v in vals if v is not None}
        return sorted(list(cleaned))

    return Response(
        {
            'regions': get_clean_distinct('region'),
            'categories': get_clean_distinct('category'),
            'seasons': get_clean_distinct('season'),
            'durations': get_clean_distinct('duration'),
            'budgets': get_clean_distinct('budget'),
        }
    )


@api_view(['POST'])
def register_traveler(request):
    user_serializer = UserRegistrationSerializer(data=request.data)
    if user_serializer.is_valid():
        user = user_serializer.save()
        
        # Create user profile
        profile_data = {
            'user': user.id,
            'full_name': request.data.get('full_name'),
            'phone_number': request.data.get('phone_number'),
            'date_of_birth': request.data.get('date_of_birth'),
            'gender': request.data.get('gender'),
            'division': request.data.get('division'),
            'district': request.data.get('district'),
            'profile_photo': request.data.get('profile_photo'),
            'national_id': request.data.get('national_id'),
            'user_type': 'traveler',
        }
        
        profile_serializer = UserProfileSerializer(data=profile_data)
        if profile_serializer.is_valid():
            profile = profile_serializer.save()
            TravelPreferences.objects.create(user_profile=profile)
            TravelStats.objects.create(user_profile=profile)
            AccountSettings.objects.create(user_profile=profile)
            
            # Generate and send OTP
            import random
            otp = str(random.randint(100000, 999999))
            OTPVerification.objects.create(user=user, otp=otp)
            # Print OTP to server console for easier local testing
            if settings.DEBUG:
                print(f"[DEBUG] OTP for {user.email}: {otp}")
            
            # Send OTP via email
            subject = 'Verify your email address - TripoBD'
            message = f'''
Hello {user.username},

Your OTP for email verification is: {otp}

This OTP will expire in 10 minutes.

If you did not request this verification, please ignore this email.

Best regards,
TripoBD Team
'''
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                # Log error but don't fail registration
                print(f"Email sending failed: {e}")
            
            return Response({
                'message': 'Registration successful. Please verify your email with the OTP sent.',
                'user_id': user.id,
                'email': user.email,
            }, status=status.HTTP_201_CREATED)
        else:
            user.delete()
            return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def verify_otp(request):
    email = request.data.get('email')
    otp = (request.data.get('otp') or '').strip()
    # Basic input validation
    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Directly look up OTP records by user email to avoid MultipleObjectsReturned
        otp_record = OTPVerification.objects.filter(user__email=email, otp=otp, is_used=False).order_by('-created_at').first()

        if otp_record:
            otp_record.is_used = True
            otp_record.save()

            user = otp_record.user
            if hasattr(user, 'profile'):
                user.profile.is_email_verified = True
                user.profile.save()

            return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)

        # No direct match - in DEBUG return recent OTPs for that email to aid troubleshooting
        if settings.DEBUG:
            recent = OTPVerification.objects.filter(user__email=email).order_by('-created_at')[:5]
            otps = [((r.otp or '').strip() if r.otp else None) for r in recent]
            return Response({'error': 'Invalid or expired OTP', 'recent_otps': otps}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print('verify_otp error:', e)
        traceback.print_exc()
        return Response({'error': 'Server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def register_service_provider(request):
    # Step 1: Register user
    user_data = {
        'username': request.data.get('username'),
        'email': request.data.get('email'),
        'password': request.data.get('password'),
        'confirm_password': request.data.get('confirm_password'),
    }
    
    user_serializer = UserRegistrationSerializer(data=user_data)
    if user_serializer.is_valid():
        user = user_serializer.save()
        
        # Create user profile
        profile_data = {
            'user': user.id,
            'full_name': request.data.get('full_name'),
            'phone_number': request.data.get('phone_number'),
            'date_of_birth': request.data.get('date_of_birth'),
            'gender': request.data.get('gender'),
            'division': request.data.get('division'),
            'district': request.data.get('district'),
            'profile_photo': request.data.get('profile_photo'),
            'national_id': request.data.get('national_id'),
            'user_type': 'service_provider',
        }
        
        profile_serializer = UserProfileSerializer(data=profile_data)
        if not profile_serializer.is_valid():
            user.delete()
            return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        profile = profile_serializer.save()
        AccountSettings.objects.create(user_profile=profile)
        
        # Step 2-4: Create service provider profile
        service_provider_data = {
            'user': user.id,
            'service_type': request.data.get('service_type'),
            'specialized_destinations': request.data.get('specialized_destinations'),
            'years_of_experience': request.data.get('years_of_experience'),
            'languages_offered': request.data.get('languages_offered'),
            'fee_range': request.data.get('fee_range'),
            'nid_scan': request.data.get('nid_scan'),
            'certification': request.data.get('certification'),
            'portfolio_photos': request.data.get('portfolio_photos', []),
            'bank_account_details': request.data.get('bank_account_details'),
        }
        
        sp_serializer = ServiceProviderSerializer(data=service_provider_data)
        if sp_serializer.is_valid():
            sp_serializer.save()
            # Generate and send OTP
            import random
            otp = str(random.randint(100000, 999999))
            OTPVerification.objects.create(user=user, otp=otp)
            # Print OTP to server console for easier local testing
            if settings.DEBUG:
                print(f"[DEBUG] OTP for {user.email}: {otp}")
            
            # Send OTP via email
            subject = 'Verify your email address - TripoBD'
            message = f'''
Hello {user.username},

Your OTP for email verification is: {otp}

This OTP will expire in 10 minutes.

If you did not request this verification, please ignore this email.

Best regards,
TripoBD Team
'''
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                # Log error but don't fail registration
                print(f"Email sending failed: {e}")
            
            return Response({
                'message': 'Service provider registration submitted for verification.',
                'user_id': user.id,
                'email': user.email,
            }, status=status.HTTP_201_CREATED)
        else:
            user.delete()
            return Response(sp_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _get_traveler_profile_or_404(user_id):
    profile = UserProfile.objects.filter(user_id=user_id, user_type='traveler').first()
    if not profile:
        return None
    TravelPreferences.objects.get_or_create(user_profile=profile)
    TravelStats.objects.get_or_create(user_profile=profile)
    AccountSettings.objects.get_or_create(user_profile=profile)
    return profile


@api_view(['GET'])
def traveler_dashboard(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(build_traveler_dashboard(profile, request))


@api_view(['GET'])
def traveler_profile_detail(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = TravelerProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
def traveler_profile_update(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(TravelerProfileSerializer(profile, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
def traveler_preferences_update(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

    preferences = profile.travel_preferences
    serializer = TravelPreferencesSerializer(preferences, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(TravelerProfileSerializer(profile, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
def traveler_account_settings_update(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

    settings_payload = {
        'profile_visibility': request.data.get('profile_visibility'),
        'two_factor_enabled': request.data.get('two_factor_enabled'),
    }

    if request.data.get('deactivation_requested'):
        settings_payload['deactivation_requested'] = True
        settings_payload['deactivation_requested_at'] = timezone.now()
        settings_payload['deactivation_reason'] = request.data.get('deactivation_reason', '')

    account_settings = profile.account_settings
    serializer = AccountSettingsSerializer(account_settings, data=settings_payload, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(TravelerProfileSerializer(profile, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def traveler_change_password(request, user_id):
    user = User.objects.filter(id=user_id).first()
    if not user:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    if not current_password or not new_password:
        return Response({'error': 'Current and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save(update_fields=['password'])
    return Response({'message': 'Password updated successfully'})


@api_view(['POST'])
def traveler_profile_photo_update(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

    photo = request.FILES.get('profile_photo') or request.data.get('profile_photo')
    if not photo:
        return Response({'error': 'Profile photo is required'}, status=status.HTTP_400_BAD_REQUEST)

    profile.profile_photo = photo
    profile.save(update_fields=['profile_photo'])
    return Response(TravelerProfileSerializer(profile, context={'request': request}).data)


# =====================================================================
# RESTORED AND NEW traveler views
# =====================================================================

def _generate_ai_response(prompt):
    prompt_lower = (prompt or "").lower()
    is_bangla = any(ord(c) >= 0x0980 and ord(c) <= 0x09FF for c in prompt) or "plan" not in prompt_lower and ("ভ্রমণ" in prompt_lower or "কক্সবাজার" in prompt_lower or "বান্দরবান" in prompt_lower or "সিলেট" in prompt_lower)
    
    if is_bangla:
        if "বান্দরবান" in prompt_lower or "bandarban" in prompt_lower:
            return """### বান্দরবান ৩ দিনের ভ্রমণ পরিকল্পনা (বাজেট ৫০০০ টাকা)

বান্দরবানের প্রাকৃতিক সৌন্দর্য উপভোগ করার জন্য একটি চমৎকার ট্যুর প্ল্যান নিচে দেওয়া হলো:

#### **দিন ১: নীলগিরি ও চিম্বুক পাহাড়**
* **সকাল ০৮:০০:** বান্দরবান শহরে পৌঁছানো এবং নাস্তা করা।
* **সকাল ০৯:৩০:** চান্দের গাড়িতে করে নীলগিরির উদ্দেশ্যে রওনা। (ভাড়া ৩০০০-৪০০০ টাকা গ্রুপে শেয়ারে)
* **দুপুর ১২:৩০:** চিম্বুক পাহাড় ও শৈল প্রপাত ঝর্ণা দেখা।
* **দুপুর ০২:০০:** পাহাড়ি ঐতিহ্যবাহী খাবার (বাঁশ মুরগি/Bamboo Chicken) দিয়ে দুপুরের খাবার।
* **বিকেল ০৫:০০:** শহরে ফিরে এসে hotels-এ চেক-ইন করা।

#### **দিন ২: বগা লেক ও কেওক্রাডং**
* **সকাল ০৭:০০:** রুমা বাজারের উদ্দেশ্যে রওনা।
* **সকাল ১০:০০:** রুমা বাজার থেকে গাইড নিয়ে বগা লেকের উদ্দেশ্যে যাত্রা।
* **দুপুর ০২:০০:** বগা লেকে পৌঁছানো এবং লেকের চারপাশ ঘুরে দেখা।
* **রাত ০৮:০০:** বগা লেকের পাশে পাহাড়ি কটেজে রাত্রিযাপন এবং বারবিকিউ ডিনার।

#### **দিন ৩: স্বর্ণ মন্দির ও নীলাচল**
* **সকাল ০৮:০০:** রুমা বাজার হয়ে বান্দরবান শহরে ফিরে আসা।
* **দুপুর ১২:০০:** বুদ্ধ ধাতু জাদি (স্বর্ণ মন্দির) পরিদর্শন।
* **বিকেল ০৪:০০:** নীলাচলে সূর্যাস্ত দেখা।
* **রাত ০৮:০০:** ফেরত নাইট কোচে রওনা হওয়া।

**খাবারের পরামর্শ:** বান্দরবানের স্থানীয় পাহাড়ি ফল, জুমের চালের ভাত এবং ব্যাম্বু চিকেন অবশ্যই ট্রাই করবেন।
**আবহাওয়া টিপস:** বর্ষাকালে পাহাড়ী রাস্তায় যাতায়াতের সময় সতর্ক থাকুন। রেইনকোট ও গ্রিপ জুতো সাথে রাখুন।"""

        elif "কক্সবাজার" in prompt_lower or "cox" in prompt_lower:
            return """### কক্সবাজার ভ্রমণ গাইড ও পরিকল্পনা

কক্সবাজার বিশ্বের দীর্ঘতম বালুকাময় সৈকত। এখানে ভ্রমণের একটি সংক্ষিপ্ত গাইডলাইন নিচে দেওয়া হলো:

#### **দর্শনীয় স্থানসমূহ:**
১. **লাবনী ও সুগন্ধা বিচ:** সূর্যাস্ত দেখা এবং ওয়াটার স্পোর্টসের জন্য আদর্শ।
২. **হিমছড়ি ও ইনানী বিচ:** মেরিন ড্রাইভ রোড দিয়ে যাওয়ার পথটি চমৎকার। হিমছড়ির পাহাড় এবং ইনানীর প্রবাল পাথর দেখার মতো।
৩. **মহেশখালী দ্বীপ:** আদিনাথ মন্দির ও রাখাইন পাড়া পরিদর্শনের জন্য।

#### **বাজেট ও খরচ কমানোর উপায়:**
* **যাতায়াত:** নন-এসি বাসে ঢাকা থেকে ৮০০-১০০০ টাকায় যাওয়া যায়।
* **থাকা:** বিচ থেকে কিছুটা দূরে হোটেল নিলে ৫০০-১০০০ টাকায় রুম পাওয়া সম্ভব।
* **খাবার:** ঐতিহ্যবাহী শুঁটকি ভর্তা, রূপচাঁদা ফ্রাই এবং লটে শুঁটকি ট্রাই করতে পারেন মাঝারি মানের রেস্টুরেন্টে।

#### **প্যাকিং লিস্ট:**
* সানস্ক্রিন ও সানগ্লাস
* বিচ ফুটওয়্যার (স্যান্ডেল)
* পাতলা সুতি পোশাক"""

        else:
            return """হ্যালো! আমি আপনার এআই ভ্রমণ সহকারী। 
আমি আপনাকে নিম্নলিখিত বিষয়ে সাহায্য করতে পারি:
- **ভ্রমণস্থলের সুপারিশ** (যেমন: বান্দরবান, সাজেক, সিলেট, সুন্দরবন)
- **ট্যুর প্ল্যান বা ইভেন্ট তৈরি**
- **বাজেট হিসাব ও পরিবহন পরামর্শ**
- **প্যাকিং লিস্ট ও আবহাওয়া টিপস**
- **স্থানীয় খাবার গাইড**

অনুগ্রহ করে আপনার গন্তব্য এবং ভ্রমণের দিন উল্লেখ করুন (যেমন: "৩ দিনের জন্য সাজেক ভ্যালি ভ্রমণের একটি বাজেট প্ল্যান দিন")।"""

    else:
        if "bandarban" in prompt_lower:
            return """### 3-Day Bandarban Detailed Itinerary (Budget: ~5,000 BDT)

Here is a budget-friendly itinerary for exploring the lush green hills of Bandarban:

#### **Day 1: Nilgiri, Chimbuk Hill, and Shoilo Propat**
* **08:00 AM:** Arrive in Bandarban town, check into a budget hotel.
* **09:30 AM:** Hire a shared 'Chander Gari' (Jeep) to Nilgiri.
* **11:30 AM:** Enjoy the cloud-touching view at Nilgiri.
* **02:00 PM:** Eat lunch at a local restaurant on Chimbuk Hill (Try local Jhum Rice and Bamboo Chicken).
* **04:30 PM:** Stop by Shoilo Propat waterfall.
* **06:00 PM:** Return to town and shop for local tribal handicrafts at the Burmese Market.

#### **Day 2: Boga Lake Adventure**
* **07:00 AM:** Travel to Ruma Bazar by public bus or jeep.
* **10:00 AM:** Register at the army camp, hire a local guide, and take a jeep to Boga Lake.
* **02:00 PM:** Reach Boga Lake, check into a tribal wooden cottage.
* **04:00 PM:** Walk around the mysterious lake and enjoy the peaceful breeze.
* **08:00 PM:** BBQ dinner under the stars.

#### **Day 3: Golden Temple and Nilachol Sunset**
* **08:00 AM:** Return from Boga Lake to Bandarban town.
* **12:00 PM:** Visit the Buddha Dhatu Jadi (Golden Temple).
* **03:30 PM:** Go to Nilachol for a breathtaking panoramic view of the hills during sunset.
* **08:00 PM:** Board the return bus.

**Local Food Guide:** Try **Bamboo Chicken** (cooked inside bamboo shoots), **Mundee** (tribal noodles), and fresh **Jhum Pineapples**.
**Weather Tip:** Humidity is high in summer. Bring mosquito repellent, comfortable hiking shoes, and an umbrella/raincoat."""

        elif "sajek" in prompt_lower:
            return """### Sajek Valley Travel Assistant

Sajek Valley is known as the "Queen of Hills" in Bangladesh, located in Rangamati district but accessed via Khagrachhari.

#### **Day 1: Entering the Valley of Clouds**
* **07:00 AM:** Arrive at Khagrachhari town. Hire a Chander Gari to Sajek (approx. 5,000-7,000 BDT return trip, shareable).
* **10:30 AM:** Join the army escort from Dighinala camp.
* **01:30 PM:** Reach Sajek Valley, check into a wooden resort on the ridge.
* **04:30 PM:** Watch the sunset from Konglak Para (the highest peak in Sajek).
* **08:00 PM:** Dinner at tribal restaurants (bamboo chicken and local tea).

#### **Day 2: Sunrise and Helipad views**
* **05:30 AM:** Wake up early to catch the ocean of clouds from your resort balcony or the helipad.
* **10:00 AM:** Visit Alutila Cave and Tareng Hills in Khagrachhari on the way back.

**Packing List:** Power bank (electricity is limited), personal medicines, lightweight windcheater, trekking sandals."""

        elif "food" in prompt_lower or "eat" in prompt_lower:
            return """### Local Food Guide of Bangladesh

Food is a major part of the travel experience in Bangladesh. Here are regional specialities to try:

1. **Sylhet / Sreemangal:**
   - **Shatkora Beef:** Beef cooked with a local bitter citrus fruit (Shatkora).
   - **Seven-Layer Tea:** Famous multi-layered tea at Nilkantha Cabin.
2. **Cox's Bazar:**
   - **Shutki Bhorta:** Dried fish paste with spices.
   - **Loitta Fry:** Deep-fried Bombay duck fish.
   - **Koral Fish BBQ:** Freshly grilled sea bass.
3. **Chittagong:**
   - **Mezban Beef:** Slow-cooked Mezban beef with special Chittagong spices.
   - **Kala Bhuna:** Deep-fried dry beef curry.
4. **Old Dhaka:**
   - **Kanchi Biryani:** Mutton biryani cooked in clay pots.
   - **Bakarkhani:** Crispy biscuit-like flatbread.

Try asking: *"Plan a 3-day Bandarban trip under 5,000 BDT"* or *"Give me a packing list for Sajek Valley."*"""
        else:
            return """Hello! I am your AI Travel Assistant.
Here are some capabilities I can help you with:
- **Destination Recommendations**: Get top places to visit based on your style.
- **Itinerary Generation**: Day-by-day itineraries with timings, activities, and hotels.
- **Budget Estimation**: Plan trips within specific price ranges (e.g. 5,000 BDT).
- **Transport & Route Advice**: Guide you on buses, trains, launches, and fares.
- **Packing Checklists**: Essential items to pack for hills, beaches, or forests.
- **Weather & Local Food Guides**: What to wear and what regional dishes to eat.

Try asking: *"Plan a 3-day Bandarban trip under 5,000 BDT"* or *"Give me a packing list for Sajek Valley."*"""


# 3.3 AI Travel Assistant views
@api_view(['GET', 'POST'])
def ai_sessions_list_create(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        title = request.data.get('title', 'New Trip Session')
        session = AIChatSession.objects.create(user_profile=profile, title=title)
        # Create initial welcoming message
        greeting = f"Hello {profile.full_name.split()[0]}! I'm your AI travel assistant. How can I help you plan your next adventure?"
        AIChatMessage.objects.create(session=session, role='assistant', content=greeting)
        return Response(AIChatSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    sessions = AIChatSession.objects.filter(user_profile=profile)
    # Ensure there's at least one session
    if not sessions.exists():
        session = AIChatSession.objects.create(user_profile=profile, title='My First Session')
        greeting = f"Hello {profile.full_name.split()[0]}! I'm your AI travel assistant. How can I help you plan your next adventure?"
        AIChatMessage.objects.create(session=session, role='assistant', content=greeting)
        sessions = AIChatSession.objects.filter(user_profile=profile)

    return Response(AIChatSessionSerializer(sessions[:10], many=True).data)


@api_view(['GET', 'DELETE'])
def ai_session_detail(request, session_id):
    session = AIChatSession.objects.filter(pk=session_id).first()
    if not session:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        session.delete()
        return Response({'message': 'Session deleted'})

    messages = session.messages.all()
    return Response(AIChatMessageSerializer(messages, many=True).data)


@api_view(['POST'])
def ai_session_respond(request, session_id):
    session = AIChatSession.objects.filter(pk=session_id).first()
    if not session:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    content = request.data.get('content')
    if not content:
        return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Save user message
    AIChatMessage.objects.create(session=session, role='user', content=content)

    # Generate assistant message
    response_text = _generate_ai_response(content)
    assistant_msg = AIChatMessage.objects.create(session=session, role='assistant', content=response_text)

    # Update session updated_at
    session.save()

    return Response(AIChatMessageSerializer(assistant_msg).data)


@api_view(['POST'])
def ai_message_feedback(request, message_id):
    msg = AIChatMessage.objects.filter(pk=message_id).first()
    if not msg:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

    rating = request.data.get('rating')  # 'up' or 'down'
    if rating not in ('up', 'down', None, ''):
        return Response({'error': 'Invalid rating'}, status=status.HTTP_400_BAD_REQUEST)

    msg.rating = rating
    msg.save(update_fields=['rating'])
    return Response(AIChatMessageSerializer(msg).data)


@api_view(['POST'])
def ai_save_itinerary(request, session_id):
    session = AIChatSession.objects.filter(pk=session_id).first()
    if not session:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    message_id = request.data.get('message_id')
    msg = session.messages.filter(pk=message_id, role='assistant').first()
    if not msg:
        return Response({'error': 'Itinerary message not found'}, status=status.HTTP_404_NOT_FOUND)

    room_name = request.data.get('room_name', 'Saved AI Itinerary Room')
    dest_slug = request.data.get('destination_slug', 'bandarban')
    dest = Destination.objects.filter(slug=dest_slug).first()

    # Create Tour Room
    from datetime import timedelta
    start_date = timezone.now() + timedelta(days=14)
    end_date = start_date + timedelta(days=3)

    room = TourRoom.objects.create(
        name=room_name,
        destination=dest,
        start_datetime=start_date,
        end_datetime=end_date,
        description=f"Generated from AI assistant conversation session: {session.title}",
        owner=session.user_profile.user,
        invite_code=f"ROOM-{room_name.replace(' ', '-').upper()}-{session.id}",
    )
    # Join creator
    TourRoomMembership.objects.create(room=room, user=session.user_profile.user, is_admin=True)

    # Create mock activities based on common 3-day itinerary
    activities = [
        {"day": 1, "title": "Arrival and Check-in", "desc": "Arrive at destination, check into hotel, and explore nearby spots.", "time": "09:00:00"},
        {"day": 1, "title": "Sightseeing", "desc": "Explore primary viewpoint attraction.", "time": "14:00:00"},
        {"day": 2, "title": "Adventure Day Trip", "desc": "Full day activity visiting waterfalls, lakes, or valleys.", "time": "08:00:00"},
        {"day": 3, "title": "Local Shopping and Departure", "desc": "Visit local tribal market for handicrafts, and prepare for departure.", "time": "10:00:00"},
    ]

    for act in activities:
        TourRoomActivity.objects.create(
            room=room,
            day_number=act["day"],
            title=act["title"],
            description=act["desc"],
            start_time=act["time"],
            sort_order=act["day"],
        )

    # Create a booking note to hold the raw AI text body
    TourRoomBookingNote.objects.create(
        room=room,
        added_by=session.user_profile.user,
        title="Original AI Itinerary text",
        confirmation_text=msg.content,
    )

    return Response({'message': 'Itinerary saved to Tour Room successfully!', 'room_id': room.id})


# 3.4 Tour Room (Group Planner) views
@api_view(['GET', 'POST'])
def tourroom_list_create(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        name = request.data.get('name')
        dest_slug = request.data.get('destination')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        max_members = request.data.get('max_members', 10)
        is_public = request.data.get('is_public', False)
        cover_photo = request.data.get('cover_photo', '')

        if not name or not start_date or not end_date:
            return Response({'error': 'Name, start date, and end date are required'}, status=status.HTTP_400_BAD_REQUEST)

        dest = None
        if dest_slug:
            dest = Destination.objects.filter(slug=dest_slug).first()

        room = TourRoom.objects.create(
            name=name,
            destination=dest,
            start_datetime=start_date,
            end_datetime=end_date,
            max_members=max_members,
            is_public=is_public,
            cover_photo=cover_photo,
            owner=profile.user,
            invite_code=f"INV-{name.replace(' ', '-').upper()}-{profile.id}",
        )
        TourRoomMembership.objects.create(room=room, user=profile.user, is_admin=True)
        return Response(TourRoomSerializer(room).data, status=status.HTTP_201_CREATED)

    # List active rooms for traveler
    memberships = TourRoomMembership.objects.filter(user=profile.user)
    rooms = [m.room for m in memberships if not m.room.is_archived]
    return Response(TourRoomSerializer(rooms, many=True).data)


@api_view(['GET', 'DELETE'])
def tourroom_detail(request, room_id, user_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Tour Room not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check membership
    membership = TourRoomMembership.objects.filter(room=room, user_id=user_id).first()
    if not membership:
        return Response({'error': 'You are not a member of this Tour Room'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        # Check if user is owner or room admin
        if room.owner_id != int(user_id) and not membership.is_admin:
            return Response({'error': 'Only the owner or an admin can delete this Tour Room'}, status=status.HTTP_403_FORBIDDEN)
        room.delete()
        return Response({'message': 'Tour Room deleted successfully'}, status=status.HTTP_200_OK)

    # Retrieve all sub-components
    activities = room.activities.all()
    expenses = room.expenses.all()
    polls = room.polls.all()
    checklist = room.checklist_items.all()
    pins = room.map_pins.all()
    notes = room.booking_notes.all()

    # Get members details
    m_ships = room.memberships.select_related('user', 'user__profile')
    members = []
    for m in m_ships:
        full_name = getattr(m.user, 'profile', None).full_name if hasattr(m.user, 'profile') else m.user.username
        initials = (full_name[0] + (full_name.split()[-1][0] if len(full_name.split()) > 1 else '')).upper()
        photo = None
        if hasattr(m.user, 'profile') and m.user.profile.profile_photo:
            try:
                photo = request.build_absolute_uri(m.user.profile.profile_photo.url)
            except Exception:
                pass
        members.append({
            'user_id': m.user.id,
            'username': m.user.username,
            'full_name': full_name,
            'initials': initials,
            'avatar_url': photo,
            'is_admin': m.is_admin,
        })

    # Clear unread count on open
    if membership.unread_count > 0:
        membership.unread_count = 0
        membership.save(update_fields=['unread_count'])

    return Response({
        'info': TourRoomSerializer(room).data,
        'members': members,
        'user_is_admin': membership.is_admin,
        'user_is_owner': room.owner_id == int(user_id),
        'activities': TourRoomActivitySerializer(activities, many=True).data,
        'expenses': TourRoomExpenseSerializer(expenses, many=True).data,
        'polls': TourRoomPollSerializer(polls, many=True, context={'user_id': user_id}).data,
        'checklist': TourRoomChecklistItemSerializer(checklist, many=True).data,
        'pins': TourRoomMapPinSerializer(pins, many=True).data,
        'notes': TourRoomBookingNoteSerializer(notes, many=True).data,
    })


@api_view(['POST'])
def tourroom_invite_member(request, room_id, user_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Tour Room not found'}, status=status.HTTP_404_NOT_FOUND)

    inviter = User.objects.filter(id=user_id).first()
    target_username = request.data.get('username')
    if not target_username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

    target_user = User.objects.filter(username=target_username).first()
    if not target_user:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if already member
    if TourRoomMembership.objects.filter(room=room, user=target_user).exists():
        return Response({'error': 'User is already a member of this room'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if invite exists
    existing = TourRoomInvite.objects.filter(room=room, invited_user=target_user).first()
    if existing and existing.status == 'pending':
        return Response({'error': 'User already has a pending invite'}, status=status.HTTP_400_BAD_REQUEST)

    invite = TourRoomInvite.objects.create(
        room=room,
        invited_by=inviter,
        invited_user=target_user,
        status='pending',
    )
    # Send system notification
    if hasattr(target_user, 'profile'):
        TravelerNotification.objects.create(
            user_profile=target_user.profile,
            notification_type='invite',
            title='Tour Room Invite',
            message=f"{inviter.profile.full_name} invited you to join the Tour Room '{room.name}'",
            icon='👥',
            link=f"/traveler/room?invite={invite.id}",
        )

    return Response({'message': f"Invite sent successfully to @{target_username}"})


@api_view(['GET'])
def tourroom_invites_list(request, user_id):
    invites = TourRoomInvite.objects.filter(invited_user_id=user_id, status='pending')
    return Response(TourRoomInviteSerializer(invites, many=True).data)


@api_view(['POST'])
def tourroom_invite_respond(request, invite_id, user_id):
    invite = TourRoomInvite.objects.filter(pk=invite_id, invited_user_id=user_id).first()
    if not invite:
        return Response({'error': 'Invite not found'}, status=status.HTTP_404_NOT_FOUND)

    accept = request.data.get('accept', False)
    if accept:
        invite.status = 'accepted'
        invite.save()
        # Add membership
        TourRoomMembership.objects.get_or_create(room=invite.room, user=invite.invited_user)
        return Response({'message': f"Joined room '{invite.room.name}'", 'room_id': invite.room.id})
    else:
        invite.status = 'declined'
        invite.save()
        return Response({'message': 'Invite declined'})


@api_view(['POST'])
def tourroom_activity_create(request, room_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    day = request.data.get('day_number', 1)
    title = request.data.get('title')
    desc = request.data.get('description', '')
    start = request.data.get('start_time')
    end = request.data.get('end_time')
    notes = request.data.get('notes', '')
    assign_id = request.data.get('assigned_to')

    if not title:
        return Response({'error': 'Activity title is required'}, status=status.HTTP_400_BAD_REQUEST)

    assigned_user = None
    if assign_id:
        assigned_user = User.objects.filter(id=assign_id).first()

    activity = TourRoomActivity.objects.create(
        room=room,
        day_number=day,
        title=title,
        description=desc,
        start_time=start or None,
        end_time=end or None,
        notes=notes,
        assigned_to=assigned_user,
    )
    return Response(TourRoomActivitySerializer(activity).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH', 'DELETE'])
def tourroom_activity_detail(request, activity_id):
    act = TourRoomActivity.objects.filter(pk=activity_id).first()
    if not act:
        return Response({'error': 'Activity not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        act.delete()
        return Response({'message': 'Activity deleted'})

    # Update or drag-reorder
    day = request.data.get('day_number', act.day_number)
    title = request.data.get('title', act.title)
    desc = request.data.get('description', act.description)
    start = request.data.get('start_time', act.start_time)
    end = request.data.get('end_time', act.end_time)
    notes = request.data.get('notes', act.notes)
    sort_order = request.data.get('sort_order', act.sort_order)
    assign_id = request.data.get('assigned_to')

    if assign_id is not None:
        if assign_id == '':
            act.assigned_to = None
        else:
            act.assigned_to = User.objects.filter(id=assign_id).first()

    act.day_number = day
    act.title = title
    act.description = desc
    act.start_time = start or None
    act.end_time = end or None
    act.notes = notes
    act.sort_order = sort_order
    act.save()

    return Response(TourRoomActivitySerializer(act).data)


@api_view(['POST'])
def tourroom_expense_create(request, room_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    payer_id = request.data.get('payer') or request.data.get('payer_id')
    amount = request.data.get('amount')
    desc = request.data.get('description')
    participants = request.data.get('participants') or request.data.get('participant_ids') or []

    if not payer_id or not amount or not desc:
        return Response({'error': 'Payer, amount, and description are required'}, status=status.HTTP_400_BAD_REQUEST)

    payer = User.objects.filter(id=payer_id).first()
    expense = TourRoomExpense.objects.create(
        room=room,
        payer=payer,
        amount=amount,
        description=desc,
        date=timezone.localdate(),
    )

    if not participants:
        # Default split among all room members
        participants = list(room.memberships.values_list('user_id', flat=True))

    share_amount = float(amount) / len(participants)
    for p_id in participants:
        user = User.objects.filter(id=p_id).first()
        if user:
            # Mark payer share paid by default
            is_paid = (int(p_id) == int(payer_id))
            TourRoomExpenseParticipant.objects.create(
                expense=expense,
                user=user,
                share_amount=share_amount,
                is_paid=is_paid,
            )

    return Response(TourRoomExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def tourroom_expense_participant_paid(request, participant_id):
    part = TourRoomExpenseParticipant.objects.filter(pk=participant_id).first()
    if not part:
        return Response({'error': 'Expense share record not found'}, status=status.HTTP_404_NOT_FOUND)

    is_paid = request.data.get('is_paid', True)
    part.is_paid = is_paid
    part.save(update_fields=['is_paid'])
    return Response(TourRoomExpenseSerializer(part.expense).data)


@api_view(['POST'])
def tourroom_poll_create(request, room_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    creator_id = request.data.get('creator')
    question = request.data.get('question')
    options = request.data.get('options', [])  # list of text strings
    is_multi = request.data.get('is_multichoice', False)
    deadline = request.data.get('deadline')

    if not creator_id or not question or len(options) < 2:
        return Response({'error': 'Creator, question, and at least 2 options are required'}, status=status.HTTP_400_BAD_REQUEST)

    creator = User.objects.filter(id=creator_id).first()
    if not creator:
        return Response({'error': 'Creator user not found'}, status=status.HTTP_400_BAD_REQUEST)
    poll = TourRoomPoll.objects.create(
        room=room,
        creator=creator,
        question=question,
        is_multichoice=is_multi,
        deadline=deadline or None,
    )

    for opt_text in options:
        TourRoomPollOption.objects.create(poll=poll, text=opt_text)

    return Response(TourRoomPollSerializer(poll).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def tourroom_poll_vote(request, poll_id):
    poll = TourRoomPoll.objects.filter(pk=poll_id).first()
    if not poll:
        return Response({'error': 'Poll not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get('user_id')
    option_ids = request.data.get('option_ids', [])  # list of option IDs

    if not user_id or not option_ids:
        return Response({'error': 'User ID and Option IDs are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(id=user_id).first()

    # Clear previous votes for this poll by this user
    TourRoomPollVote.objects.filter(poll=poll, user=user).delete()

    # Cast new votes
    for opt_id in option_ids:
        option = poll.options.filter(pk=opt_id).first()
        if option:
            TourRoomPollVote.objects.create(poll=poll, option=option, user=user)

    return Response(TourRoomPollSerializer(poll, context={'user_id': user_id}).data)


@api_view(['POST'])
def tourroom_checklist_create(request, room_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    title = request.data.get('title')
    assign_id = request.data.get('assigned_to')

    if not title:
        return Response({'error': 'Checklist item title is required'}, status=status.HTTP_400_BAD_REQUEST)

    assigned_user = None
    if assign_id:
        assigned_user = User.objects.filter(id=assign_id).first()

    item = TourRoomChecklistItem.objects.create(
        room=room,
        title=title,
        assigned_to=assigned_user,
    )
    return Response(TourRoomChecklistItemSerializer(item).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH', 'DELETE'])
def tourroom_checklist_detail(request, item_id):
    item = TourRoomChecklistItem.objects.filter(pk=item_id).first()
    if not item:
        return Response({'error': 'Checklist item not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        item.delete()
        return Response({'message': 'Checklist item deleted'})

    is_completed = request.data.get('is_completed', item.is_completed)
    assign_id = request.data.get('assigned_to')

    if assign_id is not None:
        if assign_id == '':
            item.assigned_to = None
        else:
            item.assigned_to = User.objects.filter(id=assign_id).first()

    item.is_completed = is_completed
    item.save()
    return Response(TourRoomChecklistItemSerializer(item).data)


@api_view(['GET', 'POST'])
def tourroom_chat_messages(request, room_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        sender_id = request.data.get('sender')
        message = request.data.get('message', '')
        attachment = request.data.get('attachment_url', '')

        if not sender_id or (not message and not attachment):
            return Response({'error': 'Sender and either message or attachment are required'}, status=status.HTTP_400_BAD_REQUEST)

        sender = User.objects.filter(id=sender_id).first()
        if not sender:
            return Response({'error': 'Sender user not found'}, status=status.HTTP_400_BAD_REQUEST)
        msg = TourRoomChatMessage.objects.create(
            room=room,
            sender=sender,
            message=message,
            attachment_url=attachment,
        )

        # Notify other members by incrementing unread counts
        room.memberships.exclude(user=sender).update(unread_count=F('unread_count') + 1)

        return Response(TourRoomChatMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    messages = room.chat_messages.all()
    return Response(TourRoomChatMessageSerializer(messages, many=True, context={'request': request}).data)


@api_view(['POST'])
def tourroom_mappin_create(request, room_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get('user_id')
    label = request.data.get('label')
    desc = request.data.get('description', '')
    lat = request.data.get('latitude')
    lng = request.data.get('longitude')

    if not user_id or not label or lat is None or lng is None:
        return Response({'error': 'User, label, latitude, and longitude are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(id=user_id).first()
    pin = TourRoomMapPin.objects.create(
        room=room,
        added_by=user,
        label=label,
        description=desc,
        latitude=lat,
        longitude=lng,
    )
    return Response(TourRoomMapPinSerializer(pin).data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def tourroom_mappin_delete(request, pin_id):
    pin = TourRoomMapPin.objects.filter(pk=pin_id).first()
    if not pin:
        return Response({'error': 'Map pin not found'}, status=status.HTTP_404_NOT_FOUND)

    pin.delete()
    return Response({'message': 'Map pin removed successfully'})


@api_view(['POST'])
def tourroom_bookingnote_create(request, room_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get('user_id')
    title = request.data.get('title')
    text = request.data.get('confirmation_text')

    if not user_id or not title or not text:
        return Response({'error': 'User, title, and confirmation text are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(id=user_id).first()
    note = TourRoomBookingNote.objects.create(
        room=room,
        added_by=user,
        title=title,
        confirmation_text=text,
    )
    return Response(TourRoomBookingNoteSerializer(note).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH', 'DELETE'])
def tourroom_settings_update(request, room_id):
    room = TourRoom.objects.filter(pk=room_id).first()
    if not room:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check membership
    membership = TourRoomMembership.objects.filter(room=room, user_id=user_id).first()
    if not membership:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    action = request.data.get('action')  # 'update', 'transfer_ownership', 'archive', 'leave', 'delete'
    if not action:
        if request.data.get('leave') or 'leave' in request.data:
            action = 'leave'
        else:
            action = 'update'

    if action == 'delete':
        if room.owner_id is not None and room.owner_id != int(user_id):
            return Response({'error': 'Only owner can delete the room'}, status=status.HTTP_403_FORBIDDEN)
        room.delete()
        return Response({'message': 'Tour Room deleted successfully'})

    elif action == 'leave':
        if room.owner_id == int(user_id) and room.memberships.count() > 1:
            return Response({'error': 'Owner cannot leave before transferring ownership'}, status=status.HTTP_400_BAD_REQUEST)
        membership.delete()
        return Response({'message': 'You left the room'})

    elif action == 'archive':
        room.is_archived = True
        room.save(update_fields=['is_archived'])
        return Response({'message': 'Room archived'})

    elif action == 'transfer_ownership':
        if room.owner_id is not None and room.owner_id != int(user_id):
            return Response({'error': 'Only owner can transfer ownership'}, status=status.HTTP_403_FORBIDDEN)
        target_username = request.data.get('target_username')
        target_user = User.objects.filter(username=target_username).first()
        if not target_user:
            return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)
        if not TourRoomMembership.objects.filter(room=room, user=target_user).exists():
            return Response({'error': 'Target user is not a member'}, status=status.HTTP_400_BAD_REQUEST)
        room.owner = target_user
        room.save(update_fields=['owner'])
        return Response({'message': f"Ownership transferred to @{target_username}"})

    elif action == 'update':
        room.name = request.data.get('name', room.name)
        room.start_datetime = request.data.get('start_date', room.start_datetime)
        room.end_datetime = request.data.get('end_date', room.end_datetime)
        room.max_members = request.data.get('max_members', room.max_members)
        room.is_public = request.data.get('is_public', room.is_public)
        room.is_archived = request.data.get('is_archived', room.is_archived)
        room.cover_photo = request.data.get('cover_photo', room.cover_photo)
        room.save()
        return Response(TourRoomSerializer(room).data)

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


# 3.6 Tour Guide & Local Bookings views
@api_view(['GET'])
def service_provider_list(request):
    service_type = request.query_params.get('service_type')
    queryset = ServiceProvider.objects.filter(is_verified=True)

    if service_type and service_type != 'all':
        queryset = queryset.filter(service_type=service_type)

    destination = request.query_params.get('destination')
    language = request.query_params.get('language')

    # Filtering by Specialized Destinations (contains keyword)
    if destination:
        queryset = queryset.filter(specialized_destinations__icontains=destination)

    # Filtering by Language offered
    if language:
        queryset = queryset.filter(languages_offered__icontains=language)

    # Get service providers profiles
    results = []
    for sp in queryset:
        profile = getattr(sp.user, 'profile', None)
        if not profile:
            continue
        # Average rating from reviews
        reviews = sp.reviews.all()
        avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews.exists() else 4.5
        
        photo = None
        if profile.profile_photo:
            try:
                photo = request.build_absolute_uri(profile.profile_photo.url)
            except Exception:
                pass

        results.append({
            'id': sp.id,
            'user': {
                'id': sp.user.id,
                'username': sp.user.username,
                'email': sp.user.email,
                'full_name': profile.full_name,
            },
            'service_type': sp.service_type,
            'service_type_label': sp.get_service_type_display(),
            'specialized_destinations': sp.specialized_destinations,
            'languages_offered': sp.languages_offered,
            'years_of_experience': sp.years_of_experience,
            'fee_range': sp.fee_range,
            'is_verified': sp.is_verified,
            'rating': round(avg_rating, 1),
            'reviews_count': reviews.count(),
            'photo': photo,
        })
    return Response(results)


@api_view(['GET'])
def service_provider_detail(request, sp_id):
    sp = ServiceProvider.objects.filter(pk=sp_id).first()
    if not sp:
        return Response({'error': 'Service provider not found'}, status=status.HTTP_404_NOT_FOUND)

    profile = getattr(sp.user, 'profile', None)
    photo = None
    if profile and profile.profile_photo:
        try:
            photo = request.build_absolute_uri(profile.profile_photo.url)
        except Exception:
            pass

    reviews = sp.reviews.select_related('author', 'author__profile')
    reviews_data = []
    for r in reviews:
        author_name = getattr(r.author, 'profile', None).full_name if hasattr(r.author, 'profile') else r.author.username
        reviews_data.append({
            'author': author_name,
            'rating': r.rating,
            'text': r.text_review,
            'date': r.created_at.date().isoformat(),
        })

    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews.exists() else 4.5

    return Response({
        'id': sp.id,
        'user': {
            'id': sp.user.id,
            'username': sp.user.username,
            'email': sp.user.email,
            'full_name': profile.full_name if profile else sp.user.username,
        },
        'service_type': sp.service_type,
        'service_type_label': sp.get_service_type_display(),
        'specialized_destinations': sp.specialized_destinations,
        'languages_offered': sp.languages_offered,
        'years_of_experience': sp.years_of_experience,
        'fee_range': sp.fee_range,
        'is_verified': sp.is_verified,
        'rating': round(avg_rating, 1),
        'reviews_count': reviews.count(),
        'bio': sp.bio or f"Verified {sp.get_service_type_display()} with {sp.years_of_experience} years of experience in specialized areas. Offers services in {sp.languages_offered}.",
        'portfolio_photos': sp.portfolio_photos or [],
        'reviews': reviews_data,
        'photo': photo,
    })


@api_view(['POST'])
def service_provider_book(request, sp_id):
    sp = ServiceProvider.objects.filter(pk=sp_id).first()
    if not sp:
        return Response({'error': 'Service provider not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get('user_id') or request.data.get('customer_id')
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    group_size = request.data.get('group_size', 1)
    reqs = request.data.get('specific_requirements', '')
    msg = request.data.get('message', '')

    agreed_fee = request.data.get('agreed_fee', 0)

    if not user_id or not start_date or not end_date:
        return Response({'error': 'User, start date, and end date are required'}, status=status.HTTP_400_BAD_REQUEST)

    customer = User.objects.filter(id=user_id).first()
    booking = ServiceProviderBooking.objects.create(
        service_provider=sp,
        customer=customer,
        start_date=start_date,
        end_date=end_date,
        group_size=group_size,
        specific_requirements=reqs,
        message=msg,
        status='requested',
        agreed_fee=agreed_fee,
    )
    # Notify provider
    if hasattr(sp.user, 'profile'):
        TravelerNotification.objects.create(
            user_profile=sp.user.profile,
            notification_type='booking',
            title='New Booking Request',
            message=f"{customer.profile.full_name} has requested a booking from {start_date} to {end_date}",
            icon='📅',
        )

    return Response(ServiceProviderBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def my_bookings_list(request, user_id):
    # Upcoming & past bookings.
    # Checks if requested user_id is a service provider, returning provider-centric bookings list if true.
    user = User.objects.filter(id=user_id).first()
    if user and hasattr(user, 'service_provider'):
        bookings = ServiceProviderBooking.objects.filter(service_provider=user.service_provider)
    else:
        bookings = ServiceProviderBooking.objects.filter(customer_id=user_id)
        
    bookings = bookings.select_related(
        'service_provider',
        'service_provider__user',
        'service_provider__user__profile',
        'customer',
        'customer__profile'
    )
    return Response(ServiceProviderBookingSerializer(bookings, many=True).data)


@api_view(['POST'])
def booking_status_update(request, booking_id):
    booking = ServiceProviderBooking.objects.filter(pk=booking_id).first()
    if not booking:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in ('confirmed', 'completed', 'cancelled'):
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    booking.status = new_status
    booking.save(update_fields=['status'])

    # Notify customer
    if hasattr(booking.customer, 'profile'):
        TravelerNotification.objects.create(
            user_profile=booking.customer.profile,
            notification_type='booking',
            title='Booking Status Updated',
            message=f"Your booking status with {booking.service_provider.user.profile.full_name} is now {new_status.capitalize()}",
            icon='🔔',
            link='/traveler/bookings',
        )

    # Award stats if completed
    if new_status == 'completed':
        stats, _ = TravelStats.objects.get_or_create(user_profile=booking.customer.profile)
        stats.total_trips_logged += 1
        stats.save()

    return Response(ServiceProviderBookingSerializer(booking).data)


@api_view(['POST'])
def service_provider_review(request, sp_id):
    sp = ServiceProvider.objects.filter(pk=sp_id).first()
    if not sp:
        return Response({'error': 'Service provider not found'}, status=status.HTTP_404_NOT_FOUND)

    author_id = request.data.get('user_id')
    booking_id = request.data.get('booking_id')
    rating = request.data.get('rating', 5)
    text = request.data.get('text_review', '')

    if not author_id or not text:
        return Response({'error': 'User and review text are required'}, status=status.HTTP_400_BAD_REQUEST)

    author = User.objects.filter(id=author_id).first()
    booking = ServiceProviderBooking.objects.filter(id=booking_id).first() if booking_id else None

    review = ServiceProviderReview.objects.create(
        service_provider=sp,
        booking=booking,
        author=author,
        rating=rating,
        text_review=text,
    )
    return Response(ServiceProviderReviewSerializer(review).data, status=status.HTTP_201_CREATED)


# 3.7 Reviews & Trip Stories views
@api_view(['POST'])
def destination_review_create(request, dest_slug):
    dest = Destination.objects.filter(slug=dest_slug).first()
    if not dest:
        return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get('user_id')
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)

    review = DestinationReview.objects.create(
        user_profile=profile,
        destination=dest,
        rating_accessibility=request.data.get('rating_accessibility', 5),
        rating_safety=request.data.get('rating_safety', 5),
        rating_value=request.data.get('rating_value', 5),
        rating_scenery=request.data.get('rating_scenery', 5),
        rating_food=request.data.get('rating_food', 5),
        text_review=request.data.get('text_review', ''),
        photos=request.data.get('photos', []),
    )

    # Update stats
    stats = profile.travel_stats
    stats.reviews_written += 1
    stats.save()

    return Response(DestinationReviewSerializer(review, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def accommodation_review_create(request, accom_id):
    accom = Accommodation.objects.filter(pk=accom_id).first()
    if not accom:
        return Response({'error': 'Accommodation not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get('user_id')
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)

    review = AccommodationReview.objects.create(
        user_profile=profile,
        accommodation=accom,
        rating_cleanliness=request.data.get('rating_cleanliness', 5),
        rating_staff=request.data.get('rating_staff', 5),
        rating_accessibility=request.data.get('rating_accessibility', 5),
        rating_safety=request.data.get('rating_safety', 5),
        rating_value=request.data.get('rating_value', 5),
        rating_scenery=request.data.get('rating_scenery', 5),
        rating_food=request.data.get('rating_food', 5),
        text_review=request.data.get('text_review', ''),
        photos=request.data.get('photos', []),
    )

    stats = profile.travel_stats
    stats.reviews_written += 1
    stats.save()

    return Response(AccommodationReviewSerializer(review, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['POST', 'PUT', 'PATCH'])
def trip_story_create_update(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile required'}, status=status.HTTP_400_BAD_REQUEST)

    story_id = request.data.get('id')
    dest_slug = request.data.get('destination_slug')
    dest = Destination.objects.filter(slug=dest_slug).first()
    if not dest:
        return Response({'error': 'Valid destination is required'}, status=status.HTTP_400_BAD_REQUEST)

    title = request.data.get('title')
    content = request.data.get('content')
    cover = request.FILES.get('cover_photo') or request.data.get('cover_photo')
    status_choice = request.data.get('status', 'draft')

    if not title or not content:
        return Response({'error': 'Title and content are required'}, status=status.HTTP_400_BAD_REQUEST)

    if story_id:
        story = TripStory.objects.filter(pk=story_id, user_profile=profile).first()
        if not story:
            return Response({'error': 'Story not found'}, status=status.HTTP_404_NOT_FOUND)
        story.title = title
        story.content = content
        story.destination = dest
        story.status = status_choice
        if cover:
            story.cover_photo = cover
        if status_choice == 'published' and not story.published_at:
            story.published_at = timezone.now()
        story.save()
    else:
        published_at = timezone.now() if status_choice == 'published' else None
        story = TripStory.objects.create(
            user_profile=profile,
            destination=dest,
            title=title,
            content=content,
            cover_photo=cover if not isinstance(cover, str) else None,
            status=status_choice,
            published_at=published_at,
        )
        if isinstance(cover, str) and cover:
            story.photos = [cover]
            story.save()

    # Update stats if published
    if status_choice == 'published':
        stats = profile.travel_stats
        stats.stories_posted = TripStory.objects.filter(user_profile=profile, status='published').count()
        stats.save()

    return Response(TripStorySerializer(story, context={'request': request}).data)


@api_view(['GET', 'DELETE'])
def trip_story_detail(request, story_id):
    story = TripStory.objects.filter(pk=story_id).first()
    if not story:
        return Response({'error': 'Story not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        story.delete()
        return Response({'message': 'Story deleted'})

    return Response(TripStorySerializer(story, context={'request': request}).data)


@api_view(['GET'])
def trip_stories_list(request):
    stories = TripStory.objects.filter(status='published').select_related('user_profile', 'destination').order_by('-published_at')
    return Response(TripStorySerializer(stories, many=True, context={'request': request}).data)


@api_view(['GET'])
def my_reviews_list(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    dest_revs = DestinationReview.objects.filter(user_profile=profile)
    accom_revs = AccommodationReview.objects.filter(user_profile=profile)

    return Response({
        'destinations': DestinationReviewSerializer(dest_revs, many=True, context={'request': request}).data,
        'accommodations': AccommodationReviewSerializer(accom_revs, many=True, context={'request': request}).data,
    })


@api_view(['DELETE'])
def review_delete(request, review_type, review_id):
    if review_type == 'destination':
        rev = DestinationReview.objects.filter(pk=review_id).first()
    elif review_type == 'accommodation':
        rev = AccommodationReview.objects.filter(pk=review_id).first()
    else:
        return Response({'error': 'Invalid review type'}, status=status.HTTP_400_BAD_REQUEST)

    if not rev:
        return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

    # Update stats
    profile = rev.user_profile
    rev.delete()
    stats = profile.travel_stats
    stats.reviews_written = max(0, stats.reviews_written - 1)
    stats.save()

    return Response({'message': 'Review deleted successfully'})


@api_view(['GET'])
def traveler_leaderboard(request):
    stats_list = TravelStats.objects.select_related('user_profile').order_by('-total_trips_logged', '-stories_posted', '-reviews_written')[:20]
    rankings = []
    for i, s in enumerate(stats_list):
        # Calculate a mock score for sorting
        score = (s.total_trips_logged * 10) + (s.stories_posted * 5) + (s.reviews_written * 2)
        rankings.append({
            'rank': i + 1,
            'name': s.user_profile.full_name,
            'trips': s.total_trips_logged,
            'stories': s.stories_posted,
            'reviews': s.reviews_written,
            'score': score,
        })
    return Response(rankings)


# 3.8 Notifications views
@api_view(['GET'])
def notifications_list(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    category = request.query_params.get('category')  # 'booking', 'invite', 'group_invite', 'review', 'update', 'reminder'
    search = request.query_params.get('search')

    queryset = TravelerNotification.objects.filter(user_profile=profile)
    if category:
        queryset = queryset.filter(notification_type=category)
    if search:
        queryset = queryset.filter(message__icontains=search)

    now = timezone.now()
    items = []
    for n in queryset:
        delta = now - n.created_at
        if delta.days > 0:
            time_label = f'{delta.days} day{"s" if delta.days != 1 else ""} ago'
        elif delta.seconds >= 3600:
            hours = delta.seconds // 3600
            time_label = f'{hours} hour{"s" if hours != 1 else ""} ago'
        else:
            minutes = max(1, delta.seconds // 60)
            time_label = f'{minutes} minute{"s" if minutes != 1 else ""} ago'
        items.append({
            'id': n.id,
            'type': n.notification_type,
            'message': n.message,
            'time': time_label,
            'icon': n.icon,
            'is_read': n.is_read,
            'link': n.link or '',
        })

    return Response(items)


@api_view(['POST', 'DELETE'])
def notification_mark_read(request, notification_id):
    n = TravelerNotification.objects.filter(pk=notification_id).first()
    if not n:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        n.delete()
        return Response({'message': 'Notification deleted'})

    n.is_read = True
    n.save(update_fields=['is_read'])
    return Response({'message': 'Marked as read'})


@api_view(['POST'])
def notifications_mark_all_read(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    TravelerNotification.objects.filter(user_profile=profile, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read'})


@api_view(['GET', 'PUT', 'PATCH'])
def notification_preferences_get_update(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    prefs, _ = NotificationPreferences.objects.get_or_create(user_profile=profile)

    if request.method in ('PUT', 'PATCH'):
        serializer = NotificationPreferencesSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(NotificationPreferencesSerializer(prefs).data)


# 3.9 Saved / Wishlist views
@api_view(['POST'])
def wishlist_add_note(request, wishlist_id):
    item = Wishlist.objects.filter(pk=wishlist_id).first()
    if not item:
        return Response({'error': 'Wishlist item not found'}, status=status.HTTP_404_NOT_FOUND)

    notes = request.data.get('notes', '')
    item.notes = notes
    item.save(update_fields=['notes'])

    profile = item.user_profile
    return Response(TravelerProfileSerializer(profile, context={'request': request}).data)


@api_view(['DELETE'])
def wishlist_delete(request, wishlist_id):
    item = Wishlist.objects.filter(pk=wishlist_id).first()
    if not item:
        return Response({'error': 'Wishlist item not found'}, status=status.HTTP_404_NOT_FOUND)

    profile = item.user_profile
    item.delete()

    return Response(TravelerProfileSerializer(profile, context={'request': request}).data)


@api_view(['GET'])
def wishlist_share(request, wishlist_id):
    item = Wishlist.objects.filter(pk=wishlist_id).first()
    if not item:
        return Response({'error': 'Wishlist item not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'shared_link': f"http://localhost:5173/discover?share={item.id}",
        'destination_name': item.destination.name,
        'region': item.destination.region,
        'category': item.destination.category,
        'notes': item.notes,
        'author': item.user_profile.full_name,
    })


@api_view(['POST'])
def wishlist_convert_to_room(request, wishlist_id):
    item = Wishlist.objects.filter(pk=wishlist_id).first()
    if not item:
        return Response({'error': 'Wishlist item not found'}, status=status.HTTP_404_NOT_FOUND)

    profile = item.user_profile
    from datetime import timedelta
    start_date = timezone.now() + timedelta(days=14)
    end_date = start_date + timedelta(days=3)

    room = TourRoom.objects.create(
        name=f"Planning: {item.destination.name} Trip",
        destination=item.destination,
        start_datetime=start_date,
        end_datetime=end_date,
        description=item.notes or f"Created from my wishlist item for {item.destination.name}.",
        owner=profile.user,
        invite_code=f"ROOM-{item.destination.slug.upper()}-{profile.id}",
    )
    TourRoomMembership.objects.create(room=room, user=profile.user, is_admin=True)

    # Optional: remove from wishlist once converted
    item.delete()

    return Response({'message': 'Converted to Tour Room successfully!', 'room_id': room.id})


@api_view(['GET', 'POST'])
def wishlist_toggle(request, user_id):
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

    # GET — return list of saved destination slugs for pre-loading hearts
    if request.method == 'GET':
        slugs = list(
            Wishlist.objects.filter(user_profile=profile)
            .values_list('destination__slug', flat=True)
        )
        return Response({'saved_slugs': slugs}, status=status.HTTP_200_OK)

    # POST — toggle a destination in/out of wishlist
    destination_slug = request.data.get('destination_slug')
    if not destination_slug:
        return Response({'error': 'destination_slug is required'}, status=status.HTTP_400_BAD_REQUEST)

    destination = Destination.objects.filter(slug=destination_slug).first()
    if not destination:
        return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)

    wishlist_item = Wishlist.objects.filter(user_profile=profile, destination=destination).first()
    if wishlist_item:
        wishlist_item.delete()
        is_saved = False
    else:
        Wishlist.objects.create(user_profile=profile, destination=destination)
        is_saved = True

    return Response({
        'is_saved': is_saved,
        'message': 'Wishlist toggled successfully'
    }, status=status.HTTP_200_OK)


# Public views for new dynamic pages
@api_view(['GET'])
def faqs_list(request):
    category_name = request.query_params.get('category', 'All')
    search_query = request.query_params.get('search', '')
    
    queryset = FAQItem.objects.all()
    if category_name and category_name != 'All':
        queryset = queryset.filter(category__name=category_name)
    if search_query:
        queryset = queryset.filter(
            Q(question__icontains=search_query) |
            Q(answer__icontains=search_query)
        )
        
    return Response(FAQItemSerializer(queryset, many=True).data)


@api_view(['GET'])
def faq_categories_list(request):
    cats = FAQCategory.objects.all()
    return Response(FAQCategorySerializer(cats, many=True).data)


@api_view(['GET'])
def video_tutorials_list(request):
    tuts = VideoTutorial.objects.all()
    return Response(VideoTutorialSerializer(tuts, many=True).data)


@api_view(['GET'])
def about_page_data(request):
    features = AboutFeature.objects.all()
    pain_points = AboutPainPoint.objects.all()
    
    # get mission/vision from SystemConfig if exists, else provide defaults
    cfg = SystemConfig.objects.filter(key='about_mission_vision').first()
    mv = cfg.value if cfg else {
        'mission_title': 'Our Mission',
        'mission_text': 'To provide travelers with authentic, accessible, and comprehensive information about Bangladesh — making trip planning effortless, collaborative, and enjoyable for everyone.',
        'vision_title': 'Our Vision',
        'vision_text': 'To become the premier platform for discovering the hidden gems and cultural heritage of Bangladesh, promoting sustainable and responsible tourism for future generations.'
    }
    
    return Response({
        'mission_vision': mv,
        'features': AboutFeatureSerializer(features, many=True).data,
        'pain_points': AboutPainPointSerializer(pain_points, many=True).data
    })


@api_view(['POST'])
def submit_about_contact(request):
    serializer = ContactMessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'success', 'message': 'Message sent successfully!'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# TRAVELER SETTINGS & PREFERENCES API ENDPOINTS
# ============================================================

@api_view(['GET', 'PATCH'])
def traveler_display_settings(request, user_id):
    """Get or update display settings (theme, font size, language)"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    display_settings, created = DisplaySettings.objects.get_or_create(
        user_profile=profile,
        defaults={'theme': 'auto', 'font_size': 'medium', 'language': 'en'}
    )
    
    if request.method == 'PATCH':
        serializer = DisplaySettingsSerializer(display_settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(DisplaySettingsSerializer(display_settings).data)


@api_view(['GET', 'PATCH'])
def traveler_account_settings(request, user_id):
    """Get or update account settings (privacy, 2FA)"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    account_settings, created = AccountSettings.objects.get_or_create(
        user_profile=profile,
        defaults={'profile_visibility': 'public', 'two_factor_enabled': False}
    )
    
    if request.method == 'PATCH':
        serializer = AccountSettingsSerializer(account_settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(AccountSettingsSerializer(account_settings).data)


@api_view(['POST'])
def traveler_change_password(request, user_id):
    """Change user password"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({'error': 'Old password and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = profile.user
    if not user.check_password(old_password):
        return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})


@api_view(['GET', 'POST'])
def traveler_blocked_users(request, user_id):
    """Get list of blocked users or block a new user"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        blocked_users = BlockedUser.objects.filter(blocker=profile.user)
        return Response(BlockedUserSerializer(blocked_users, many=True).data)
    
    # Block a user
    blocked_user_id = request.data.get('blocked_user_id')
    reason = request.data.get('reason', '')
    
    if not blocked_user_id:
        return Response({'error': 'blocked_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        blocked_user = User.objects.get(id=blocked_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User to block not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if blocked_user == profile.user:
        return Response({'error': 'Cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)
    
    blocked, created = BlockedUser.objects.get_or_create(
        blocker=profile.user,
        blocked=blocked_user,
        defaults={'reason': reason}
    )
    
    if not created:
        return Response({'error': 'User is already blocked'}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(BlockedUserSerializer(blocked).data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def traveler_unblock_user(request, user_id, blocked_user_id):
    """Unblock a user"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        blocked_user = User.objects.get(id=blocked_user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    blocked = BlockedUser.objects.filter(blocker=profile.user, blocked=blocked_user).first()
    if not blocked:
        return Response({'error': 'User is not blocked'}, status=status.HTTP_400_BAD_REQUEST)
    
    blocked.delete()
    return Response({'message': 'User unblocked successfully'})


@api_view(['POST'])
def traveler_request_account_deletion(request, user_id):
    """Request account deletion with 30-day grace period"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    account_settings, created = AccountSettings.objects.get_or_create(
        user_profile=profile
    )
    
    if account_settings.deactivation_requested:
        return Response({'error': 'Account deletion already requested'}, status=status.HTTP_400_BAD_REQUEST)
    
    reason = request.data.get('reason', '')
    account_settings.request_deactivation(reason)
    
    return Response({
        'message': 'Account deletion requested. Your account will be permanently deleted in 30 days.',
        'deactivation_requested_at': account_settings.deactivation_requested_at
    })


@api_view(['POST'])
def traveler_cancel_account_deletion(request, user_id):
    """Cancel account deletion request"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    account_settings = AccountSettings.objects.filter(user_profile=profile).first()
    if not account_settings or not account_settings.deactivation_requested:
        return Response({'error': 'No active deletion request found'}, status=status.HTTP_400_BAD_REQUEST)
    
    account_settings.deactivation_requested = False
    account_settings.deactivation_requested_at = None
    account_settings.deactivation_reason = ''
    account_settings.save()
    
    return Response({'message': 'Account deletion request cancelled'})


@api_view(['GET'])
def traveler_export_data(request, user_id):
    """Export personal data for GDPR compliance"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    user = profile.user
    
    export_data = {
        'user': {
            'username': user.username,
            'email': user.email,
            'date_joined': user.date_joined.isoformat(),
        },
        'profile': {
            'full_name': profile.full_name,
            'phone_number': profile.phone_number,
            'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            'gender': profile.gender,
            'division': profile.division,
            'district': profile.district,
            'user_type': profile.user_type,
        },
        'travel_stats': {},
        'wishlist': [],
        'stories': [],
        'exported_at': timezone.now().isoformat(),
    }
    
    # Add travel stats if exists
    if hasattr(profile, 'travel_stats'):
        export_data['travel_stats'] = {
            'total_trips_logged': profile.travel_stats.total_trips_logged,
            'destinations_visited': profile.travel_stats.destinations_visited,
            'stories_posted': profile.travel_stats.stories_posted,
            'reviews_written': profile.travel_stats.reviews_written,
        }
    
    # Add wishlist items
    wishlist_items = Wishlist.objects.filter(user_profile=profile)
    export_data['wishlist'] = [
        {'destination': item.destination.name, 'slug': item.destination.slug, 'added_at': item.added_at.isoformat()}
        for item in wishlist_items
    ]
    
    # Add published stories
    stories = TripStory.objects.filter(user_profile=profile, status='published')
    export_data['stories'] = [
        {'title': story.title, 'destination': story.destination.name, 'published_at': story.published_at.isoformat()}
        for story in stories
    ]
    
    return Response(export_data)


# ============================================================
# HELP & SUPPORT API ENDPOINTS
# ============================================================

@api_view(['GET', 'POST'])
def traveler_support_tickets(request, user_id):
    """Get support tickets or submit a new one"""
    try:
        profile = _get_traveler_profile_or_404(user_id)
        if not profile:
            return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            tickets = SupportTicket.objects.filter(user=profile.user).order_by('-created_at')
            return Response(SupportTicketSerializer(tickets, many=True).data)
        
        # Submit new ticket
        serializer = SupportTicketSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=profile.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Failed to load support tickets: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def traveler_support_ticket_detail(request, user_id, ticket_id):
    """Get details of a specific support ticket"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        ticket = SupportTicket.objects.get(id=ticket_id, user=profile.user)
    except SupportTicket.DoesNotExist:
        return Response({'error': 'Support ticket not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(SupportTicketSerializer(ticket).data)


@api_view(['POST'])
def traveler_submit_feedback(request, user_id):
    """Submit app feedback/rating"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = AppFeedbackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=profile.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def traveler_submit_bug_report(request, user_id):
    """Submit a bug report"""
    profile = _get_traveler_profile_or_404(user_id)
    if not profile:
        return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = BugReportSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=profile.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def home_page_data(request):
    stats = AppStat.objects.all()
    cards = ValueCard.objects.all()
    stories = LandingStory.objects.all()
    featured = Destination.objects.filter(is_featured=True)
    spotlight = Destination.objects.filter(is_spotlight=True).first()
    
    return Response({
        'stats': AppStatSerializer(stats, many=True).data,
        'value_cards': ValueCardSerializer(cards, many=True).data,
        'landing_stories': LandingStorySerializer(stories, many=True).data,
        'featured_destinations': DestinationListSerializer(featured, many=True).data,
        'spotlight_destination': DestinationDetailSerializer(spotlight).data if spotlight else None
    })
