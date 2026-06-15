from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.core.mail import send_mail
from django.conf import settings
import traceback
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
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
    ItineraryItem,
    Expense,
    ExpenseParticipant,
    Poll,
    PollOption,
    PollVote,
    ChecklistItem,
    ChatMessage,
    ChatAttachment,
    MapPin,
    BookingNote,
    TourGuide,
    GuideAvailability,
    GuideReview,
    GuideBooking,
    BoatCharter,
    BoatCharterReview,
    BoatCharterBooking,
    VehicleRental,
    VehicleRentalReview,
    VehicleRentalBooking,
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
    TourRoomSerializer,
    TourRoomMembershipSerializer,
    ItineraryItemSerializer,
    ExpenseSerializer,
    ExpenseParticipantSerializer,
    PollSerializer,
    PollOptionSerializer,
    PollVoteSerializer,
    ChecklistItemSerializer,
    ChatMessageSerializer,
    ChatAttachmentSerializer,
    MapPinSerializer,
    BookingNoteSerializer,
    TourGuideSerializer,
    GuideAvailabilitySerializer,
    GuideReviewSerializer,
    GuideBookingSerializer,
    BoatCharterSerializer,
    BoatCharterReviewSerializer,
    BoatCharterBookingSerializer,
    VehicleRentalSerializer,
    VehicleRentalReviewSerializer,
    VehicleRentalBookingSerializer,
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
        return Response({'message': 'Login successful', 'user_id': user.id, 'username': user.username}, status=status.HTTP_200_OK)

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


