from django.db import models


class Destination(models.Model):
    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    region = models.CharField(max_length=80)
    category = models.CharField(max_length=80)
    budget = models.CharField(max_length=50)
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    duration = models.CharField(max_length=80, blank=True)
    season = models.CharField(max_length=80, blank=True)
    summary = models.TextField(blank=True)
    description = models.TextField(blank=True)
    hero = models.URLField(blank=True)
    coords_lat = models.FloatField(null=True, blank=True)
    coords_lng = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Attraction(models.Model):
    destination = models.ForeignKey(Destination, related_name='attractions', on_delete=models.CASCADE)
    name = models.CharField(max_length=140)

    def __str__(self):
        return f'{self.name} — {self.destination.name}'


class Accommodation(models.Model):
    destination = models.ForeignKey(Destination, related_name='accommodations', on_delete=models.CASCADE)
    name = models.CharField(max_length=180)
    price = models.CharField(max_length=100)
    summary = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Review(models.Model):
    destination = models.ForeignKey(Destination, related_name='reviews', on_delete=models.CASCADE)
    author = models.CharField(max_length=120)
    score = models.PositiveSmallIntegerField()
    note = models.TextField(blank=True)

    def __str__(self):
        return f'{self.author} — {self.destination.name}'


class TourGroup(models.Model):
    destination = models.ForeignKey(Destination, related_name='groups', on_delete=models.CASCADE)
    name = models.CharField(max_length=180)
    members = models.PositiveSmallIntegerField()
    departure = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Guide(models.Model):
    name = models.CharField(max_length=160)
    location = models.CharField(max_length=120)
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    bio = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Route(models.Model):
    from_location = models.CharField(max_length=120)
    to_location = models.CharField(max_length=120)
    mode = models.CharField(max_length=80)
    operator = models.CharField(max_length=160)
    fare = models.PositiveIntegerField()
    duration = models.CharField(max_length=80)
    departure = models.CharField(max_length=60)
    travel_class = models.CharField(max_length=120)
    tips = models.TextField(blank=True)
    path = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['from_location', 'to_location', 'mode']

    def __str__(self):
        return f'{self.from_location} → {self.to_location} ({self.mode})'
