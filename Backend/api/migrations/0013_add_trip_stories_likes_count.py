# Add missing likes_count column to trip_stories table

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_create_notifications_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='tripstory',
            name='likes_count',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
