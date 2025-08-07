from django.db import models
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
import uuid
import re

def validate_rtsp_url(value):
    """Custom validator for RTSP and HTTP URLs"""
    # Allow HTTP/HTTPS URLs
    if value.startswith(('http://', 'https://')):
        try:
            URLValidator()(value)
            return  # Valid HTTP/HTTPS URL
        except ValidationError:
            pass
    
    # Allow RTSP URLs - simple validation
    if value.startswith('rtsp://'):
        # Very basic validation - just check it has some content after rtsp://
        if len(value) > 7:  # rtsp:// is 7 characters
            return  # Valid RTSP URL
    
    # If we get here, it's neither valid HTTP nor RTSP
    raise ValidationError('Enter a valid RTSP, HTTP, or HTTPS URL.')

class Stream(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rtsp_url = models.CharField(max_length=500, validators=[validate_rtsp_url])
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Stream statistics
    viewer_count = models.IntegerField(default=0)
    last_frame_time = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title or 'Stream'} - {self.rtsp_url[:50]}"