"""
TripoBD Security Infrastructure - Feature 9 (F-09)
Field-Level Encryption for Personally Identifiable Information (PII)

Provides transparent symmetric encryption (AES-128-CBC + HMAC-SHA256 via Fernet)
for sensitive database columns using FIELD_ENCRYPTION_KEY.
Matches specification in TripoBD_Security_Features_Analysis.pdf:
    from api.cryptography_fields import encrypt
    phone_number = encrypt(models.CharField(max_length=15))
    national_id = encrypt(models.CharField(max_length=20, blank=True, null=True))
    bank_account_details = encrypt(models.TextField())
"""
from django.db import models
from encrypted_model_fields.fields import EncryptedCharField, EncryptedTextField


def encrypt(field):
    """
    Wraps standard Django model fields (CharField, TextField) with transparent
    at-rest encryption. Ciphertext is stored in MySQL, but transparently
    decrypted in Python model instances.
    """
    kwargs = {
        'blank': getattr(field, 'blank', False),
        'null': getattr(field, 'null', False),
        'help_text': getattr(field, 'help_text', ''),
    }
    default = getattr(field, 'default', models.NOT_PROVIDED)
    if default is not models.NOT_PROVIDED:
        kwargs['default'] = default

    if getattr(field, 'choices', None):
        kwargs['choices'] = field.choices

    if isinstance(field, models.TextField):
        return EncryptedTextField(**kwargs)
    elif isinstance(field, models.CharField):
        kwargs['max_length'] = getattr(field, 'max_length', 255)
        return EncryptedCharField(**kwargs)
    else:
        return EncryptedCharField(**kwargs)


__all__ = ['encrypt', 'EncryptedCharField', 'EncryptedTextField']
