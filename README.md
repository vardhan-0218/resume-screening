# AI Resume Scout

A modern AI-powered resume screening and ATS (Applicant Tracking System) tool that helps HR professionals and recruiters efficiently evaluate resumes against job descriptions.

## 🚀 Features

- **Intelligent Resume Parsing**: Extract structured data from resumes with evidence-based parsing
- **ATS Scoring**: Professional-grade scoring algorithm with detailed breakdowns
- **Job Description Analysis**: Automatically extract requirements from job postings
- **Batch Processing**: Evaluate multiple resumes simultaneously
- **Real-time Results**: Instant scoring with detailed feedback
- **Professional Reports**: Generate comprehensive evaluation reports

## 🏗️ Project Structure

```
ai-resume-scout/
├── backend/                 # FastAPI backend server
│   ├── app/                # Application code
│   │   ├── models/         # Pydantic models
│   │   └── services/       # Business logic services
│   ├── data/               # Data storage
│   ├── uploads/            # File uploads
│   └── vector_db/          # Vector database
├── frontend/               # React TypeScript frontend
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities
│   └── public/             # Static files
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## 🛠️ Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vardhan-0218/resume-screening.git
   cd ai-resume-scout
   ```

2. **Backend Setup** ([Detailed Guide](./docs/backend-setup.md))
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   python main.py
   ```

3. **Frontend Setup** ([Detailed Guide](./docs/frontend-setup.md))
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Start the Application**
   ```bash
   # From the root directory
   ./scripts/start_app.sh
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📖 Documentation

- [Backend Setup Guide](./docs/backend-setup.md)
- [Frontend Setup Guide](./docs/frontend-setup.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Google AI Configuration
GOOGLE_API_KEY=your_google_api_key_here

# Firebase Configuration  
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Database Configuration
DATABASE_URL=your_database_url

# Other Configuration
DEBUG=True
LOG_LEVEL=INFO
```

## 🚀 Deployment

The application is ready for deployment on platforms like:
- **Backend**: Railway, Render, Heroku, or any cloud platform supporting Python
- **Frontend**: Vercel, Netlify, or any static hosting service

## 📊 Tech Stack

**Backend:**
- FastAPI
- Python 3.8+
- Google AI (Gemini)
- Firebase
- FAISS Vector Database

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Query

## 🎯 Key Components

- **Evidence-Based ATS Service**: Core resume evaluation engine
- **Vector Service**: Semantic search and matching
- **Firebase Service**: Data persistence and user management
- **Text Extraction**: Multi-format resume parsing
- **Scoring Service**: Professional scoring algorithms

### Start Backend:
```bash
cd backend
python main.py
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

**Quick Setup Issues:**
- Make sure Python 3.8+ and Node.js 16+ are installed
- Check that all environment variables are set in `.env`
- Verify API keys are valid (Google AI, Firebase)

**Common Issues:**
- Port conflicts: Change ports in the configuration files
- Import errors: Run `pip install -r requirements.txt` in backend folder
- Frontend issues: Run `npm install` in frontend folder

**Documentation:**
- [Backend Setup Guide](./docs/backend-setup.md)
- [Frontend Setup Guide](./docs/frontend-setup.md)

- [Quick Start Script](./scripts/start_app.sh)

- API Documentation: http://localhost:8000/docs (when server is running)