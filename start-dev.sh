#!/bin/bash

echo "🚀 Starting RTSP Stream Viewer Development Environment"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg not found. Installing via brew..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "❌ Please install FFmpeg manually: https://ffmpeg.org/download.html"
        exit 1
    fi
fi

echo " All prerequisites found"

# Kill existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "python.*manage.py" > /dev/null 2>&1 || true
pkill -f "npm.*start" > /dev/null 2>&1 || true
pkill -f "uvicorn" > /dev/null 2>&1 || true
lsof -ti:3000 | xargs kill -9 > /dev/null 2>&1 || true
lsof -ti:8000 | xargs kill -9 > /dev/null 2>&1 || true

echo "🔧 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Set environment variables for development
export USE_SQLITE=1
export DJANGO_SETTINGS_MODULE=rtsp_streamer.settings

# Run Django migrations
echo "Running database migrations..."
python manage.py migrate

# Start Django backend with uvicorn (supports WebSockets)
echo "🚀 Starting Django backend with uvicorn on port 8000..."
export DJANGO_SETTINGS_MODULE=rtsp_streamer.settings
uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 8

# Test backend with retry
echo "🧪 Testing backend..."
for i in {1..5}; do
    if curl -s http://localhost:8000/api/health/ > /dev/null 2>&1; then
        echo " Backend is running"
        break
    else
        echo "⏳ Attempt $i/5: Backend not ready yet, waiting..."
        sleep 3
        if [ $i -eq 5 ]; then
            echo "❌ Backend failed to start after 5 attempts"
            echo "🔍 Checking if process is still running..."
            if ps -p $BACKEND_PID > /dev/null; then
                echo " Backend process is running, continuing..."
            else
                echo "❌ Backend process died, exiting..."
                exit 1
            fi
        fi
    fi
done

echo "⚛️  Setting up frontend..."
cd ../frontend

# Start React frontend
echo "🚀 Starting React frontend on port 3000..."
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 10

echo ""
echo "🎉 Development environment is ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 Health Check: http://localhost:8000/api/health/"
echo ""
echo "💡 Test RTSP URL:"
echo "   rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0"
echo ""
echo "Press Ctrl+C to stop all servers"

cleanup() {
    echo ""
    echo "🛑 Stopping all servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    
    # Force kill any remaining processes
    pkill -f "python.*manage.py" > /dev/null 2>&1 || true
    pkill -f "npm.*start" > /dev/null 2>&1 || true
    pkill -f "uvicorn" > /dev/null 2>&1 || true
    
    # Kill by port
    lsof -ti:3000 | xargs kill -9 > /dev/null 2>&1 || true
    lsof -ti:8000 | xargs kill -9 > /dev/null 2>&1 || true
    
    echo " All servers stopped"
    exit 0
}

trap cleanup INT TERM

# Keep script running and monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend process died, restarting..."
        cd /Users/ghaly/Documents/Project/Stream/backend
        source venv/bin/activate
        export DJANGO_SETTINGS_MODULE=rtsp_streamer.settings
        uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port 8000 --reload &
        BACKEND_PID=$!
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend process died, restarting..."
        cd /Users/ghaly/Documents/Project/Stream/frontend
        npm start &
        FRONTEND_PID=$!
    fi
    
    sleep 5
done