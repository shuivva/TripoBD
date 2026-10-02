import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from api.models import UserProfile, ServiceProvider
from django.db import connection

p = UserProfile.objects.first()
print('Model phone_number:', p.phone_number)
p.save(update_fields=['phone_number'])

with connection.cursor() as cursor:
    cursor.execute('SELECT phone_number FROM user_profiles WHERE id = %s', [p.id])
    raw_in_db = cursor.fetchone()[0]
    print('Raw phone_number in DB:', raw_in_db[:35] + '...')
    assert raw_in_db.startswith('gAAAAA'), 'Raw value should be encrypted Fernet token!'

# Verify transparent decryption
p2 = UserProfile.objects.get(id=p.id)
print('Decrypted phone_number:', p2.phone_number)
assert p2.phone_number == p.phone_number, 'Decrypted value must match original!'
print('VERIFICATION: PERFECT ENCRYPTION AT REST & TRANSPARENT DECRYPTION!')
