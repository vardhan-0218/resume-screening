#!/bin/bash
# AI Resume Scout Startup Script

echo "🚀 Starting AI Resume Scout Application..."

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Check if frontend directory exists  
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found!"
    exit 1
fi

# Change to project root directory
cd "$(dirname "$0")/.."
echo "📁 Project directory: $(pwd)"

# Kill any existing processes on ports 8000 and 8080
echo "🔄 Stopping existing servers..."
pkill -f "python main.py" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Start backend server
echo "🖥️ Starting backend server on port 8000..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
echo "⏳ Waiting for backend to start..."
sleep 5

# Test backend health
echo "🔍 Testing backend health..."
curl -f http://localhost:8000/api/health >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend server is healthy"
else
    echo "❌ Backend server failed to start properly"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server on port 8080..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 AI Resume Scout is now running!"
echo ""
echo "📡 Backend API: http://localhost:8000"
echo "📱 Frontend App: http://localhost:8080"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt signal
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0' INT
wait