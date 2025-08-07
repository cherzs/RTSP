# 📹 RTSP Stream Viewer

A modern web application for viewing RTSP camera streams in real-time through your browser. Built with React frontend and Django backend using WebSocket technology for smooth video streaming.

## 🚀 Live Demo

- **Frontend**: https://rtsp-iota.vercel.app (Vercel)
- **Backend**: https://rtsp-streamer-backend.onrender.com (Render)
- **GitHub Repository**: https://github.com/cherzs/RTSP

### Test RTSP Stream
Use this working test stream: `rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0`

## ✨ Features

- 🎥 **Real-time RTSP Streaming**: View live camera feeds directly in your browser
- 🎛️ **Stream Controls**: Play, pause, and stop individual streams
- 📱 **Responsive Grid Layout**: View multiple streams simultaneously
- 🔄 **WebSocket Technology**: Low-latency real-time video streaming
- ⚡ **High Performance**: Optimized for multiple concurrent streams
- 🎨 **Modern UI**: Clean and intuitive user interface
- 🔧 **Error Handling**: Graceful handling of connection failures
- 📊 **Stream Monitoring**: Real-time connection status indicators

## 🛠️ Tech Stack

### Frontend
- **React.js 18+**: Modern React with hooks and functional components
- **Styled Components**: CSS-in-JS for component styling
- **WebSocket API**: Real-time communication with backend
- **Responsive Design**: Mobile-first responsive layout

### Backend
- **Django 5.2+**: Python web framework
- **Django Channels**: WebSocket support for real-time communication
- **FFmpeg**: Video processing and stream conversion
- **OpenCV**: Computer vision library for frame processing
- **PostgreSQL**: Production database (Railway)
- **Redis**: Channel layer for WebSocket scaling

## 🎯 Project Status

✅ **All Requirements Completed:**
- ✅ React.js frontend with responsive grid layout
- ✅ Django backend with FFmpeg video processing  
- ✅ Django Channels WebSocket real-time streaming
- ✅ RTSP stream URL input and validation
- ✅ Stream controls (play/pause/stop)
- ✅ Multiple simultaneous streams support
- ✅ Error handling and graceful connection failures
- ✅ Production deployment configs (Vercel + Render)
- ✅ Complete setup and deployment documentation

## 📦 Quick Start

### Prerequisites

```bash
# Python 3.11+
python3 --version

# Node.js 18+
node --version

# FFmpeg for video processing
brew install ffmpeg  # macOS
# or
sudo apt install ffmpeg  # Ubuntu/Debian

# PostgreSQL (for production)
brew install postgresql  # macOS
# or
sudo apt install postgresql  # Ubuntu/Debian
```

### 🚀 One-Command Setup

```bash
git clone <your-repo-url>
cd rtsp-stream-viewer
chmod +x start-dev.sh
./start-dev.sh
```

The script will:
- Install all dependencies
- Set up virtual environments
- Run database migrations
- Start both backend (port 8000) and frontend (port 3000)

### 📱 Manual Setup

**Backend Setup:**
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment for development
export USE_SQLITE=1

# Run migrations
python manage.py migrate

# Start development server
uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port 8000 --reload
```

**Frontend Setup:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/api/health/

## 🌐 Deployment

### Backend Deployment (Render)

1. **Create Render Account**: Sign up at [render.com](https://render.com)

2. **Connect Repository**: 
   - Go to Dashboard → New → Web Service
   - Connect your GitHub repository
   - Set **Root Directory**: `backend`

3. **Configuration**:
   - **Build Command**: `./build.sh`
   - **Start Command**: `uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port $PORT`

4. **Environment Variables**:
   ```
   DJANGO_SETTINGS_MODULE=rtsp_streamer.production_settings
   SECRET_KEY=<auto-generate-secure-key>
   DEBUG=False
   ALLOWED_HOSTS=*
   ```

5. **Add Redis Service**:
   - Go to Dashboard → New → Redis
   - Copy the Redis URL to `REDIS_URL` environment variable

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: Sign up at [vercel.com](https://vercel.com)

2. **Deploy from GitHub**:
   - Go to Dashboard → New Project
   - Import your GitHub repository
   - **Root Directory**: Keep as root (Vercel will use `vercel.json` config)

3. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-render-app.onrender.com
   REACT_APP_WS_URL=wss://your-render-app.onrender.com
   ```

4. **Update CORS Settings**:
   - After deployment, update `production_settings.py`
   - Add your Vercel domain to `CORS_ALLOWED_ORIGINS`

### Alternative Deployment Options

**Frontend Alternatives:**
- **GitHub Pages**: Use `gh-pages` package
- **Netlify**: Drag & drop build folder
- **AWS S3 + CloudFront**: Static hosting with CDN

**Backend Alternatives:**
- **Heroku**: Add `Procfile` with `web: uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port $PORT`
- **Railway**: Use `railway.toml` configuration
- **DigitalOcean App Platform**: Use `app.yaml` spec

## 🧪 Testing

### Test RTSP Streams

Use these public streams for testing:

```bash
# Public RTSP streams (may require VPN or specific network access)
rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0

# HTTP streams (more reliable for testing)
https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4
```

### API Testing

