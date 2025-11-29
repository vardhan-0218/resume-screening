#!/bin/bash

# AI Resume Scout - Complete Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting AI Resume Scout..."
echo "================================="

# Check if we're in the correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
taskkill //f //im node.exe 2>/dev/null || true
taskkill //f //im python.exe 2>/dev/null || true

# Start backend
echo "🔧 Starting Backend Server (Port 8000)..."
cd backend
python -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
echo "⏳ Waiting for backend initialization..."
sleep 5

# Test backend health
echo "🏥 Testing backend health..."
curl -s http://localhost:8000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Start frontend
echo "🎨 Starting Frontend Server (Port 8080)..."
cd frontend
npm run dev -- --port 8080 &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 AI Resume Scout Started Successfully!"
echo "================================="
echo "🔗 Frontend: http://localhost:8080"
echo "🔗 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo ""
echo "📝 To stop the servers, press Ctrl+C"
echo ""

# Wait for user input to stop
trap 'echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait