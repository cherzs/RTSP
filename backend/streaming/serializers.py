from rest_framework import serializers
from .models import Stream

class StreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = ['id', 'rtsp_url', 'title', 'description', 'is_active', 
                 'created_at', 'updated_at', 'viewer_count', 'last_frame_time']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_active', 
                           'viewer_count', 'last_frame_time']

class CreateStreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = ['rtsp_url', 'title', 'description']