from django.contrib.gis.db import models
from django.db.models import F, Func

class Road(models.Model):
    name = models.CharField(max_length=255)
    road_type = models.CharField(max_length=50)
    geom = models.LineStringField()  # Stores the geometry (coordinates)
    length_meters = models.FloatField(null=True, blank=True)  # Length in meters
    avg_grade = models.FloatField(null=True, blank=True)  # Average slope percentage

    def __str__(self):
        return self.name

class Trail(models.Model):
    name = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=50)
    geom = models.LineStringField()
    length_meters = models.FloatField(null=True, blank=True)  # Length in meters
    avg_grade = models.FloatField(null=True, blank=True)  # Average slope percentage

    def __str__(self):
        return self.name
