#!/bin/bash

echo "🚀 Starting AI Resume Scout Backend Server..."
echo ""
echo "🌐 Server will be available at: http://localhost:8000"
echo "📚 API documentation at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "===================================="
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Start the server
python run_server.py