@api_view(['GET'])
def destination_suggestions(request):
    query = request.query_params.get('q', '')
    if len(query) < 2:
        return Response([])
    
    destinations = Destination.objects.filter(
        name__icontains=query
    ).values('name', 'slug')[:10]
    
    return Response(list(destinations))


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
            'profile_photo_content_type': request.data.get('profile_photo_content_type'),
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

    photo_data = request.data.get('profile_photo')
    if not photo_data:
        return Response({'error': 'Profile photo is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Handle base64 encoded photo data
    import base64
    try:
        # If it's a file upload, read the binary data
        if hasattr(photo_data, 'read'):
            photo_binary = photo_data.read()
        else:
            # If it's base64 string, decode it
            if isinstance(photo_data, str):
                # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
                if photo_data.startswith('data:'):
                    photo_data = photo_data.split(',')[1]
                photo_binary = base64.b64decode(photo_data)
            else:
                photo_binary = photo_data

        profile.profile_photo = photo_binary
        profile.save(update_fields=['profile_photo'])
        return Response(TravelerProfileSerializer(profile, context={'request': request}).data)
    except Exception as e:
        return Response({'error': f'Failed to process photo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


# Tour Room Views

@api_view(['GET', 'POST'])
def tour_room_list(request):
    if request.method == 'GET':
        rooms = TourRoom.objects.filter(status='active')
        serializer = TourRoomSerializer(rooms, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TourRoomSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Generate invite code
            import secrets
            invite_code = secrets.token_urlsafe(8)[:12]
            serializer.validated_data['invite_code'] = invite_code

            room = serializer.save()
            # Add creator as admin member only if user is authenticated
            if request.user.is_authenticated:
                TourRoomMembership.objects.create(
                    room=room,
                    user=request.user,
                    is_admin=True
                )
            return Response(TourRoomSerializer(room, context={'request': request}).data, status=status.HTTP_201_CREATED)
        print("Serializer errors:", serializer.errors)
        print("Request data:", request.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def tour_room_detail(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = TourRoomSerializer(room, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Check if user is admin
        membership = TourRoomMembership.objects.filter(room=room, user=request.user, is_admin=True).first()
        if not membership:
            return Response({'error': 'Only admins can update room settings'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TourRoomSerializer(room, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        membership = TourRoomMembership.objects.filter(room=room, user=request.user, is_admin=True).first()
        if not membership:
            return Response({'error': 'Only admins can delete rooms'}, status=status.HTTP_403_FORBIDDEN)
        
        room.status = 'deleted'
        room.save()
        return Response({'message': 'Room deleted successfully'})


@api_view(['POST'])
def tour_room_join(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id, status='active')
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already a member
    if TourRoomMembership.objects.filter(room=room, user=request.user).exists():
        return Response({'error': 'Already a member of this room'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if room is full
    current_members = TourRoomMembership.objects.filter(room=room).count()
    if current_members >= room.max_members:
        return Response({'error': 'Room is full'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Join by invite code or directly
    invite_code = request.data.get('invite_code')
    if invite_code and room.visibility == 'private' and room.invite_code != invite_code:
        return Response({'error': 'Invalid invite code'}, status=status.HTTP_400_BAD_REQUEST)
    
    TourRoomMembership.objects.create(room=room, user=request.user)
    return Response({'message': 'Successfully joined the room'})


@api_view(['POST'])
def tour_room_leave(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    membership = TourRoomMembership.objects.filter(room=room, user=request.user).first()
    if not membership:
        return Response({'error': 'Not a member of this room'}, status=status.HTTP_400_BAD_REQUEST)
    
    membership.delete()
    return Response({'message': 'Successfully left the room'})


@api_view(['POST'])
def tour_room_invite(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    membership = TourRoomMembership.objects.filter(room=room, user=request.user, is_admin=True).first()
    if not membership:
        return Response({'error': 'Only admins can invite members'}, status=status.HTTP_403_FORBIDDEN)
    
    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_to_invite = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if TourRoomMembership.objects.filter(room=room, user=user_to_invite).exists():
        return Response({'error': 'User is already a member'}, status=status.HTTP_400_BAD_REQUEST)
    
    TourRoomMembership.objects.create(room=room, user=user_to_invite)
    return Response({'message': f'Successfully invited {username}'})


@api_view(['GET', 'POST'])
def tour_room_members(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        memberships = TourRoomMembership.objects.filter(room=room)
        serializer = TourRoomMembershipSerializer(memberships, many=True)
        return Response(serializer.data)


# Itinerary Views

@api_view(['GET', 'POST'])
def itinerary_items(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        items = ItineraryItem.objects.filter(room=room)
        serializer = ItineraryItemSerializer(items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ItineraryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.validated_data['room'] = room
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def itinerary_item_detail(request, room_id, item_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        item = ItineraryItem.objects.get(id=item_id, room=room)
    except (TourRoom.DoesNotExist, ItineraryItem.DoesNotExist):
        return Response({'error': 'Itinerary item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = ItineraryItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        item.delete()
        return Response({'message': 'Itinerary item deleted'})


# Expense Views

@api_view(['GET', 'POST'])
def expenses(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        expenses = Expense.objects.filter(room=room)
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ExpenseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.validated_data['room'] = room
            serializer.validated_data['payer'] = request.user
            expense = serializer.save()
            
            # Add participants
            participants_data = request.data.get('participants', [])
            for participant_data in participants_data:
                user_id = participant_data.get('user_id')
                share_amount = participant_data.get('share_amount')
                try:
                    user = User.objects.get(id=user_id)
                    ExpenseParticipant.objects.create(
                        expense=expense,
                        user=user,
                        share_amount=share_amount
                    )
                except User.DoesNotExist:
                    continue
            
            return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def expense_detail(request, room_id, expense_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        expense = Expense.objects.get(id=expense_id, room=room)
    except (TourRoom.DoesNotExist, Expense.DoesNotExist):
        return Response({'error': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = ExpenseSerializer(expense, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        expense.delete()
        return Response({'message': 'Expense deleted'})


@api_view(['PUT'])
def expense_participant_payment(request, room_id, expense_id, participant_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        expense = Expense.objects.get(id=expense_id, room=room)
        participant = ExpenseParticipant.objects.get(id=participant_id, expense=expense)
    except (TourRoom.DoesNotExist, Expense.DoesNotExist, ExpenseParticipant.DoesNotExist):
        return Response({'error': 'Participant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    is_paid = request.data.get('is_paid', False)
    participant.is_paid = is_paid
    participant.save()
    return Response(ExpenseParticipantSerializer(participant).data)


# Poll Views

@api_view(['GET', 'POST'])
def polls(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        polls = Poll.objects.filter(room=room)
        serializer = PollSerializer(polls, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PollSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.validated_data['room'] = room
            serializer.validated_data['created_by'] = request.user
            poll = serializer.save()
            
            # Add options
            options_data = request.data.get('options', [])
            for option_text in options_data:
                PollOption.objects.create(poll=poll, option_text=option_text)
            
            return Response(PollSerializer(poll, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def poll_vote(request, room_id, poll_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        poll = Poll.objects.get(id=poll_id, room=room)
    except (TourRoom.DoesNotExist, Poll.DoesNotExist):
        return Response({'error': 'Poll not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if poll.is_closed:
        return Response({'error': 'Poll is closed'}, status=status.HTTP_400_BAD_REQUEST)
    
    option_id = request.data.get('option_id')
    if not option_id:
        return Response({'error': 'Option ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        option = PollOption.objects.get(id=option_id, poll=poll)
    except PollOption.DoesNotExist:
        return Response({'error': 'Option not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already voted
    if PollVote.objects.filter(poll=poll, user=request.user).exists():
        return Response({'error': 'Already voted'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create vote
    vote = PollVote.objects.create(poll=poll, user=request.user, option=option)
    option.vote_count += 1
    option.save()
    
    return Response(PollVoteSerializer(vote).data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
def poll_close(request, room_id, poll_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        poll = Poll.objects.get(id=poll_id, room=room)
    except (TourRoom.DoesNotExist, Poll.DoesNotExist):
        return Response({'error': 'Poll not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if poll.created_by != request.user:
        return Response({'error': 'Only poll creator can close the poll'}, status=status.HTTP_403_FORBIDDEN)
    
    poll.is_closed = True
    poll.save()
    return Response(PollSerializer(poll, context={'request': request}).data)


# Checklist Views

@api_view(['GET', 'POST'])
def checklist_items(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        items = ChecklistItem.objects.filter(room=room)
        serializer = ChecklistItemSerializer(items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ChecklistItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.validated_data['room'] = room
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def checklist_item_detail(request, room_id, item_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        item = ChecklistItem.objects.get(id=item_id, room=room)
    except (TourRoom.DoesNotExist, ChecklistItem.DoesNotExist):
        return Response({'error': 'Checklist item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = ChecklistItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            # Mark as completed
            if request.data.get('is_completed') and not item.is_completed:
                serializer.validated_data['completed_by'] = request.user
                serializer.validated_data['completed_at'] = timezone.now()
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        item.delete()
        return Response({'message': 'Checklist item deleted'})


# Chat Views

@api_view(['GET', 'POST'])
def chat_messages(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        messages = ChatMessage.objects.filter(room=room)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.validated_data['room'] = room
            serializer.validated_data['user'] = request.user
            message = serializer.save()
            
            # Handle attachments
            attachments_data = request.data.get('attachments', [])
            for attachment_data in attachments_data:
                import base64
                file_data = attachment_data.get('file_data')
                if file_data and isinstance(file_data, str):
                    if file_data.startswith('data:'):
                        file_data = file_data.split(',')[1]
                    file_binary = base64.b64decode(file_data)
                    ChatAttachment.objects.create(
                        message=message,
                        file_name=attachment_data.get('file_name'),
                        file_data=file_binary,
                        file_type=attachment_data.get('file_type')
                    )
            
            return Response(ChatMessageSerializer(message).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def chat_message_pin(request, room_id, message_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        message = ChatMessage.objects.get(id=message_id, room=room)
    except (TourRoom.DoesNotExist, ChatMessage.DoesNotExist):
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)
    
    is_pinned = request.data.get('is_pinned', False)
    message.is_pinned = is_pinned
    message.save()
    return Response(ChatMessageSerializer(message).data)


# Map Views

@api_view(['GET', 'POST'])
def map_pins(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        pins = MapPin.objects.filter(room=room)
        serializer = MapPinSerializer(pins, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = MapPinSerializer(data=request.data)
        if serializer.is_valid():
            serializer.validated_data['room'] = room
            serializer.validated_data['added_by'] = request.user
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def map_pin_detail(request, room_id, pin_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        pin = MapPin.objects.get(id=pin_id, room=room)
    except (TourRoom.DoesNotExist, MapPin.DoesNotExist):
        return Response({'error': 'Map pin not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if pin.added_by != request.user:
        return Response({'error': 'Only the creator can delete this pin'}, status=status.HTTP_403_FORBIDDEN)
    
    pin.delete()
    return Response({'message': 'Map pin deleted'})


# Booking Notes Views

@api_view(['GET', 'POST'])
def booking_notes(request, room_id):
    try:
        room = TourRoom.objects.get(id=room_id)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        notes = BookingNote.objects.filter(room=room)
        serializer = BookingNoteSerializer(notes, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = BookingNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.validated_data['room'] = room
            serializer.validated_data['added_by'] = request.user
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def booking_note_detail(request, room_id, note_id):
    try:
        room = TourRoom.objects.get(id=room_id)
        note = BookingNote.objects.get(id=note_id, room=room)
    except (TourRoom.DoesNotExist, BookingNote.DoesNotExist):
        return Response({'error': 'Booking note not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        if note.added_by != request.user:
            return Response({'error': 'Only the creator can update this note'}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingNoteSerializer(note, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if note.added_by != request.user:
            return Response({'error': 'Only the creator can delete this note'}, status=status.HTTP_403_FORBIDDEN)

        note.delete()
        return Response({'message': 'Booking note deleted'})


# Tour Guide & Local Bookings Views

@api_view(['GET', 'POST'])
def tour_guides(request):
    if request.method == 'GET':
        guides = TourGuide.objects.filter(is_available=True)
        # Filter by destination
        destination = request.query_params.get('destination')
        if destination:
            guides = guides.filter(destinations__name__icontains=destination)
        # Filter by service type
        service_type = request.query_params.get('service_type')
        if service_type:
            guides = guides.filter(service_type=service_type)
        # Filter by language
        language = request.query_params.get('language')
        if language:
            guides = guides.filter(languages__icontains=language)
        # Filter by price range
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            guides = guides.filter(price_per_day__gte=min_price)
        if max_price:
            guides = guides.filter(price_per_day__lte=max_price)
        # Filter by rating
        min_rating = request.query_params.get('min_rating')
        if min_rating:
            guides = guides.filter(rating__gte=min_rating)

        serializer = TourGuideSerializer(guides, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = TourGuideSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def tour_guide_detail(request, guide_id):
    try:
        guide = TourGuide.objects.get(id=guide_id)
    except TourGuide.DoesNotExist:
        return Response({'error': 'Tour guide not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TourGuideSerializer(guide, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = TourGuideSerializer(guide, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        guide.delete()
        return Response({'message': 'Tour guide deleted'})


@api_view(['GET', 'POST'])
def guide_availabilities(request, guide_id):
    try:
        guide = TourGuide.objects.get(id=guide_id)
    except TourGuide.DoesNotExist:
        return Response({'error': 'Tour guide not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        availabilities = GuideAvailability.objects.filter(guide=guide)
        serializer = GuideAvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = GuideAvailabilitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(guide=guide)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@csrf_exempt
def guide_reviews(request, guide_id):
    try:
        guide = TourGuide.objects.get(id=guide_id)
    except TourGuide.DoesNotExist:
        return Response({'error': 'Tour guide not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        reviews = GuideReview.objects.filter(guide=guide)
        serializer = GuideReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = GuideReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(guide=guide)
            # Update guide rating
            guide.reviews_count += 1
            guide.rating = (guide.rating * (guide.reviews_count - 1) + serializer.validated_data['rating']) / guide.reviews_count
            guide.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@csrf_exempt
def guide_bookings(request):
    if request.method == 'GET':
        bookings = GuideBooking.objects.all()
        serializer = GuideBookingSerializer(bookings, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = GuideBookingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def guide_booking_detail(request, booking_id):
    try:
        booking = GuideBooking.objects.get(id=booking_id)
    except GuideBooking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = GuideBookingSerializer(booking)
        return Response(serializer.data)

    elif request.method == 'PUT':
        if booking.user != request.user:
            return Response({'error': 'Only the booking owner can update this booking'}, status=status.HTTP_403_FORBIDDEN)
        serializer = GuideBookingSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if booking.user != request.user:
            return Response({'error': 'Only the booking owner can delete this booking'}, status=status.HTTP_403_FORBIDDEN)
        booking.delete()
        return Response({'message': 'Booking deleted'})


@api_view(['GET', 'POST'])
def boat_charters(request):
    if request.method == 'GET':
        charters = BoatCharter.objects.filter(is_available=True)
        # Filter by destination
        destination = request.query_params.get('destination')
        if destination:
            charters = charters.filter(destination__name__icontains=destination)
        # Filter by boat type
        boat_type = request.query_params.get('boat_type')
        if boat_type:
            charters = charters.filter(boat_type=boat_type)
        # Filter by capacity
        min_capacity = request.query_params.get('min_capacity')
        if min_capacity:
            charters = charters.filter(capacity__gte=min_capacity)
        # Filter by price range
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            charters = charters.filter(price_per_hour__gte=min_price)
        if max_price:
            charters = charters.filter(price_per_hour__lte=max_price)
        # Filter by rating
        min_rating = request.query_params.get('min_rating')
        if min_rating:
            charters = charters.filter(rating__gte=min_rating)

        serializer = BoatCharterSerializer(charters, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = BoatCharterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def boat_charter_detail(request, charter_id):
    try:
        charter = BoatCharter.objects.get(id=charter_id)
    except BoatCharter.DoesNotExist:
        return Response({'error': 'Boat charter not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = BoatCharterSerializer(charter, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = BoatCharterSerializer(charter, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        charter.delete()
        return Response({'message': 'Boat charter deleted'})


@api_view(['GET', 'POST'])
@csrf_exempt
def boat_charter_reviews(request, charter_id):
    try:
        charter = BoatCharter.objects.get(id=charter_id)
    except BoatCharter.DoesNotExist:
        return Response({'error': 'Boat charter not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        reviews = BoatCharterReview.objects.filter(charter=charter)
        serializer = BoatCharterReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = BoatCharterReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(charter=charter)
            # Update charter rating
            charter.reviews_count += 1
            charter.rating = (charter.rating * (charter.reviews_count - 1) + serializer.validated_data['rating']) / charter.reviews_count
            charter.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@csrf_exempt
def boat_charter_bookings(request):
    if request.method == 'GET':
        bookings = BoatCharterBooking.objects.all()
        serializer = BoatCharterBookingSerializer(bookings, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = BoatCharterBookingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def boat_charter_booking_detail(request, booking_id):
    try:
        booking = BoatCharterBooking.objects.get(id=booking_id)
    except BoatCharterBooking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = BoatCharterBookingSerializer(booking)
        return Response(serializer.data)

    elif request.method == 'PUT':
        if booking.user != request.user:
            return Response({'error': 'Only the booking owner can update this booking'}, status=status.HTTP_403_FORBIDDEN)
        serializer = BoatCharterBookingSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if booking.user != request.user:
            return Response({'error': 'Only the booking owner can delete this booking'}, status=status.HTTP_403_FORBIDDEN)
        booking.delete()
        return Response({'message': 'Booking deleted'})


@api_view(['GET', 'POST'])
def vehicle_rentals(request):
    if request.method == 'GET':
        rentals = VehicleRental.objects.filter(is_available=True)
        # Filter by destination
        destination = request.query_params.get('destination')
        if destination:
            rentals = rentals.filter(destination__name__icontains=destination)
        # Filter by vehicle type
        vehicle_type = request.query_params.get('vehicle_type')
        if vehicle_type:
            rentals = rentals.filter(vehicle_type=vehicle_type)
        # Filter by capacity
        min_capacity = request.query_params.get('min_capacity')
        if min_capacity:
            rentals = rentals.filter(capacity__gte=min_capacity)
        # Filter by price range
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            rentals = rentals.filter(price_per_day__gte=min_price)
        if max_price:
            rentals = rentals.filter(price_per_day__lte=max_price)
        # Filter by rating
        min_rating = request.query_params.get('min_rating')
        if min_rating:
            rentals = rentals.filter(rating__gte=min_rating)

        serializer = VehicleRentalSerializer(rentals, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = VehicleRentalSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def vehicle_rental_detail(request, rental_id):
    try:
        rental = VehicleRental.objects.get(id=rental_id)
    except VehicleRental.DoesNotExist:
        return Response({'error': 'Vehicle rental not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = VehicleRentalSerializer(rental, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = VehicleRentalSerializer(rental, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        rental.delete()
        return Response({'message': 'Vehicle rental deleted'})


@api_view(['GET', 'POST'])
@csrf_exempt
def vehicle_rental_reviews(request, rental_id):
    try:
        rental = VehicleRental.objects.get(id=rental_id)
    except VehicleRental.DoesNotExist:
        return Response({'error': 'Vehicle rental not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        reviews = VehicleRentalReview.objects.filter(rental=rental)
        serializer = VehicleRentalReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = VehicleRentalReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(rental=rental)
            # Update rental rating
            rental.reviews_count += 1
            rental.rating = (rental.rating * (rental.reviews_count - 1) + serializer.validated_data['rating']) / rental.reviews_count
            rental.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@csrf_exempt
def vehicle_rental_bookings(request):
    if request.method == 'GET':
        bookings = VehicleRentalBooking.objects.all()
        serializer = VehicleRentalBookingSerializer(bookings, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = VehicleRentalBookingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def vehicle_rental_booking_detail(request, booking_id):
    try:
        booking = VehicleRentalBooking.objects.get(id=booking_id)
    except VehicleRentalBooking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = VehicleRentalBookingSerializer(booking)
        return Response(serializer.data)

    elif request.method == 'PUT':
        if booking.user != request.user:
            return Response({'error': 'Only the booking owner can update this booking'}, status=status.HTTP_403_FORBIDDEN)
        serializer = VehicleRentalBookingSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if booking.user != request.user:
            return Response({'error': 'Only the booking owner can delete this booking'}, status=status.HTTP_403_FORBIDDEN)
        booking.delete()
        return Response({'message': 'Booking deleted'})
