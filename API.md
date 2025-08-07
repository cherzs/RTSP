# API Documentation

Simple API reference for the RTSP Stream Viewer application.

## Base URLs
- **Development**: `http://localhost:8000`
- **Production**: `https://rtsp-streamer-backend.onrender.com`

## REST API Endpoints

### Health Check
```http
GET /api/health/
```
**Response:**
```json
{"status": "healthy"}
```

### Streams Management

#### List all streams
```http
GET /api/streams/
```
**Response:**
```json
[
  {
    "id": 1,
    "title": "My Camera",
    "rtsp_url": "rtsp://example.com/stream",
    "is_active": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Create a new stream
```http
POST /api/streams/
Content-Type: application/json

{
  "rtsp_url": "rtsp://admin:pass@ip:port/path",
  "title": "Optional Stream Name"
}
```
**Response:**
```json
{
  "id": 2,
  "title": "Optional Stream Name",
  "rtsp_url": "rtsp://admin:pass@ip:port/path",
  "is_active": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Get stream details
```http
GET /api/streams/{id}/
```

#### Delete a stream
```http
DELETE /api/streams/{id}/
```
**Response:** `204 No Content`

## WebSocket API

### Connection
Connect to: `ws://localhost:8000/ws/stream/{stream_id}/`

### Messages from Client

#### Start streaming
```json
{
  "type": "start_stream",
  "rtsp_url": "rtsp://admin:pass@ip:port/path"
}
```

#### Stop streaming
```json
{
  "type": "stop_stream"
}
```

#### Pause/Resume
```json
{
  "type": "pause"
}
```
```json
{
  "type": "play"
}
```

### Messages from Server

#### Connection established
```json
{
  "type": "connection_established",
  "stream_id": "123",
  "message": "Connected to stream"
}
```

#### Video frame
```json
{
  "type": "frame",
  "stream_id": "123",
  "frame": "base64_encoded_image_data",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Stream started
```json
{
  "type": "stream_started",
  "stream_id": "123",
  "rtsp_url": "rtsp://...",
  "message": "Stream connected successfully"
}
```

#### Stream stopped
```json
{
  "type": "stream_stopped",
  "stream_id": "123",
  "message": "Stream has been stopped"
}
```

#### Error
```json
{
  "type": "error",
  "stream_id": "123",
  "message": "Error description"
}
```

## Example Usage

### cURL Examples

**Linux/macOS:**
```bash
# Health check
curl http://localhost:8000/api/health/

# Create stream
curl -X POST http://localhost:8000/api/streams/ \
  -H "Content-Type: application/json" \
  -d '{
    "rtsp_url": "rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0",
    "title": "Test Camera"
  }'

# List streams
curl http://localhost:8000/api/streams/

# Delete stream
curl -X DELETE http://localhost:8000/api/streams/1/
```

**Windows (PowerShell):**
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8000/api/health/"

# Create stream
$body = @{
    rtsp_url = "rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0"
    title = "Test Camera"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/streams/" -Method POST -Body $body -ContentType "application/json"

# List streams
Invoke-RestMethod -Uri "http://localhost:8000/api/streams/"

# Delete stream
Invoke-RestMethod -Uri "http://localhost:8000/api/streams/1/" -Method DELETE
```

### JavaScript WebSocket Example

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/stream/1/');

ws.onopen = function() {
    // Start streaming
    ws.send(JSON.stringify({
        type: 'start_stream',
        rtsp_url: 'rtsp://your-stream-url'
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'frame') {
        // Display video frame
        const img = document.getElementById('video');
        img.src = 'data:image/jpeg;base64,' + data.frame;
    }
    
    if (data.type === 'error') {
        console.error('Stream error:', data.message);
    }
};

// Stop streaming
function stopStream() {
    ws.send(JSON.stringify({ type: 'stop_stream' }));
}
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (invalid data)
- `404` - Not Found
- `500` - Server Error

### Common WebSocket Errors
- `"Failed to open stream"` - RTSP URL is invalid or unreachable
- `"Stream not found"` - Stream ID doesn't exist
- `"Connection timeout"` - Network or authentication issue
- `"Unsupported format"` - Video format not supported

## RTSP URL Format

```
rtsp://[username:password@]host[:port]/path[?parameters]
```

**Examples:**
```
rtsp://admin:admin123@192.168.1.100:554/stream1
rtsp://camera.example.com/live
rtsp://user:pass@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0
```

**Common Parameters:**
- `channel=1` - Camera channel number
- `subtype=0` - Stream quality (0=main, 1=sub)
- `tcp=1` - Force TCP transport
