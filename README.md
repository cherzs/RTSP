# RTSP Stream Viewer

Web application for real-time RTSP camera streaming in browser. Built with React + Django + WebSocket for smooth video streaming performance.

## Live Demo
- **Frontend**: https://rtsp-iota.vercel.app
- **Backend**: https://rtsp-streamer-backend.onrender.com

**Test Stream**: `rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0`

## Features
- ✅ Real-time RTSP streaming in browser  
- ✅ Stream controls (play/pause/stop)
- ✅ Grid layout for multiple streams
- ✅ WebSocket for low-latency streaming
- ✅ Responsive modern UI
- ✅ Robust error handling

## Tech Stack
**Frontend**: React 18 + Styled Components + WebSocket  
**Backend**: Django 5.2 + Channels + FFmpeg + OpenCV  
**Database**: SQLite (dev) / PostgreSQL (prod)  
**Deployment**: Vercel + Render

## Quick Start

### Requirements
- Python 3.11+
- Node.js 18+  
- FFmpeg (see installation below)

#### Install FFmpeg:
**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**macOS:**
```bash
# Using Homebrew
brew install ffmpeg

# Using MacPorts
sudo port install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install epel-release
sudo yum install ffmpeg
```

### Easy Setup

**Linux/macOS:**
```bash
git clone <repo-url>
cd Stream
chmod +x start-dev.sh
./start-dev.sh
```

**Windows:**
```cmd
git clone <repo-url>
cd Stream
# Run commands manually (see Manual Setup below)
```

Script will install dependencies and start:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

### Manual Setup

**Backend:**

*Linux/macOS:*
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export USE_SQLITE=1
python manage.py migrate
uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port 8000 --reload
```

*Windows:*
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
set USE_SQLITE=1
python manage.py migrate
uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port 8000 --reload
```

**Frontend (All platforms):**
```bash
cd frontend
npm install
npm start
```

## Deployment

### Backend to Render
1. Sign up at [render.com](https://render.com)
2. Connect GitHub repo, set **Root Directory**: `backend`
3. **Build Command**: `./build.sh`
4. **Start Command**: `uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port $PORT`
5. Set environment variables:
   ```
   DJANGO_SETTINGS_MODULE=rtsp_streamer.production_settings
   SECRET_KEY=<generate-random>
   DEBUG=False
   ALLOWED_HOSTS=*
   ```

### Frontend to Vercel  
1. Sign up at [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Set environment variables:
   ```
   REACT_APP_BACKEND_URL=https://your-app.onrender.com
   REACT_APP_WS_URL=wss://your-app.onrender.com
   ```
4. Update CORS in production_settings.py with Vercel domain

## Testing

### Test Streams
```bash
# RTSP stream (may need VPN for international access)
rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0

# HTTP video (reliable for testing)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
```

### API Endpoints
```bash
# Health check
curl http://localhost:8000/api/health/

# Create stream
curl -X POST http://localhost:8000/api/streams/ \
  -H "Content-Type: application/json" \
  -d '{"rtsp_url": "rtsp://your-url", "title": "My Stream"}'

# List streams  
curl http://localhost:8000/api/streams/
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/` | Health check |
| GET | `/api/streams/` | List streams |
| POST | `/api/streams/` | Create stream |
| DELETE | `/api/streams/{id}/` | Delete stream |

### WebSocket Events
**Send to server:**
```json
{"type": "start_stream", "rtsp_url": "rtsp://..."}
{"type": "stop_stream"}
{"type": "pause"}
```

**Receive from server:**
```json
{"type": "frame", "stream_id": "...", "frame": "base64_data"}
{"type": "error", "message": "..."}
```

## Configuration

### Environment Files
**Backend (.env):**
```bash
SECRET_KEY=your-secret-key
DEBUG=True
USE_SQLITE=1
```

**Frontend (.env):**
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

## Troubleshooting

**Backend issues:**

*Linux/macOS:*
```bash
# Check Python version
python3 --version

# Reinstall dependencies
pip install -r requirements.txt
```

*Windows:*
```cmd
# Check Python version
python --version

# Reinstall dependencies
pip install -r requirements.txt
```

**Frontend issues (All platforms):**
```bash
# Clear cache
rm -rf node_modules package-lock.json    # Linux/macOS
# rmdir /s node_modules && del package-lock.json    # Windows
npm install
```

**Virtual environment activation:**

*Linux/macOS:*
```bash
source venv/bin/activate
```

*Windows:*
```cmd
venv\Scripts\activate
```

**RTSP connection problems:**
- Check FFmpeg: `ffmpeg -version`
- Try VPN for international streams
- Test with HTTP video streams first
- Windows users: Check Windows Defender/Firewall settings

## Project Structure
```
Stream/
├── backend/           # Django + WebSocket server
├── frontend/          # React app
├── vercel.json        # Vercel deployment config
├── start-dev.sh       # Development startup (Linux/macOS)
├── start-dev.bat      # Development startup (Windows)
├── API.md             # API documentation
└── DEPLOYMENT.md      # Deployment guide
```