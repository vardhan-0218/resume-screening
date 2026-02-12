#!/usr/bin/env python3
"""
AI Resume Scout Backend Server
Simple startup script for the FastAPI application
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    """Start the AI Resume Scout backend server"""
    
    # Get the current directory (backend folder)
    backend_dir = Path(__file__).parent.absolute()
    
    # Change to backend directory to ensure proper module loading
    os.chdir(backend_dir)
    
    # Add the backend directory to Python path
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    # Get port from environment variable (for deployment) or use 8000 as default
    port = int(os.getenv("PORT", 8000))
    
    print("Starting AI Resume Scout Backend Server...")
    print(f"Backend directory: {backend_dir}")
    print(f"Server will be available at: http://localhost:{port}")
    print(f"API documentation at: http://localhost:{port}/docs")
    print("=" * 60)
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("DEBUG", "False").lower() == "true",
        log_level="info"
    )

if __name__ == "__main__":
    main()