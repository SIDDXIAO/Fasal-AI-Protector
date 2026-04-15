# apps/scanner/models.py
from django.db import models
from django.conf import settings

class PlantDisease(models.Model):
    """Plant disease master data"""
    name = models.CharField(max_length=200)
    scientific_name = models.CharField(max_length=200, blank=True, null=True)
    crop = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ])
    description = models.TextField()
    symptoms = models.TextField()
    remedy = models.JSONField()  # Structured remedy data
    prevention = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'plant_diseases'
        verbose_name = 'Plant Disease'
        verbose_name_plural = 'Plant Diseases'

    def __str__(self):
        return f"{self.crop} - {self.name}"


class ScanHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='scans/', null=True, blank=True)
    
    # Store the results from your ML Service
    disease_name = models.CharField(max_length=255, null=True, blank=True) 
    is_healthy = models.BooleanField(default=False)
    
    # Stores the confidence score (used for efficiency)
    confidence_score = models.FloatField(default=0.0) 
    
    # Automatically saves the date and time of the scan
    scanned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} | {self.disease_name} | {self.scanned_at.strftime('%Y-%m-%d')}"
class CropInsectData(models.Model):
    """Crop-Insect database from uploaded CSV"""
    district = models.CharField(max_length=100)
    village = models.CharField(max_length=200)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    season = models.CharField(max_length=50)
    crop = models.CharField(max_length=100)

    insect_name = models.CharField(max_length=200)
    insect_nickname = models.CharField(max_length=200, blank=True, null=True)
    insect_hindi_name = models.CharField(max_length=200, blank=True, null=True)
    insect_common_name = models.CharField(max_length=200, blank=True, null=True)
    insect_type = models.CharField(max_length=100, blank=True, null=True)

    damage_type = models.TextField(blank=True, null=True)
    how_to_recognize = models.TextField(blank=True, null=True)
    best_control_time = models.CharField(max_length=200, blank=True, null=True)
    pesticide_options = models.TextField(blank=True, null=True)
    mrp_2026 = models.CharField(max_length=100, blank=True, null=True)
    application_method = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'crop_insect_data'
        indexes = [
            models.Index(fields=['district', 'village']),
            models.Index(fields=['crop']),
            models.Index(fields=['insect_name']),
        ]

    def __str__(self):
        return f"{self.village} - {self.crop} - {self.insect_name}"