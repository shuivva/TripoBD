import uuid
from django.db import migrations, models


def populate_uuids(apps, schema_editor):
    models_to_update = [
        'ServiceProvider',
        'TripStory',
        'TourRoom',
        'OpenTourGroup',
        'CommunityPost',
        'ServiceProviderBooking',
    ]
    for model_name in models_to_update:
        Model = apps.get_model('api', model_name)
        for obj in Model.objects.all():
            obj.uuid = uuid.uuid4()
            obj.save(update_fields=['uuid'])

    # Sync historical models with matching master record UUIDs
    HistoricalServiceProvider = apps.get_model('api', 'HistoricalServiceProvider')
    ServiceProvider = apps.get_model('api', 'ServiceProvider')
    for h in HistoricalServiceProvider.objects.all():
        try:
            sp = ServiceProvider.objects.get(pk=h.id)
            h.uuid = sp.uuid
        except Exception:
            h.uuid = uuid.uuid4()
        h.save(update_fields=['uuid'])

    HistoricalServiceProviderBooking = apps.get_model('api', 'HistoricalServiceProviderBooking')
    ServiceProviderBooking = apps.get_model('api', 'ServiceProviderBooking')
    for h in HistoricalServiceProviderBooking.objects.all():
        try:
            b = ServiceProviderBooking.objects.get(pk=h.id)
            h.uuid = b.uuid
        except Exception:
            h.uuid = uuid.uuid4()
        h.save(update_fields=['uuid'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_historicalaccountsettings_historicalserviceprovider_and_more'),
    ]

    operations = [
        # Step 1: Add field with null=True and without a static default
        migrations.AddField(
            model_name='serviceprovider',
            name='uuid',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name='historicalserviceprovider',
            name='uuid',
            field=models.UUIDField(db_index=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name='tripstory',
            name='uuid',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name='tourroom',
            name='uuid',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name='opentourgroup',
            name='uuid',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name='communitypost',
            name='uuid',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name='serviceproviderbooking',
            name='uuid',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name='historicalserviceproviderbooking',
            name='uuid',
            field=models.UUIDField(db_index=True, editable=False, null=True),
        ),

        # Step 2: Populate unique UUIDs for all existing rows
        migrations.RunPython(populate_uuids, reverse_code=migrations.RunPython.noop),

        # Step 3: Alter fields to enforce null=False and unique=True with callable default
        migrations.AlterField(
            model_name='serviceprovider',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='historicalserviceprovider',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False),
        ),
        migrations.AlterField(
            model_name='tripstory',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='tourroom',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='opentourgroup',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='communitypost',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='serviceproviderbooking',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='historicalserviceproviderbooking',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False),
        ),
    ]
