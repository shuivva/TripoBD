# Maps dashboard models to existing database tables/columns.

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0004_alter_accountsettings_deactivation_reason'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='destination',
                    name='weekly_views',
                    field=models.PositiveIntegerField(default=0),
                ),
                migrations.AddField(
                    model_name='travelstats',
                    name='connections_count',
                    field=models.PositiveIntegerField(default=0),
                ),
                migrations.AddField(
                    model_name='tripstory',
                    name='likes_count',
                    field=models.PositiveIntegerField(default=0),
                ),
                migrations.CreateModel(
                    name='TourRoom',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('name', models.CharField(max_length=200)),
                        ('start_datetime', models.DateTimeField()),
                        ('end_datetime', models.DateTimeField()),
                        ('description', models.TextField(blank=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('destination', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tour_rooms', to='api.destination')),
                    ],
                    options={
                        'db_table': 'api_tourroom',
                        'ordering': ['start_datetime'],
                    },
                ),
                migrations.CreateModel(
                    name='TravelerNotification',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('notification_type', models.CharField(choices=[('booking', 'Booking Update'), ('invite', 'Group Invite'), ('review', 'Review Reminder'), ('update', 'General Update'), ('reminder', 'Reminder')], max_length=20)),
                        ('title', models.CharField(blank=True, default='', max_length=200)),
                        ('message', models.TextField()),
                        ('icon', models.CharField(default='📌', max_length=10)),
                        ('link', models.CharField(blank=True, default='', max_length=255)),
                        ('is_read', models.BooleanField(default=False)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('user_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='api.userprofile')),
                    ],
                    options={
                        'db_table': 'notifications',
                        'ordering': ['-created_at'],
                    },
                ),
                migrations.CreateModel(
                    name='TourRoomMembership',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('joined_at', models.DateTimeField(auto_now_add=True)),
                        ('is_admin', models.BooleanField(default=False)),
                        ('unread_count', models.PositiveIntegerField(default=0)),
                        ('room', models.ForeignKey(db_column='room_id', on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='api.tourroom')),
                        ('user', models.ForeignKey(db_column='user_id', on_delete=django.db.models.deletion.CASCADE, related_name='tour_room_memberships', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'db_table': 'api_tourroommembership',
                        'unique_together': {('room', 'user')},
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
