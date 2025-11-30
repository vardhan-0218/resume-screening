# AI Resume Scout Backend Setup

## How to Run the Backend

The main FastAPI application is located in `backend/app/main.py`. Here are the available methods to start the backend server:

### Method 1: Using the Python Script (Recommended)
```bash
cd backend
python main.py
```

### Method 2: Using the Startup Script
```bash
# From project root
./scripts/start_app.sh
```

### Method 3: Direct uvicorn Command
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

## Server Information

- **Server URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Key Endpoints

- `POST /api/ats/evaluate-resume` - Single resume ATS evaluation
- `POST /api/resumes/upload` - Upload resume files
- `GET /api/health` - Health check endpoint

## Environment Setup

Make sure you have:
1. Python 3.8+ installed
2. Required packages: `pip install -r requirements.txt`
3. Environment variables set in `.env` file (copy from `.env.example`)

## Services Initialized

When the server starts successfully, you should see:
- AI service initialized (Google AI or OpenAI)
- Vector service loaded with resume data
- Firebase service initialized
- Evidence-Based ATS Service initialized

The server supports hot reloading during development.