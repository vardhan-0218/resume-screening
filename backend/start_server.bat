@echo off
echo Starting AI Resume Scout Backend Server...
echo.
echo Server will be available at: http://localhost:8000
echo API documentation at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ====================================
echo.

cd /d "%~dp0"
python run_server.py

pause