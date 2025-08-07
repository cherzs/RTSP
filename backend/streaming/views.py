from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import JsonResponse
from .models import Stream
from .serializers import StreamSerializer, CreateStreamSerializer
import logging

logger = logging.getLogger(__name__)

class StreamViewSet(viewsets.ModelViewSet):
    queryset = Stream.objects.all()
    serializer_class = StreamSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateStreamSerializer
        return StreamSerializer
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Received POST request data: {request.data}")
        logger.info(f"Request content type: {request.content_type}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract title from URL if not provided
        if not serializer.validated_data.get('title'):
            rtsp_url = serializer.validated_data['rtsp_url']
            # Simple title extraction from URL
            title = f"Stream {rtsp_url.split('/')[-1] or 'Camera'}"
            serializer.validated_data['title'] = title
        
        stream = serializer.save()
        response_serializer = StreamSerializer(stream)
        
        logger.info(f"Created new stream: {stream.id} - {stream.rtsp_url}")
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        stream = self.get_object()
        stream.is_active = True
        stream.save()
        
        return Response({
            'status': 'started',
            'stream_id': str(stream.id),
            'message': f'Stream {stream.title} started'
        })
    
    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        stream = self.get_object()
        stream.is_active = False
        stream.viewer_count = 0
        stream.save()
        
        return Response({
            'status': 'stopped',
            'stream_id': str(stream.id),
            'message': f'Stream {stream.title} stopped'
        })