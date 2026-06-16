from datetime import date
from django.utils import timezone
from django.db.models import Sum, Q, Avg
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import (
    ServiceProvider,
    ServiceProviderBooking,
    ServiceProviderReview,
    Destination,
    TourRoom,
    TourRoomMembership,
    TripStory,
    Wishlist,
    PayoutRequest,
    SupportTicket,
    SystemConfig,
    AdminAuditLog,
    Route,
    Accommodation,
    Attraction,
    UserProfile,
)
from .serializers import (
    ServiceProviderProfileSerializer,
    ServiceProviderBookingDetailSerializer,
    PayoutRequestSerializer,
    SupportTicketSerializer,
    AdminAuditLogSerializer,
    UserManagementSerializer,
)

def _get_sp_or_404(user_id):
    try:
        return ServiceProvider.objects.get(user_id=user_id)
    except ServiceProvider.DoesNotExist:
        return None

def _log_admin_action(admin, action, details, request=None):
    ip_addr = ''
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_addr = x_forwarded_for.split(',')[0]
        else:
            ip_addr = request.META.get('REMOTE_ADDR', '')
    AdminAuditLog.objects.create(
        admin=admin,
        action=action,
        details=details,
        ip_address=ip_addr
    )


# =====================================================================
# SECTION 4: GUIDE / SERVICE PROVIDER PORTAL VIEWS
# =====================================================================

