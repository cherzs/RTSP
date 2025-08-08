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
import subprocess
import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
                

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
            # Configure OpenCV for better RTSP/HTTP support with multiple fallback options
            self.cap = None
            
            # Try different OpenCV backends and configurations for RTSP
            if self.rtsp_url.startswith('rtsp://'):
                # List of configurations to try in order of preference
                rtsp_configs = [
                    # Configuration 1: FFmpeg backend with TCP transport (most reliable)
                    {
                        'url': self.rtsp_url + '?tcp',
                        'backend': cv2.CAP_FFMPEG,
                        'options': {
                            cv2.CAP_PROP_OPEN_TIMEOUT_MSEC: 10000,
                            cv2.CAP_PROP_READ_TIMEOUT_MSEC: 10000,
                            cv2.CAP_PROP_BUFFERSIZE: 1,
                            cv2.CAP_PROP_FPS: 15
                        }
                    },
                    # Configuration 2: Standard URL with longer timeouts
                    {
                        'url': self.rtsp_url,
                        'backend': cv2.CAP_FFMPEG,
                        'options': {
                            cv2.CAP_PROP_OPEN_TIMEOUT_MSEC: 15000,
                            cv2.CAP_PROP_READ_TIMEOUT_MSEC: 15000,
                            cv2.CAP_PROP_BUFFERSIZE: 1,
                            cv2.CAP_PROP_FPS: 10
                        }
                    },
                    # Configuration 3: Any available backend
                    {
                        'url': self.rtsp_url,
                        'backend': cv2.CAP_ANY,
                        'options': {
                            cv2.CAP_PROP_OPEN_TIMEOUT_MSEC: 20000,
                            cv2.CAP_PROP_READ_TIMEOUT_MSEC: 20000,
                            cv2.CAP_PROP_BUFFERSIZE: 2
                        }
                    }
                ]
                
                # Try each configuration until one works
                for i, config in enumerate(rtsp_configs):
                    logger.info(f"Trying RTSP connection method {i+1}/3 for {self.stream_id}")
                    try:
                        self.cap = cv2.VideoCapture(config['url'], config['backend'])
                        
                        # Apply configuration options
                        for prop, value in config['options'].items():
                            self.cap.set(prop, value)
                        
                        # Test if the capture is working
                        if self.cap.isOpened():
                            # Try to read a test frame to verify connection
                            ret, test_frame = self.cap.read()
                            if ret and test_frame is not None:
                                logger.info(f"Successfully connected using method {i+1}")
                                break
                            else:
                                logger.warning(f"Method {i+1} opened but couldn't read frame")
                                self.cap.release()
                                self.cap = None
                        else:
                            logger.warning(f"Method {i+1} failed to open")
                            if self.cap:
                                self.cap.release()
                            self.cap = None
                    except Exception as e:
                        logger.warning(f"Method {i+1} failed with error: {e}")
                        if self.cap:
                            self.cap.release()
                        self.cap = None
            
            elif self.rtsp_url.startswith(('http://', 'https://')):
                # HTTP video settings
                self.cap = cv2.VideoCapture(self.rtsp_url)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)  # Larger buffer for HTTP
                self.cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 10000)
                self.cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 10000)
            
            else:
                # Default for other protocols
                self.cap = cv2.VideoCapture(self.rtsp_url)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                self.cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 10000)
                self.cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 10000)
            
            if not self.cap or not self.cap.isOpened():
                logger.warning(f"OpenCV failed to open stream: {self.rtsp_url}")
                logger.info(f"Trying FFmpeg direct method for {self.stream_id}")
                
                # Try FFmpeg direct approach as last resort
                if self._try_ffmpeg_stream():
                    return
                
                logger.error(f"Failed to open stream with all methods: {self.rtsp_url}")
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
            consecutive_failures = 0
            max_failures = 10  # Allow some frame read failures before giving up
            
            while self.is_running:
                ret, frame = self.cap.read()
                
                if not ret:
                    consecutive_failures += 1
                    logger.warning(f"Failed to read frame from {self.rtsp_url} (failure {consecutive_failures}/{max_failures})")
                    
                    if consecutive_failures >= max_failures:
                        logger.error(f"Too many consecutive frame read failures for {self.rtsp_url}")
                        self._send_error("Stream connection lost after multiple failed frame reads")
                        break
                        
                    # Brief pause before retrying
                    time.sleep(0.1)
                    continue
                
                # Reset failure counter on successful read
                consecutive_failures = 0
                
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
                time.sleep(0.1)
                
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
    
    def _try_ffmpeg_stream(self):
        """Try to use FFmpeg directly for difficult RTSP streams"""
        try:
            # Send connection attempt message
            self._send_message({
                'type': 'stream_started',
                'stream_id': self.stream_id,
                'rtsp_url': self.rtsp_url,
                'message': 'Attempting FFmpeg direct connection...'
            })
            
            # Configure FFmpeg command for RTSP stream
            ffmpeg_cmd = [
                'ffmpeg',
                '-rtsp_transport', 'tcp',  # Force TCP transport
                '-i', self.rtsp_url,
                '-vf', 'scale=640:-1',  # Resize to 640px width
                '-c:v', 'mjpeg',  # MJPEG codec for easier processing
                '-f', 'image2pipe',  # Output as image stream
                '-r', '10',  # 10 FPS
                '-q:v', '5',  # Good quality
                'pipe:1'
            ]
            
            # Start FFmpeg process
            process = subprocess.Popen(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0
            )
            
            logger.info(f"Started FFmpeg process for {self.stream_id}")
            
            # Send successful connection message
            self._send_message({
                'type': 'stream_started',
                'stream_id': self.stream_id,
                'rtsp_url': self.rtsp_url,
                'message': 'Stream connected successfully via FFmpeg'
            })
            
            frame_count = 0
            buffer = b''
            
            while self.is_running:
                # Read data from FFmpeg
                chunk = process.stdout.read(4096)
                if not chunk:
                    break
                
                buffer += chunk
                
                # Look for JPEG markers to extract complete frames
                while True:
                    # Find JPEG start marker (0xFFD8)
                    start = buffer.find(b'\xff\xd8')
                    if start == -1:
                        break
                    
                    # Find JPEG end marker (0xFFD9)
                    end = buffer.find(b'\xff\xd9', start + 2)
                    if end == -1:
                        break
                    
                    # Extract complete JPEG frame
                    frame_data = buffer[start:end + 2]
                    buffer = buffer[end + 2:]
                    
                    # Convert to base64 and send
                    frame_b64 = base64.b64encode(frame_data).decode('utf-8')
                    self._send_frame(frame_b64)
                    
                    frame_count += 1
                    
                    # Control frame rate
                    time.sleep(0.1)
            
            # Clean up process
            process.terminate()
            process.wait()
            
            return True
            
        except Exception as e:
            logger.error(f"FFmpeg stream processing failed: {str(e)}")
            self._send_error(f"FFmpeg streaming error: {str(e)}")
            return False
    
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
        
        # Send to all consumers using proper async handling
        self._send_to_consumers(message)
    
    def _send_message(self, message):
        """Send a message to all consumers"""
        self._send_to_consumers(message)
    
    def _send_to_consumers(self, message):
        """Thread-safe method to send messages to all consumers"""
        failed_consumers = []
        
        for consumer in self.consumers.copy():
            try:
                # Use Django Channels' group messaging which is thread-safe
                # This is the recommended approach for sending messages from threads
                
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.send)(
                    consumer.channel_name,
                    {
                        "type": "send_json",
                        "text": message
                    }
                )
                
            except Exception as e:
                logger.error(f"Failed to send message to consumer: {e}")
                failed_consumers.append(consumer)
        
        # Remove failed consumers
        for consumer in failed_consumers:
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