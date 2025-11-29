# AI Resume Scout - Quick Start

## 🚀 One-Command Setup & Start

### For Unix/Linux/macOS/WSL:
```bash
# Setup (run once)
./setup.sh

# Start servers
./start.sh
```

### For Windows Command Line:
```cmd
# Setup (run once)
cd backend
python -m pip install -r requirements.txt
cd ../frontend  
npm install
cd ..

# Start backend (Terminal 1)
cd backend
python start_server.py

# Start frontend (Terminal 2) 
cd frontend
npm run dev
```

## 🌐 Access URLs
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📋 Manual Commands

### Backend Setup:
```bash
cd backend
python -m pip install -r requirements.txt
```

### Frontend Setup:
```bash
cd frontend
npm install
```

### Start Backend:
```bash
cd backend
python start_server.py
```

### Start Frontend:
```bash
cd frontend
npm run dev
```

## ⚙️ Requirements
- **Python 3.8+**
- **Node.js 16+**  
- **npm**

## 🎯 Features
- ✅ Resume analysis and scoring
- ✅ HR dashboard for bulk processing
- ✅ Email extraction and notifications
- ✅ PDF report generation
- ✅ Candidate and HR workflows

## 🆘 Need Help?
Check the detailed [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete instructions.