```bash
# Health check
curl https://your-backend.onrender.com/api/health/

# List streams
curl https://your-backend.onrender.com/api/streams/

# Create stream
curl -X POST https://your-backend.onrender.com/api/streams/ \
  -H "Content-Type: application/json" \
  -d '{"rtsp_url": "rtsp://your-stream-url", "title": "Test Stream"}'

# WebSocket connection (using wscat)
npm install -g wscat
wscat -c wss://your-backend.onrender.com/ws/stream/STREAM_ID/
```

## 📋 API Documentation

### REST Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|-----------|
| GET | `/` | API information | JSON with endpoints |
| GET | `/api/health/` | Health check | `{"status": "healthy"}` |
| GET | `/api/streams/` | List all streams | Array of stream objects |
| POST | `/api/streams/` | Create new stream | Stream object |
| GET | `/api/streams/{id}/` | Get stream details | Stream object |
| DELETE | `/api/streams/{id}/` | Delete stream | `204 No Content` |
| POST | `/api/streams/{id}/start/` | Start stream | Status message |
| POST | `/api/streams/{id}/stop/` | Stop stream | Status message |

### WebSocket Events

**Client → Server:**
```json
{"type": "start_stream", "rtsp_url": "rtsp://..."}
{"type": "stop_stream"}
{"type": "pause"}
{"type": "play"}
```

**Server → Client:**
```json
{"type": "connection_established", "stream_id": "...", "message": "..."}
{"type": "frame", "stream_id": "...", "frame": "base64_data", "timestamp": "..."}
{"type": "error", "stream_id": "...", "message": "..."}
{"type": "stream_started", "stream_id": "...", "rtsp_url": "..."}
{"type": "stream_stopped", "stream_id": "..."}
```

## 🔧 Configuration

### Environment Variables

**Backend (`backend/.env`):**
```bash
# Development
SECRET_KEY=your-secret-key
DEBUG=True
USE_SQLITE=1
REDIS_URL=redis://localhost:6379

# Production
DJANGO_SETTINGS_MODULE=rtsp_streamer.production_settings
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

**Frontend (`frontend/.env`):**
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

### Database Configuration

**Development (SQLite):**
- Automatically used when `USE_SQLITE=1`
- Database file: `backend/db.sqlite3`

**Production (PostgreSQL):**
- Railway PostgreSQL database
- Connection string in `DATABASE_URL`

## 🐛 Troubleshooting

### Common Issues

**Backend Not Starting:**
```bash
# Check Python version
python3 --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt

# Check database connection
python manage.py dbshell
```

**Frontend Build Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

**FFmpeg Issues:**
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu

# Verify installation
ffmpeg -version
```

**WebSocket Connection Failed:**
```bash
# Check backend is running with ASGI
ps aux | grep uvicorn

# Test WebSocket manually
wscat -c ws://localhost:8000/ws/stream/test/
```

**CORS Errors:**
- Ensure backend URL in frontend config matches deployment
- Check `CORS_ALLOWED_ORIGINS` in production settings
- Verify environment variables are set correctly

### Performance Optimization

**For Multiple Streams:**
- Reduce frame rate in `stream_processor.py`
- Implement frame quality selection
- Use hardware acceleration if available

**For Production:**
- Configure Redis persistence
- Use CDN for static assets
- Implement stream caching
- Monitor resource usage with tools like New Relic

## 📚 Development

### Project Structure

```
rtsp-stream-viewer/
├── backend/                    # Django backend
│   ├── rtsp_streamer/         # Django project
│   │   ├── settings.py        # Development settings
│   │   ├── production_settings.py  # Production settings
│   │   ├── asgi.py           # ASGI configuration
│   │   └── urls.py           # URL routing
│   ├── streaming/             # Django app
│   │   ├── models.py         # Database models
│   │   ├── views.py          # REST API views
│   │   ├── consumers.py      # WebSocket consumers
│   │   ├── routing.py        # WebSocket routing
│   │   └── stream_processor.py  # Video processing
│   ├── requirements.txt       # Python dependencies
│   ├── build.sh              # Render build script
│   └── render.yaml           # Render configuration
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── StreamInput.js   # Stream URL input
│   │   │   ├── StreamViewer.js  # Individual stream viewer
│   │   │   └── StreamGrid.js    # Grid layout
│   │   ├── App.js           # Main application
│   │   └── config.js        # API configuration
│   └── package.json         # Node dependencies
├── vercel.json              # Vercel deployment config
├── start-dev.sh            # Development startup script
└── README.md               # This file
```

### Adding New Features

1. **Backend Features**: 
   - Add new views in `streaming/views.py`
   - Extend WebSocket events in `consumers.py`
   - Modify video processing in `stream_processor.py`

2. **Frontend Features**:
   - Create new components in `src/components/`
   - Update main App component
   - Add new API calls in service files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit: `git commit -am 'Add feature'`
5. Push: `git push origin feature-name`
6. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Full Stack Engineer Coding Test
- Uses public RTSP streams for testing
- Inspired by modern streaming applications
- FFmpeg for video processing
- Django Channels for real-time communication

---

**📹 Built with ❤️ using React.js, Django, and WebSocket technology**

### 🎯 Next Steps

1. **Deploy Backend to Render**:
   - Create account and connect repository
   - Set environment variables
   - Add Redis service

2. **Deploy Frontend to Vercel**:
   - Import project from GitHub
   - Configure environment variables
   - Update CORS settings

3. **Test with RTSP Streams**:
   - Use provided test URLs
   - Test multiple concurrent streams
   - Verify WebSocket connections

4. **Monitor and Optimize**:
   - Check application logs
   - Monitor resource usage
   - Optimize for your specific use case