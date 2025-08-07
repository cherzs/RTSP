import cv2
import numpy as np
import base64
import asyncio
import threading
import logging
import time
from datetime import datetime
import ffmpeg
import io

logger = logging.getLogger(__name__)

class StreamProcessor:
    def __init__(self, rtsp_url, stream_id):
        self.rtsp_url = rtsp_url
        self.stream_id = stream_id
        self.is_running = False
        self.cap = None
        self.consumers = set()
        self.thread = None
        
    def add_consumer(self, consumer):
        """Add a WebSocket consumer to receive frames"""
        self.consumers.add(consumer)
        logger.info(f"Added consumer to stream {self.stream_id}. Total: {len(self.consumers)}")
        
    def remove_consumer(self, consumer):
        """Remove a WebSocket consumer"""
        self.consumers.discard(consumer)
        logger.info(f"Removed consumer from stream {self.stream_id}. Total: {len(self.consumers)}")
        
        # Stop stream if no consumers
        if not self.consumers and self.is_running:
            self.stop()
    
    def start(self):
        """Start the stream processing"""
        if self.is_running:
            return
            
        self.is_running = True
        self.thread = threading.Thread(target=self._process_stream, daemon=True)
        self.thread.start()
        logger.info(f"Started stream processor for {self.stream_id}")
    
    def stop(self):
        """Stop the stream processing"""
        self.is_running = False
        if self.cap:
            self.cap.release()
        
        # Notify all consumers that stream stopped
        for consumer in self.consumers.copy():
            asyncio.create_task(consumer.send_json({
                'type': 'stream_stopped',
                'stream_id': self.stream_id,
                'message': 'Stream has been stopped'
            }))
        
        logger.info(f"Stopped stream processor for {self.stream_id}")
    
    def _process_stream(self):
        """Main stream processing loop"""
        try:
            # Configure OpenCV for better RTSP/HTTP support
            self.cap = cv2.VideoCapture(self.rtsp_url)
            
            # Set buffer size to reduce latency
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.cap.set(cv2.CAP_PROP_FPS, 10)  # Limit FPS to reduce load
            
            # Set timeout and options based on stream type
            if self.rtsp_url.startswith('rtsp://'):
                self.cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)
                self.cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)
            elif self.rtsp_url.startswith(('http://', 'https://')):
                # HTTP video settings
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)  # Larger buffer for HTTP
            
            if not self.cap.isOpened():
                logger.error(f"Failed to open stream: {self.rtsp_url}")
                # Try demo mode with test pattern
                logger.info(f"Starting demo mode for {self.stream_id}")
                self._run_demo_mode()
                return
            
            logger.info(f"Successfully opened stream: {self.rtsp_url}")
            
            # Send connection success message
            self._send_message({
                'type': 'stream_started',
                'stream_id': self.stream_id,
                'rtsp_url': self.rtsp_url,
                'message': 'Stream connected successfully'
            })
            
            frame_count = 0
            while self.is_running:
                ret, frame = self.cap.read()
                
                if not ret:
                    logger.warning(f"Failed to read frame from {self.rtsp_url}")
                    continue
                
                # Resize frame to reduce bandwidth
                height, width = frame.shape[:2]
                if width > 640:
                    scale = 640 / width
                    new_width = 640
                    new_height = int(height * scale)
                    frame = cv2.resize(frame, (new_width, new_height))
                
                # Convert frame to JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_data = base64.b64encode(buffer).decode('utf-8')
                
                # Send frame to all consumers
                self._send_frame(frame_data)
                
                frame_count += 1
                
                # Control frame rate (approximately 10 FPS)
                asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"Error in stream processing: {str(e)}")
            self._send_error(f"Stream processing error: {str(e)}")
        finally:
            if self.cap:
                self.cap.release()
            self.is_running = False
    
    def _run_demo_mode(self):
        """Run demo mode with test pattern when real stream fails"""
        try:
            # Send demo mode started message
            self._send_message({
                'type': 'stream_started',
                'stream_id': self.stream_id,
                'rtsp_url': self.rtsp_url,
                'message': 'Demo mode: Generating test pattern (real stream unavailable)'
            })
            
            frame_count = 0
            
            while self.is_running and self.consumers:
                # Create a test pattern frame
                frame = np.zeros((240, 320, 3), dtype=np.uint8)
                
                # Add some color gradient
                for i in range(240):
                    for j in range(320):
                        frame[i, j] = [
                            (i * 255) // 240,  # Red gradient
                            (j * 255) // 320,  # Green gradient
                            ((i + j) * 255) // (240 + 320)  # Blue gradient
                        ]
                
                # Add frame counter text
                cv2.putText(frame, f'Demo Frame {frame_count}', (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(frame, f'Stream: {self.stream_id[:8]}', (10, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                cv2.putText(frame, 'RTSP Stream Unavailable', (10, 90), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                
                # Convert frame to JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_data = base64.b64encode(buffer).decode('utf-8')
                
                # Send frame to all consumers
                self._send_frame(frame_data)
                
                frame_count += 1
                time.sleep(0.2)  # 5 FPS
                
        except Exception as e:
            logger.error(f"Error in demo mode: {str(e)}")
            self._send_error(f"Demo mode error: {str(e)}")
        finally:
            self.is_running = False
    
    def _send_frame(self, frame_data):
        """Send frame data to all consumers"""
        if not self.consumers:
            return
            
        message = {
            'type': 'frame',
            'stream_id': self.stream_id,
            'frame': frame_data,
            'timestamp': datetime.now().isoformat()
        }
        
        # Send to all consumers using thread-safe approach
        for consumer in self.consumers.copy():
            try:
                # Use asyncio.run_coroutine_threadsafe for thread safety
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(consumer.send_json(message))
                loop.close()
            except Exception as e:
                logger.error(f"Failed to send frame to consumer: {e}")
                self.consumers.discard(consumer)
    
    def _send_message(self, message):
        """Send a message to all consumers"""
        for consumer in self.consumers.copy():
            try:
                # Use thread-safe approach for sending messages
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(consumer.send_json(message))
                loop.close()
            except Exception as e:
                logger.error(f"Failed to send message to consumer: {e}")
                self.consumers.discard(consumer)
    
    def _send_error(self, error_message):
        """Send error message to all consumers"""
        message = {
            'type': 'error',
            'stream_id': self.stream_id,
            'message': error_message,
            'timestamp': datetime.now().isoformat()
        }
        self._send_message(message)

# Global dictionary to manage stream processors
stream_processors = {}

def get_stream_processor(stream_id, rtsp_url):
    """Get or create a stream processor"""
    if stream_id not in stream_processors:
        stream_processors[stream_id] = StreamProcessor(rtsp_url, stream_id)
    return stream_processors[stream_id]

def stop_stream_processor(stream_id):
    """Stop and remove a stream processor"""
    if stream_id in stream_processors:
        stream_processors[stream_id].stop()
        del stream_processors[stream_id]