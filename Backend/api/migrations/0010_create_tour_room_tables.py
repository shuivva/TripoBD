# Create missing TourRoom and TourRoomMembership tables in MySQL

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0008_add_weekly_views_db'),
    ]

    operations = [
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
    ]
