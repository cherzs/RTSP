#!/bin/bash

echo "Starting RTSP Stream Viewer Development"

# Detect OS
OS="Unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
fi

echo "Detected OS: $OS"

# Check prerequisites
PYTHON_CMD="python3"
if [[ "$OS" == "Windows" ]]; then
    PYTHON_CMD="python"
fi

if ! command -v $PYTHON_CMD &> /dev/null; then
    echo "Python 3 required. Install from python.org"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Node.js required. Install from nodejs.org"
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg not found. Please install:"
    case $OS in
        "Linux")
            echo "  Ubuntu/Debian: sudo apt install ffmpeg"
            echo "  CentOS/RHEL: sudo yum install ffmpeg"
            ;;
        "macOS")
            echo "  Homebrew: brew install ffmpeg"
            echo "  MacPorts: sudo port install ffmpeg"
            ;;
        "Windows")
            echo "  Chocolatey: choco install ffmpeg"
            echo "  Or download from: https://ffmpeg.org/download.html"
            ;;
        *)
            echo "  Download from: https://ffmpeg.org/download.html"
            ;;
    esac
    exit 1
fi

echo "✅ All prerequisites found"

# Cleanup
echo "🧹 Stopping existing processes..."
pkill -f "uvicorn\|manage.py\|npm.*start" > /dev/null 2>&1 || true
lsof -ti:3000,8000 | xargs kill -9 > /dev/null 2>&1 || true

# Setup backend
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment (cross-platform)
if [[ "$OS" == "Windows" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

pip install -r requirements.txt > /dev/null 2>&1

# Set environment variable (cross-platform)
if [[ "$OS" == "Windows" ]]; then
    export USE_SQLITE=1
else
    export USE_SQLITE=1
fi

python manage.py migrate > /dev/null 2>&1

echo "Starting backend on port 8000..."
uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 5

# Test backend
echo "🧪 Testing backend..."
for i in {1..3}; do
    if curl -s http://localhost:8000/api/health/ > /dev/null 2>&1; then
        echo "✅ Backend is running"
        break
    else
        echo "⏳ Waiting for backend... ($i/3)"
        sleep 2
    fi
done

# Setup frontend
echo "⚛️  Setting up frontend..."
cd ../frontend
npm install > /dev/null 2>&1

echo "🚀 Starting frontend on port 3000..."
npm start &
FRONTEND_PID=$!

sleep 3

echo ""
echo "🎉 Development ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "💡 Test RTSP:"
echo "   rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0"
echo ""
echo "Press Ctrl+C to stop servers"

cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "uvicorn\|npm.*start" > /dev/null 2>&1 || true
    lsof -ti:3000,8000 | xargs kill -9 > /dev/null 2>&1 || true
    echo "✅ Stopped"
    exit 0
}

trap cleanup INT TERM

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend died, restarting..."
        cd backend
        source venv/bin/activate
        uvicorn rtsp_streamer.asgi:application --host 0.0.0.0 --port 8000 --reload &
        BACKEND_PID=$!
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend died, restarting..."
        cd frontend
        npm start &
        FRONTEND_PID=$!
    fi
    
    sleep 10
done