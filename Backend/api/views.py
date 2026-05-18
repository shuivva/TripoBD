from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.core.mail import send_mail
from django.conf import settings
import traceback
from .models import Destination, Guide, Route, UserProfile, OTPVerification, ServiceProvider
from .serializers import (
    DestinationListSerializer,
    DestinationDetailSerializer,
    GuideSerializer,
    RouteSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    OTPVerificationSerializer,
    ServiceProviderSerializer,
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
