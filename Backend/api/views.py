from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.core.mail import send_mail
from django.conf import settings
import traceback
import json
from .models import (
    Destination, Guide, Route, UserProfile, OTPVerification, ServiceProvider,
    TourRoom, TourRoomMember, TourRoomItinerary, TourRoomExpense, TourRoomPoll,
    TourRoomPollVote, TourRoomChecklist, TourGroup as TourGroupModel, TourGroupMember,
    Booking, TravelerReview, TripStory, Notification, Wishlist, TravelPreferences,
    Badge, UserBadge, AIConversation, SupportTicket
)
from .serializers import (
    DestinationListSerializer,
    DestinationDetailSerializer,
    GuideSerializer,
    RouteSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    OTPVerificationSerializer,
    ServiceProviderSerializer,
    TourRoomSerializer,
    TourRoomMemberSerializer,
    TourRoomItinerarySerializer,
    TourRoomExpenseSerializer,
    TourRoomPollSerializer,
    TourRoomChecklistSerializer,
    TourGroupModelSerializer,
    TourGroupMemberSerializer,
    BookingSerializer,
    TravelerReviewSerializer,
    TripStorySerializer,
    NotificationSerializer,
    WishlistSerializer,
    TravelPreferencesSerializer,
    BadgeSerializer,
    UserBadgeSerializer,
    AIConversationSerializer,
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

        # Get user type from profile
        user_type = 'traveler'
        if hasattr(user, 'profile'):
            user_type = user.profile.user_type

        return Response({'message': 'Login successful', 'user_id': user.id, 'username': user.username, 'user_type': user_type}, status=status.HTTP_200_OK)

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
@parser_classes([MultiPartParser, FormParser])
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
            profile_serializer.save()
            
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
@parser_classes([MultiPartParser, FormParser])
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

        profile_serializer.save()

        # Step 2-4: Create service provider profile
        # Handle portfolio_photos - it comes as JSON string from frontend
        portfolio_photos = request.data.get('portfolio_photos')
        if isinstance(portfolio_photos, str):
            try:
                portfolio_photos = json.loads(portfolio_photos)
            except json.JSONDecodeError:
                portfolio_photos = []

        service_provider_data = {
            'user': user.id,
            'service_type': request.data.get('service_type'),
            'specialized_destinations': request.data.get('specialized_destinations'),
            'years_of_experience': request.data.get('years_of_experience'),
            'languages_offered': request.data.get('languages_offered'),
            'fee_range': request.data.get('fee_range'),
            'nid_scan': request.data.get('nid_scan'),
            'certification': request.data.get('certification'),
            'portfolio_photos': portfolio_photos,
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


@api_view(['GET'])
def get_service_provider_profile(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id)
        if not hasattr(user, 'service_provider'):
            return Response({'error': 'Service provider profile not found'}, status=status.HTTP_404_NOT_FOUND)

        sp = user.service_provider
        profile = user.profile

        response_data = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': profile.full_name,
            'phone_number': profile.phone_number,
            'date_of_birth': profile.date_of_birth,
            'gender': profile.gender,
            'division': profile.division,
            'district': profile.district,
            'profile_photo': profile.profile_photo.url if profile.profile_photo else None,
            'national_id': profile.national_id,
            'service_type': sp.service_type,
            'specialized_destinations': sp.specialized_destinations,
            'years_of_experience': sp.years_of_experience,
            'languages_offered': sp.languages_offered,
            'fee_range': sp.fee_range,
            'nid_scan': sp.nid_scan.url if sp.nid_scan else None,
            'certification': sp.certification.url if sp.certification else None,
            'portfolio_photos': sp.portfolio_photos,
            'bank_account_details': sp.bank_account_details,
            'is_verified': sp.is_verified,
            'submitted_at': sp.submitted_at,
            'verified_at': sp.verified_at,
        }

        return Response(response_data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print('get_service_provider_profile error:', e)
        traceback.print_exc()
        return Response({'error': 'Server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@parser_classes([MultiPartParser, FormParser])
def update_service_provider_profile(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id)
        if not hasattr(user, 'service_provider'):
            return Response({'error': 'Service provider profile not found'}, status=status.HTTP_404_NOT_FOUND)

        profile = user.profile
        sp = user.service_provider

        # Update user profile fields
        if request.data.get('full_name'):
            profile.full_name = request.data.get('full_name')
        if request.data.get('phone_number'):
            profile.phone_number = request.data.get('phone_number')
        if request.data.get('profile_photo'):
            profile.profile_photo = request.data.get('profile_photo')

        # Update service provider fields
        if request.data.get('specialized_destinations'):
            sp.specialized_destinations = request.data.get('specialized_destinations')
        if request.data.get('years_of_experience'):
            sp.years_of_experience = request.data.get('years_of_experience')
        if request.data.get('languages_offered'):
            sp.languages_offered = request.data.get('languages_offered')
        if request.data.get('fee_range'):
            sp.fee_range = request.data.get('fee_range')
        if request.data.get('bank_account_details'):
            sp.bank_account_details = request.data.get('bank_account_details')

        profile.save()
        sp.save()

        return Response({'message': 'Profile updated successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print('update_service_provider_profile error:', e)
        traceback.print_exc()
        return Response({'error': 'Server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_traveler_profile(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id)
        if not hasattr(user, 'profile'):
            return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

        profile = user.profile

        response_data = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': profile.full_name,
            'phone_number': profile.phone_number,
            'date_of_birth': profile.date_of_birth,
            'gender': profile.gender,
            'division': profile.division,
            'district': profile.district,
            'profile_photo': profile.profile_photo.url if profile.profile_photo else None,
            'national_id': profile.national_id,
            'user_type': profile.user_type,
            'is_email_verified': profile.is_email_verified,
            'created_at': profile.created_at,
        }

        return Response(response_data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print('get_traveler_profile error:', e)
        traceback.print_exc()
        return Response({'error': 'Server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@parser_classes([MultiPartParser, FormParser])
def update_traveler_profile(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id)
        if not hasattr(user, 'profile'):
            return Response({'error': 'Traveler profile not found'}, status=status.HTTP_404_NOT_FOUND)

        profile = user.profile

        # Update user profile fields
        if request.data.get('full_name'):
            profile.full_name = request.data.get('full_name')
        if request.data.get('phone_number'):
            profile.phone_number = request.data.get('phone_number')
        if request.data.get('profile_photo'):
            profile.profile_photo = request.data.get('profile_photo')
        if request.data.get('date_of_birth'):
            profile.date_of_birth = request.data.get('date_of_birth')
        if request.data.get('gender'):
            profile.gender = request.data.get('gender')
        if request.data.get('division'):
            profile.division = request.data.get('division')
        if request.data.get('district'):
            profile.district = request.data.get('district')
        if request.data.get('national_id'):
            profile.national_id = request.data.get('national_id')

        profile.save()

        return Response({'message': 'Profile updated successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print('update_traveler_profile error:', e)
        traceback.print_exc()
        return Response({'error': 'Server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Tour Room API Views
@api_view(['GET', 'POST'])
def tour_rooms(request):
    user_id = request.query_params.get('user_id')
    
    if request.method == 'GET':
        if user_id:
            tour_rooms = TourRoom.objects.filter(members__id=user_id, is_archived=False)
        else:
            tour_rooms = TourRoom.objects.filter(room_type='public', is_archived=False)
        serializer = TourRoomSerializer(tour_rooms, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TourRoomSerializer(data=request.data)
        if serializer.is_valid():
            tour_room = serializer.save(created_by=request.user if request.user.is_authenticated else User.objects.first())
            # Add creator as owner
            TourRoomMember.objects.create(
                tour_room=tour_room,
                user=tour_room.created_by,
                role='owner'
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def tour_room_detail(request, pk):
    try:
        tour_room = TourRoom.objects.get(pk=pk)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = TourRoomSerializer(tour_room)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TourRoomSerializer(tour_room, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        tour_room.delete()
        return Response({'message': 'Tour room deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
def join_tour_room(request, pk):
    try:
        tour_room = TourRoom.objects.get(pk=pk)
        user_id = request.data.get('user_id')
        user = User.objects.get(id=user_id)
        
        if tour_room.members.count() >= tour_room.max_members:
            return Response({'error': 'Tour room is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        TourRoomMember.objects.create(
            tour_room=tour_room,
            user=user,
            role='member'
        )
        return Response({'message': 'Joined tour room successfully'}, status=status.HTTP_200_OK)
    except TourRoom.DoesNotExist:
        return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# Tour Group API Views
@api_view(['GET', 'POST'])
def tour_groups(request):
    user_id = request.query_params.get('user_id')
    
    if request.method == 'GET':
        if user_id:
            tour_groups = TourGroupModel.objects.filter(members__id=user_id)
        else:
            tour_groups = TourGroupModel.objects.filter(is_open=True)
        serializer = TourGroupModelSerializer(tour_groups, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TourGroupModelSerializer(data=request.data)
        if serializer.is_valid():
            tour_group = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def join_tour_group(request, pk):
    try:
        tour_group = TourGroupModel.objects.get(pk=pk)
        user_id = request.data.get('user_id')
        user = User.objects.get(id=user_id)
        
        if tour_group.current_members >= tour_group.max_members:
            return Response({'error': 'Tour group is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        TourGroupMember.objects.create(
            tour_group=tour_group,
            user=user,
            is_approved=(tour_group.membership_fee == 0)
        )
        tour_group.current_members += 1
        tour_group.save()
        return Response({'message': 'Joined tour group successfully'}, status=status.HTTP_200_OK)
    except TourGroupModel.DoesNotExist:
        return Response({'error': 'Tour group not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# Booking API Views
@api_view(['GET', 'POST'])
def bookings(request):
    user_id = request.query_params.get('user_id')
    
    if request.method == 'GET':
        if user_id:
            bookings = Booking.objects.filter(user_id=user_id)
        else:
            bookings = Booking.objects.all()
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def booking_detail(request, pk):
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = BookingSerializer(booking)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = BookingSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        booking.delete()
        return Response({'message': 'Booking deleted successfully'}, status=status.HTTP_200_OK)


# Review API Views
@api_view(['GET', 'POST'])
def traveler_reviews(request):
    user_id = request.query_params.get('user_id')
    
    if request.method == 'GET':
        if user_id:
            reviews = TravelerReview.objects.filter(user_id=user_id)
        else:
            reviews = TravelerReview.objects.all()
        serializer = TravelerReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TravelerReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def traveler_review_detail(request, pk):
    try:
        review = TravelerReview.objects.get(pk=pk)
    except TravelerReview.DoesNotExist:
        return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = TravelerReviewSerializer(review)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TravelerReviewSerializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        review.delete()
        return Response({'message': 'Review deleted successfully'}, status=status.HTTP_200_OK)


# Trip Story API Views
@api_view(['GET', 'POST'])
def trip_stories(request):
    user_id = request.query_params.get('user_id')
    
    if request.method == 'GET':
        if user_id:
            stories = TripStory.objects.filter(user_id=user_id)
        else:
            stories = TripStory.objects.filter(status='published')
        serializer = TripStorySerializer(stories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TripStorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def trip_story_detail(request, pk):
    try:
        story = TripStory.objects.get(pk=pk)
    except TripStory.DoesNotExist:
        return Response({'error': 'Story not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = TripStorySerializer(story)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TripStorySerializer(story, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        story.delete()
        return Response({'message': 'Story deleted successfully'}, status=status.HTTP_200_OK)


# Notification API Views
@api_view(['GET'])
def notifications(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    notifications = Notification.objects.filter(user_id=user_id)[:20]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
def mark_notification_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk)
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT'])
def mark_all_notifications_read(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read'}, status=status.HTTP_200_OK)


# Wishlist API Views
@api_view(['GET', 'POST'])
def wishlist(request):
    user_id = request.query_params.get('user_id')
    
    if request.method == 'GET':
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        wishlist_items = Wishlist.objects.filter(user_id=user_id)
        serializer = WishlistSerializer(wishlist_items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = WishlistSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def wishlist_item(request, pk):
    try:
        item = Wishlist.objects.get(pk=pk)
        item.delete()
        return Response({'message': 'Item removed from wishlist'}, status=status.HTTP_200_OK)
    except Wishlist.DoesNotExist:
        return Response({'error': 'Wishlist item not found'}, status=status.HTTP_404_NOT_FOUND)


# Travel Preferences API Views
@api_view(['GET', 'PUT'])
def travel_preferences(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        if hasattr(user, 'travel_preferences'):
            preferences = user.travel_preferences
        else:
            preferences = TravelPreferences.objects.create(user=user)
        
        if request.method == 'GET':
            serializer = TravelPreferencesSerializer(preferences)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            serializer = TravelPreferencesSerializer(preferences, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# Badge API Views
@api_view(['GET'])
def badges(request):
    badges = Badge.objects.all()
    serializer = BadgeSerializer(badges, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def user_badges(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user_badges = UserBadge.objects.filter(user_id=user_id)
    serializer = UserBadgeSerializer(user_badges, many=True)
    return Response(serializer.data)


# AI Conversation API Views
@api_view(['GET', 'POST'])
def ai_conversations(request):
    user_id = request.query_params.get('user_id')
    
    if request.method == 'GET':
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        conversations = AIConversation.objects.filter(user_id=user_id)[:10]
        serializer = AIConversationSerializer(conversations, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = AIConversationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Support Ticket API Views
@api_view(['GET', 'POST'])
def support_tickets(request):
    user_id = request.query_params.get('user_id')
    
    if request.method == 'GET':
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        tickets = SupportTicket.objects.filter(user_id=user_id)
        serializer = SupportTicketSerializer(tickets, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SupportTicketSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
