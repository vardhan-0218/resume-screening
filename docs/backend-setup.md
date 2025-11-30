# AI Resume Scout Backend

## How to Run the Backend

The main FastAPI application is located in `backend/app/main.py`. Here are multiple ways to start the backend server:

### Method 1: Using the Python Script (Recommended)
```bash
cd backend
python main.py
```

### Method 2: Using Batch File (Windows)
```bash
cd backend
start_server.bat
```

### Method 3: Using Shell Script (Linux/Mac)
```bash
cd backend
./start_server.sh
```

### Method 4: Direct uvicorn Command
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

## Server Information

- **Server URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Key Endpoints

- `POST /api/ats/evaluate-resume` - Single resume ATS evaluation (Candidate side)
- `POST /api/ats/batch-evaluate` - Batch resume evaluation (HR side)
- `GET /api/health` - Health check endpoint

## Environment Setup

Make sure you have:
1. Python 3.8+ installed
2. Required packages: `pip install -r requirements.txt`
3. Environment variables set in `.env` file (copy from `.env.example`)

## Services Initialized

When the server starts successfully, you should see:
- ✅ Google AI service initialized
- ✅ Vector service loaded with resume data
- ✅ Firebase service initialized
- ✅ ATS Scoring Service initialized with professional algorithms

The server supports hot reloading during development.