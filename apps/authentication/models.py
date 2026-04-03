"""
User Model with extended fields for FasAi protector
"""
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """Extended User model with farmer-specific fields"""
    
    # Profile fields
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    farm_size = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Farm size in acres")
    crops_grown = models.TextField(blank=True, null=True, help_text="Comma-separated crop names")
    
    # Preferences
    language = models.CharField(max_length=10, default='en', choices=[
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('pa', 'Punjabi'),
        ('mr', 'Marathi'),
    ])
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class UserProfile(models.Model):
    """Additional profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    
    # Stats
    total_scans = models.IntegerField(default=0)
    healthy_scans = models.IntegerField(default=0)
    infected_scans = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
