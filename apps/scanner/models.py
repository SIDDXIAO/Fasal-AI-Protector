"""
Scanner App Models - Plant Disease Detection
"""
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
    """User scan history"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scans')
    image = models.ImageField(upload_to='scans/%Y/%m/', blank=True, null=True)

    # Detection results
    disease = models.ForeignKey(PlantDisease, on_delete=models.SET_NULL, null=True, blank=True)
    is_healthy = models.BooleanField(default=False)
    confidence = models.FloatField(default=0.0)

    # ViT raw predictions (top-k labels + scores)
    predictions = models.JSONField(blank=True, null=True)

    # XLSX Reference Guide se matched disease data
    reference_data = models.JSONField(
        blank=True,
        null=True,
        help_text="Crop_Wise_LEAF_DISEASE_Reference_Guide.xlsx se matched disease info"
    )

    # UP CSV Dataset se matched treatment/pesticide data
    treatments = models.JSONField(
        blank=True,
        null=True,
        help_text="UP_Complete CSV dataset se matched pesticide/treatment records"
    )

    # Dataset match hua ya nahi (debugging ke liye useful)
    dataset_matched = models.BooleanField(default=False)

    # Metadata
    scan_method = models.CharField(max_length=20, choices=[
        ('camera', 'Camera'),
        ('upload', 'Upload'),
    ], default='upload')

    location = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="User ka district - UP CSV data filter ke liye use hota hai"
    )
    notes = models.TextField(blank=True, null=True)

    # Timestamps
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'scan_history'
        ordering = ['-scanned_at']
        verbose_name = 'Scan History'
        verbose_name_plural = 'Scan Histories'

    def __str__(self):
        if self.is_healthy:
            status = "Healthy"
        else:
            disease_name = self.disease.name if self.disease else 'Unknown'
            status = f"Infected - {disease_name}"
        return f"{self.user.username} - {status} ({self.scanned_at.strftime('%Y-%m-%d')})"

    @property
    def status(self):
        return 'safe' if self.is_healthy else 'danger'

    @property
    def result_json(self):
        """
        JSON-serializable result - frontend ko complete data deta hai.
        Reference Guide + Treatment data dono included hain.
        """
        # XLSX se disease details
        ref = self.reference_data or {}
        ref_detail = {
            "disease_name": ref.get("disease_name", ""),
            "hindi_name": ref.get("hindi_name", ""),
            "local_name": ref.get("local_name", ""),
            "type": ref.get("type", ""),
            "damage_description": ref.get("damage_description", ""),
            "how_to_recognize": ref.get("how_to_recognize", ""),
            "best_control_time": ref.get("best_control_time", ""),
            "treatment_options": ref.get("treatment_options", ""),
            "mrp_2026": ref.get("mrp_2026", ""),
            "season": ref.get("season", ""),
        } if ref else None

        return {
            'id': self.id,
            # Basic info
            'disease': self.disease.name if self.disease else ('Healthy Plant' if self.is_healthy else 'Unknown'),
            'is_healthy': self.is_healthy,
            'confidence': round(self.confidence * 100, 2),
            'status': self.status,
            'date': self.scanned_at.strftime('%Y-%m-%d %H:%M'),
            'image_url': self.image.url if self.image else None,

            # Dataset matched data
            'dataset_matched': self.dataset_matched,
            'reference_detail': ref_detail,     # XLSX se disease info
            'treatments': self.treatments or [],  # CSV se pesticide recommendations

            # Raw ViT predictions
            'predictions': self.predictions or [],
        }


class CropInsectData(models.Model):
    """Crop-Insect database from uploaded CSV"""
    district = models.CharField(max_length=100)
    village = models.CharField(max_length=200)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    season = models.CharField(max_length=50)
    crop = models.CharField(max_length=100)

    # Insect details
    insect_name = models.CharField(max_length=200)
    insect_nickname = models.CharField(max_length=200, blank=True, null=True)
    insect_hindi_name = models.CharField(max_length=200, blank=True, null=True)
    insect_common_name = models.CharField(max_length=200, blank=True, null=True)
    insect_type = models.CharField(max_length=100, blank=True, null=True)

    # Treatment info
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