@api_view(['GET'])
def guide_dashboard_stats(request, user_id):
    sp = _get_sp_or_404(user_id)
    if not sp:
        return Response({'error': 'Service provider profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # confirmed and pending requests counts
    active_bookings = sp.bookings.filter(status='confirmed').count()
    pending_requests = sp.bookings.filter(status='requested').count()
    
    # earnings
    completed_bookings = sp.bookings.filter(status='completed')
    total_earnings = completed_bookings.aggregate(total=Sum('agreed_fee'))['total'] or 0.0
    
    # rating
    avg_rating = sp.reviews.aggregate(avg=Avg('rating'))['avg'] or 5.0
    
    # Inbox: requested bookings
    inbox_bookings = sp.bookings.filter(status='requested')
    inbox_data = ServiceProviderBookingDetailSerializer(inbox_bookings, many=True).data
    
    # Confirmed Calendar Bookings
    confirmed_bookings = sp.bookings.filter(status='confirmed')
    confirmed_data = ServiceProviderBookingDetailSerializer(confirmed_bookings, many=True).data
    
    # Recent reviews
    recent_reviews = []
    for r in sp.reviews.all()[:5]:
        recent_reviews.append({
            'id': r.id,
            'author': getattr(r.author, 'username', 'Traveler'),
            'rating': r.rating,
            'text': r.text_review,
            'date': r.created_at.isoformat()
        })
        
    return Response({
        'verification_status': 'Verified' if sp.is_verified else 'Pending Verification',
        'active_bookings': active_bookings,
        'pending_requests': pending_requests,
        'total_earnings': float(total_earnings),
        'avg_rating': round(float(avg_rating), 1),
        'inbox': inbox_data,
        'calendar': confirmed_data,
        'recent_reviews': recent_reviews
    })


@api_view(['GET', 'PATCH'])
def guide_profile_detail_update(request, user_id):
    sp = _get_sp_or_404(user_id)
    if not sp:
        return Response({'error': 'Service provider profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        serializer = ServiceProviderProfileSerializer(sp)
        return Response(serializer.data)
        
    elif request.method == 'PATCH':
        serializer = ServiceProviderProfileSerializer(sp, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def guide_booking_actions(request, booking_id):
    booking = ServiceProviderBooking.objects.filter(pk=booking_id).first()
    if not booking:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        
    action = request.data.get('action') # accept, decline, complete, update_notes
    
    if action == 'accept':
        booking.status = 'confirmed'
        booking.agreed_fee = request.data.get('agreed_fee', booking.agreed_fee)
        booking.save()
    elif action == 'decline':
        booking.status = 'cancelled'
        booking.rejection_reason = request.data.get('reason', '')
        booking.save()
    elif action == 'complete':
        booking.status = 'completed'
        booking.save()
    elif action == 'update_notes':
        booking.internal_notes = request.data.get('internal_notes', '')
        booking.save()
    else:
        return Response({'error': 'Invalid booking action'}, status=status.HTTP_400_BAD_REQUEST)
        
    return Response(ServiceProviderBookingDetailSerializer(booking).data)


@api_view(['GET', 'POST'])
def guide_earnings_list(request, user_id):
    sp = _get_sp_or_404(user_id)
    if not sp:
        return Response({'error': 'Service provider profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        completed_bookings = sp.bookings.filter(status='completed')
        total_earnings = completed_bookings.aggregate(total=Sum('agreed_fee'))['total'] or 0.0
        
        # pending settlement
        confirmed_bookings = sp.bookings.filter(status='confirmed')
        pending_settlement = confirmed_bookings.aggregate(total=Sum('agreed_fee'))['total'] or 0.0
        
        # payouts completed
        payouts_completed = sp.payout_requests.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0.0
        
        # payouts requests list
        payout_requests = sp.payout_requests.all()
        payouts_data = PayoutRequestSerializer(payout_requests, many=True).data
        
        # ledger table
        ledger = []
        for b in completed_bookings:
            ledger.append({
                'date': b.end_date.isoformat(),
                'traveler': b.customer.profile.full_name if hasattr(b.customer, 'profile') else b.customer.username,
                'trip': f"Trip with size {b.group_size}",
                'amount': float(b.agreed_fee),
                'status': 'Settled'
            })
            
        return Response({
            'total_earnings': float(total_earnings),
            'pending_settlement': float(pending_settlement),
            'completed_payouts': float(payouts_completed),
            'payouts': payouts_data,
            'ledger': ledger
        })
        
    elif request.method == 'POST':
        amount = request.data.get('amount')
        method = request.data.get('method') # bkash, bank_transfer
        details = request.data.get('details', '')
        
        if not amount or not method:
            return Response({'error': 'Amount and method are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        payout = PayoutRequest.objects.create(
            service_provider=sp,
            amount=amount,
            method=method,
            details=details,
            status='pending'
        )
        return Response(PayoutRequestSerializer(payout).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
def guide_support_tickets(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        tickets = SupportTicket.objects.filter(user=user)
        return Response(SupportTicketSerializer(tickets, many=True).data)
        
    elif request.method == 'POST':
        subject = request.data.get('subject')
        description = request.data.get('description')
        category = request.data.get('category', 'general')
        priority = request.data.get('priority', 'medium')
        
        if not subject or not description:
            return Response({'error': 'Subject and description are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        ticket = SupportTicket.objects.create(
            user=user,
            subject=subject,
            description=description,
            category=category,
            priority=priority,
            status='open'
        )
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


# =====================================================================
# SECTION 5: ADMIN / AUTHORITY PORTAL VIEWS
# =====================================================================

@api_view(['GET'])
def admin_dashboard_stats(request):
    # Verification
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized admin access'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin account not found'}, status=status.HTTP_404_NOT_FOUND)
        
    # KPI cards
    total_users = User.objects.count()
    active_rooms = TourRoom.objects.filter(is_archived=False).count()
    verified_guides = ServiceProvider.objects.filter(is_verified=True).count()
    pending_guides = ServiceProvider.objects.filter(is_verified=False).count()
    destinations_listed = Destination.objects.count()
    total_stories = TripStory.objects.filter(status='published').count()
    open_complaints = SupportTicket.objects.filter(status='open').count()
    
    # Recent feeds
    recent_users = User.objects.order_by('-date_joined')[:5]
    recent_users_data = UserManagementSerializer(recent_users, many=True).data
    
    pending_apps = ServiceProvider.objects.filter(is_verified=False)[:5]
    recent_apps_data = ServiceProviderProfileSerializer(pending_apps, many=True).data
    
    recent_tickets = SupportTicket.objects.order_by('-created_at')[:5]
    recent_tickets_data = SupportTicketSerializer(recent_tickets, many=True).data
    
    return Response({
        'kpi': {
            'total_users': total_users,
            'active_rooms': active_rooms,
            'verified_guides': verified_guides,
            'pending_guides': pending_guides,
            'destinations_listed': destinations_listed,
            'total_stories': total_stories,
            'open_complaints': open_complaints,
        },
        'recent_users': recent_users_data,
        'recent_applications': recent_apps_data,
        'recent_tickets': recent_tickets_data,
    })


@api_view(['GET', 'POST'])
def admin_user_management(request):
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        search_query = request.query_params.get('search', '')
        user_type = request.query_params.get('role', '') # traveler, service_provider
        status_filter = request.query_params.get('status', '') # Active, Suspended
        
        queryset = User.objects.all()
        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(profile__full_name__icontains=search_query)
            )
        if user_type:
            queryset = queryset.filter(profile__user_type=user_type)
        if status_filter == 'Suspended':
            queryset = queryset.filter(is_active=False)
        elif status_filter == 'Active':
            queryset = queryset.filter(is_active=True)
            
        return Response(UserManagementSerializer(queryset, many=True).data)
        
    elif request.method == 'POST':
        target_user_id = request.data.get('user_id')
        action = request.data.get('action') # suspend, ban, reset_password, delete
        reason = request.data.get('reason', 'Admin Action')
        
        target_user = User.objects.filter(pk=target_user_id).first()
        if not target_user:
            return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if action == 'suspend' or action == 'ban':
            target_user.is_active = False
            target_user.save()
            _log_admin_action(admin_user, f"SUSPEND_USER", f"Suspended User {target_user.username}. Reason: {reason}", request)
        elif action == 'unsuspend':
            target_user.is_active = True
            target_user.save()
            _log_admin_action(admin_user, f"UNSUSPEND_USER", f"Unsuspended User {target_user.username}.", request)
        elif action == 'reset_password':
            target_user.set_password('TripoBD@123')
            target_user.save()
            _log_admin_action(admin_user, f"RESET_PASSWORD", f"Reset password for user {target_user.username}", request)
        elif action == 'delete':
            username = target_user.username
            target_user.delete()
            _log_admin_action(admin_user, f"DELETE_USER", f"Deleted user {username}", request)
            return Response({'message': 'User deleted successfully'})
            
        return Response(UserManagementSerializer(target_user).data)


@api_view(['GET', 'POST'])
def admin_guide_verification(request):
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        status_filter = request.query_params.get('status', 'pending') # pending, approved
        if status_filter == 'approved':
            queryset = ServiceProvider.objects.filter(is_verified=True)
        else:
            queryset = ServiceProvider.objects.filter(is_verified=False)
            
        return Response(ServiceProviderProfileSerializer(queryset, many=True).data)
        
    elif request.method == 'POST':
        sp_id = request.data.get('sp_id')
        action = request.data.get('action') # approve, reject
        reason = request.data.get('reason', '')
        
        sp = ServiceProvider.objects.filter(pk=sp_id).first()
        if not sp:
            return Response({'error': 'Service provider application not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if action == 'approve':
            sp.is_verified = True
            sp.verified_at = timezone.now()
            sp.save()
            _log_admin_action(admin_user, f"APPROVE_GUIDE", f"Approved service provider {sp.user.username}", request)
        elif action == 'reject':
            sp.is_verified = False
            sp.save()
            _log_admin_action(admin_user, f"REJECT_GUIDE", f"Rejected service provider {sp.user.username}. Reason: {reason}", request)
            
        return Response(ServiceProviderProfileSerializer(sp).data)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def admin_destination_management(request, dest_slug=None):
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        if dest_slug:
            dest = Destination.objects.filter(slug=dest_slug).first()
            if not dest:
                return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # include transport, hotels, attractions
            routes = Route.objects.filter(to_location__icontains=dest.name)
            hotels = Accommodation.objects.filter(destination=dest)
            spots = Attraction.objects.filter(destination=dest)
            
            routes_data = [{'id': r.id, 'mode': r.mode, 'operator': r.operator, 'fare': float(r.fare), 'duration': r.duration} for r in routes]
            hotels_data = [{'id': h.id, 'name': h.name, 'price': h.price, 'summary': h.summary} for h in hotels]
            spots_data = [{'id': s.id, 'name': s.name} for s in spots]
            
            return Response({
                'destination': {
                    'slug': dest.slug,
                    'name': dest.name,
                    'region': dest.region,
                    'category': dest.category,
                    'budget': dest.budget,
                    'rating': float(dest.rating),
                    'duration': dest.duration,
                    'season': dest.season,
                    'summary': dest.summary,
                    'description': dest.description,
                    'hero': dest.hero,
                    'coords_lat': dest.coords_lat,
                    'coords_lng': dest.coords_lng,
                },
                'routes': routes_data,
                'accommodations': hotels_data,
                'attractions': spots_data
            })
            
        destinations = Destination.objects.all()
        dest_list = []
        for d in destinations:
            dest_list.append({
                'slug': d.slug,
                'name': d.name,
                'region': d.region,
                'category': d.category,
                'views': d.weekly_views,
                'rating': float(d.rating),
                'status': 'Active'
            })
        return Response(dest_list)
        
    elif request.method == 'POST':
        # Add new destination
        name = request.data.get('name')
        region = request.data.get('region')
        category = request.data.get('category')
        description = request.data.get('description', '')
        summary = request.data.get('summary', '')
        budget = request.data.get('budget', 'Medium')
        rating = request.data.get('rating', 4.5)
        duration = request.data.get('duration', '3-5 days')
        season = request.data.get('season', 'Winter')
        hero = request.data.get('hero', '')
        coords_lat = request.data.get('coords_lat')
        coords_lng = request.data.get('coords_lng')
        
        slug = name.lower().replace(' ', '-').replace("'", '')
        
        dest = Destination.objects.create(
            slug=slug,
            name=name,
            region=region,
            category=category,
            description=description,
            summary=summary,
            budget=budget,
            rating=rating,
            duration=duration,
            season=season,
            hero=hero,
            coords_lat=coords_lat,
            coords_lng=coords_lng
        )
        
        _log_admin_action(admin_user, "ADD_DESTINATION", f"Added destination {name}", request)
        return Response({'status': 'success', 'slug': dest.slug}, status=status.HTTP_201_CREATED)
        
    elif request.method == 'PUT':
        # Edit destination
        if not dest_slug:
             return Response({'error': 'Slug required'}, status=status.HTTP_400_BAD_REQUEST)
        dest = Destination.objects.filter(slug=dest_slug).first()
        if not dest:
             return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)
             
        dest.name = request.data.get('name', dest.name)
        dest.region = request.data.get('region', dest.region)
        dest.category = request.data.get('category', dest.category)
        dest.description = request.data.get('description', dest.description)
        dest.summary = request.data.get('summary', dest.summary)
        dest.budget = request.data.get('budget', dest.budget)
        dest.duration = request.data.get('duration', dest.duration)
        dest.season = request.data.get('season', dest.season)
        dest.hero = request.data.get('hero', dest.hero)
        dest.coords_lat = request.data.get('coords_lat', dest.coords_lat)
        dest.coords_lng = request.data.get('coords_lng', dest.coords_lng)
        dest.save()
        
        # update transport, hotels, attractions if supplied
        if 'routes' in request.data:
            # simple clear and rebuild for simplicity
            Route.objects.filter(to_location__icontains=dest.name).delete()
            for r in request.data['routes']:
                Route.objects.create(
                    from_location=r.get('from_location', 'Dhaka'),
                    to_location=dest.name,
                    mode=r.get('mode', 'Bus'),
                    operator=r.get('operator', ''),
                    fare=r.get('fare', 0),
                    duration=r.get('duration', ''),
                    departure=r.get('departure', '08:00 AM'),
                    travel_class=r.get('travel_class', 'Standard Class')
                )
        if 'accommodations' in request.data:
            Accommodation.objects.filter(destination=dest).delete()
            for a in request.data['accommodations']:
                Accommodation.objects.create(
                    destination=dest,
                    name=a.get('name'),
                    price=a.get('price'),
                    summary=a.get('summary', '')
                )
        if 'attractions' in request.data:
            Attraction.objects.filter(destination=dest).delete()
            for at in request.data['attractions']:
                Attraction.objects.create(
                    destination=dest,
                    name=at.get('name')
                )
                
        _log_admin_action(admin_user, "EDIT_DESTINATION", f"Modified destination {dest.name}", request)
        return Response({'status': 'success'})
        
    elif request.method == 'DELETE':
        if not dest_slug:
             return Response({'error': 'Slug required'}, status=status.HTTP_400_BAD_REQUEST)
        dest = Destination.objects.filter(slug=dest_slug).first()
        if not dest:
             return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)
        name = dest.name
        dest.delete()
        _log_admin_action(admin_user, "DELETE_DESTINATION", f"Deleted destination {name}", request)
        return Response({'status': 'success'})


@api_view(['GET', 'POST'])
def admin_content_moderation(request):
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        # Return mock flagged content details
        # In a real database we could flag reviews/stories. We return mock lists
        return Response([
            {
                'id': 1,
                'type': 'story',
                'title': 'Sundarbans Forbidden Path Tour',
                'content': 'We entered the closed reserve areas without forest guards and permission...',
                'author': 'tanvir22',
                'reason': 'Illegal/Unsafe activities mentioned',
                'reports': 4
            },
            {
                'id': 2,
                'type': 'review',
                'title': 'Terrible guide Rafiq',
                'content': 'He charged us double fee and was spamming us to write reviews...',
                'author': 'ayesha_travels',
                'reason': 'Potential spam/personal harassment',
                'reports': 2
            }
        ])
        
    elif request.method == 'POST':
        content_id = request.data.get('content_id')
        content_type = request.data.get('content_type')
        action = request.data.get('action') # approve (keep), remove, suspend_author
        
        # log action
        _log_admin_action(admin_user, "MODERATE_CONTENT", f"Moderated {content_type} ID {content_id} with action {action}", request)
        return Response({'status': 'success'})


@api_view(['GET', 'POST'])
def admin_tour_groups_list(request):
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        rooms = TourRoom.objects.all()
        rooms_data = []
        for r in rooms:
            rooms_data.append({
                'id': r.id,
                'name': r.name,
                'destination': r.destination.name if r.destination else 'General',
                'members': r.memberships.count(),
                'organiser': r.owner.username if r.owner else 'unknown',
                'start_date': r.start_datetime.date().isoformat() if r.start_datetime else '',
                'end_date': r.end_datetime.date().isoformat() if r.end_datetime else '',
                'status': 'Archived' if r.is_archived else 'Active'
            })
        return Response(rooms_data)
        
    elif request.method == 'POST':
        room_id = request.data.get('room_id')
        action = request.data.get('action') # dissolve
        
        room = TourRoom.objects.filter(pk=room_id).first()
        if not room:
            return Response({'error': 'Tour room not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if action == 'dissolve':
            room.is_archived = True
            room.save()
            _log_admin_action(admin_user, "DISSOLVE_GROUP", f"Dissolved Tour Room {room.name}", request)
            
        return Response({'status': 'success'})


@api_view(['GET', 'POST'])
def admin_support_tickets(request):
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        tickets = SupportTicket.objects.all()
        return Response(SupportTicketSerializer(tickets, many=True).data)
        
    elif request.method == 'POST':
        ticket_id = request.data.get('ticket_id')
        action = request.data.get('action') # reply, assign, close
        
        ticket = SupportTicket.objects.filter(pk=ticket_id).first()
        if not ticket:
            return Response({'error': 'Ticket not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if action == 'reply':
            reply_text = request.data.get('reply_text', '')
            conv = ticket.conversation or []
            conv.append({
                'sender': 'admin',
                'sender_name': admin_user.username,
                'message': reply_text,
                'timestamp': timezone.now().isoformat()
            })
            ticket.conversation = conv
            ticket.status = 'in_progress'
            ticket.save()
            _log_admin_action(admin_user, "REPLY_SUPPORT_TICKET", f"Replied to ticket ID {ticket_id}", request)
        elif action == 'assign':
            assignee_id = request.data.get('assignee_id')
            assignee = User.objects.filter(pk=assignee_id).first()
            if assignee:
                ticket.assigned_to = assignee
                ticket.status = 'in_progress'
                ticket.save()
                _log_admin_action(admin_user, "ASSIGN_SUPPORT_TICKET", f"Assigned ticket ID {ticket_id} to {assignee.username}", request)
        elif action == 'close':
            ticket.status = 'closed'
            ticket.save()
            _log_admin_action(admin_user, "CLOSE_SUPPORT_TICKET", f"Closed ticket ID {ticket_id}", request)
            
        return Response(SupportTicketSerializer(ticket).data)


@api_view(['GET', 'POST'])
def admin_system_config(request):
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'GET':
        configs = SystemConfig.objects.all()
        data = {c.key: c.value for c in configs}
        
        # provide defaults if not set
        if 'general' not in data:
            data['general'] = {'app_name': 'TripoBD', 'maintenance_mode': False}
        if 'ai_assistant' not in data:
            data['ai_assistant'] = {'model': 'gemini-1.5-pro', 'response_tone': 'helpful_friendly'}
        return Response(data)
        
    elif request.method == 'POST':
        key = request.data.get('key')
        value = request.data.get('value', {})
        
        if not key:
             return Response({'error': 'Config key required'}, status=status.HTTP_400_BAD_REQUEST)
             
        cfg, _ = SystemConfig.objects.get_or_create(key=key)
        cfg.value = value
        cfg.save()
        
        _log_admin_action(admin_user, "UPDATE_SYSTEM_CONFIG", f"Updated config key '{key}'", request)
        return Response({'status': 'success'})


@api_view(['GET'])
def admin_audit_logs(request):
    user_id = request.query_params.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
        
    logs = AdminAuditLog.objects.all()
    serializer = AdminAuditLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def admin_send_announcement(request):
    user_id = request.query_params.get('admin_id') or request.data.get('admin_id')
    try:
        admin_user = User.objects.get(pk=user_id)
        if not (admin_user.is_staff or admin_user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

    from .models import TravelerNotification, UserProfile
    
    if request.method == 'GET':
        logs = AdminAuditLog.objects.filter(action="SEND_ANNOUNCEMENT").order_by('-created_at')
        announcements = []
        for log in logs:
            announcements.append({
                'id': log.id,
                'details': log.details,
                'date': log.created_at.isoformat()
            })
        return Response(announcements)

    elif request.method == 'POST':
        target_role = request.data.get('target_role', 'all')
        title = request.data.get('title', 'Announcement')
        message = request.data.get('message', '')
        icon = request.data.get('icon', '📢')
        
        if not message:
            return Response({'error': 'Announcement message is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        profiles = UserProfile.objects.all()
        if target_role == 'traveler':
            profiles = profiles.filter(user_type='traveler')
        elif target_role == 'service_provider':
            profiles = profiles.filter(user_type='service_provider')
            
        notifications = []
        for profile in profiles:
            notifications.append(
                TravelerNotification(
                    user_profile=profile,
                    notification_type='update',
                    title=title,
                    message=message,
                    icon=icon,
                    is_read=False
                )
            )
            
        if notifications:
            TravelerNotification.objects.bulk_create(notifications)
            
        _log_admin_action(admin_user, "SEND_ANNOUNCEMENT", f"Sent global announcement: '{title}' to {target_role}. Content: {message}", request)
        return Response({'status': 'success', 'recipient_count': len(notifications)})

