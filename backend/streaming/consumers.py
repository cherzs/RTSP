import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Stream
from .stream_processor import get_stream_processor, stop_stream_processor
import logging

logger = logging.getLogger(__name__)

class StreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.stream_id = self.scope['url_route']['kwargs']['stream_id']
        self.group_name = f'stream_{self.stream_id}'
        self.stream_processor = None
        
        # Join stream group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'stream_id': self.stream_id,
            'message': 'WebSocket connection established'
        }))
        
        logger.info(f"WebSocket connected for stream {self.stream_id}")

    async def disconnect(self, close_code):
        # Leave stream group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
        # Remove from stream processor
        if self.stream_processor:
            self.stream_processor.remove_consumer(self)
        
        logger.info(f"WebSocket disconnected for stream {self.stream_id}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'start_stream':
                await self.handle_start_stream(data)
            elif message_type == 'stop_stream':
                await self.handle_stop_stream()
            elif message_type == 'pause':
                await self.handle_pause()
            elif message_type == 'play':
                await self.handle_play()
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON message")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error(f"Error: {str(e)}")

    async def handle_start_stream(self, data):
        """Handle start stream request"""
        rtsp_url = data.get('rtsp_url')
        
        if not rtsp_url:
            # Try to get RTSP URL from database
            stream = await self.get_stream_from_db()
            if stream:
                rtsp_url = stream.rtsp_url
            else:
                await self.send_error("No RTSP URL provided and stream not found in database")
                return
        
        # Get or create stream processor
        self.stream_processor = get_stream_processor(self.stream_id, rtsp_url)
        self.stream_processor.add_consumer(self)
        
        # Start the stream if not already running
        if not self.stream_processor.is_running:
            self.stream_processor.start()
        
        # Update database
        await self.update_stream_status(True)
        
        logger.info(f"Started stream {self.stream_id} with URL: {rtsp_url}")

    async def handle_stop_stream(self):
        """Handle stop stream request"""
        if self.stream_processor:
            self.stream_processor.remove_consumer(self)
            self.stream_processor = None
        
        await self.update_stream_status(False)
        
        await self.send(text_data=json.dumps({
            'type': 'stream_stopped',
            'stream_id': self.stream_id,
            'message': 'Stream stopped'
        }))

    async def handle_pause(self):
        """Handle pause request"""
        await self.send(text_data=json.dumps({
            'type': 'stream_paused',
            'stream_id': self.stream_id,
            'message': 'Stream paused (client-side)'
        }))

    async def handle_play(self):
        """Handle play request"""
        await self.send(text_data=json.dumps({
            'type': 'stream_resumed',
            'stream_id': self.stream_id,
            'message': 'Stream resumed'
        }))

    async def send_error(self, message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'stream_id': self.stream_id,
            'message': message
        }))

    async def send_json(self, message):
        """Send JSON message to client"""
        await self.send(text_data=json.dumps(message))

    @database_sync_to_async
    def get_stream_from_db(self):
        """Get stream from database"""
        try:
            return Stream.objects.get(id=self.stream_id)
        except Stream.DoesNotExist:
            return None

    @database_sync_to_async
    def update_stream_status(self, is_active):
        """Update stream status in database"""
        try:
            stream = Stream.objects.get(id=self.stream_id)
            stream.is_active = is_active
            if is_active:
                stream.viewer_count += 1
            else:
                stream.viewer_count = max(0, stream.viewer_count - 1)
            stream.save()
        except Stream.DoesNotExist:
            pass