# Create missing TravelerNotification table in MySQL

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_merge_20260615_1801'),
    ]

    operations = [
        migrations.CreateModel(
            name='TravelerNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('booking', 'Booking Update'), ('group_invite', 'Tour Group Invite'), ('invite', 'Group Invite'), ('review', 'Review Reminder'), ('update', 'General Update'), ('reminder', 'Reminder')], max_length=20)),
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
    ]
