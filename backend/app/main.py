from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from dotenv import load_dotenv

from .services.text_extraction import TextExtractionService
from .services.langchain_service_simple import LangChainService
from .services.vector_service_simple import VectorService
from .services.scoring_service_simple import ScoringService
from .services.firebase_service_simple import FirebaseService
from .services.evidence_based_ats import EvidenceBasedATSService
from .models.resume_models import ResumeAnalysis, JobDescription, ScoringResult, ATSResult

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services cache
_services_cache = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Initializing AI Resume Scout API...")
    
    # Pre-initialize services to improve first request performance
    global _services_cache
    _services_cache['text_service'] = TextExtractionService()
    _services_cache['langchain_service'] = LangChainService()
    _services_cache['vector_service'] = VectorService()
    _services_cache['scoring_service'] = ScoringService()
    _services_cache['firebase_service'] = FirebaseService()
    _services_cache['ats_service'] = EvidenceBasedATSService()
    
    logger.info("Services initialized successfully")
    yield
    
    # Shutdown
    logger.info("Shutting down AI Resume Scout API...")

app = FastAPI(
    title="AI Resume Scout",
    description="Advanced Resume Analysis and Ranking System",
    version="1.0.0",
    lifespan=lifespan
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:8080", 
        "http://localhost:8081", 
        "http://localhost:8082",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Cache-Control",
        "Pragma",
        "Expires",
        "X-Timestamp",
        "X-Request-Id"
    ],
)

# Helper functions
async def _validate_resume_content(text: str) -> bool:
    """Validate that the extracted text contains resume-like content."""
    if not text or len(text.strip()) < 50:
        return False
    
    text_lower = text.lower()
    
    # Immediate rejection patterns - documents that are clearly not resumes
    rejection_patterns = [
        'aadhaar', 'aadhar', 'uid', 'government of india', 'unique identification',
        'pan card', 'passport', 'driving license', 'voter id', 'birth certificate',
        'marriage certificate', 'school leaving certificate', 'mark sheet', 'report card',
        'bank statement', 'salary slip', 'invoice', 'receipt', 'bill payment'
    ]
    
    # If any rejection pattern is found, immediately reject
    for pattern in rejection_patterns:
        if pattern in text_lower:
            logger.warning(f"🚫 Rejected document containing: {pattern}")
            return False
    
    # Resume must have these professional indicators (at least 3 must be present)
    resume_indicators = [
        # Contact information (professional context)
        any(pattern in text_lower for pattern in ['email', '@', 'phone', 'contact', 'linkedin']),
        
        # Professional experience (with professional keywords)
        any(pattern in text_lower for pattern in ['professional experience', 'work experience', 'career history', 'employment history']),
        
        # Education
        any(pattern in text_lower for pattern in ['education', 'degree', 'university', 'college', 'school']),
        
        # Skills/abilities
        any(pattern in text_lower for pattern in ['skill', 'ability', 'proficient', 'knowledge', 'expertise']),
        
        # Professional terms
        any(pattern in text_lower for pattern in ['resume', 'cv', 'curriculum vitae', 'professional', 'manager', 'developer', 'engineer', 'analyst']),
        
        # Projects or achievements
        any(pattern in text_lower for pattern in ['project', 'achievement', 'accomplishment', 'responsibility'])
    ]
    
    indicator_count = sum(resume_indicators)
    
    # Must have at least 4 resume indicators and reasonable length for stricter validation
    logger.info(f"📊 Resume indicators found: {indicator_count}/6")
    return indicator_count >= 4 and len(text.strip()) >= 100

# Services access functions
def get_text_service() -> TextExtractionService:
    return _services_cache.get('text_service') or TextExtractionService()

def get_langchain_service() -> LangChainService:
    return _services_cache.get('langchain_service') or LangChainService()

def get_vector_service() -> VectorService:
    return _services_cache.get('vector_service') or VectorService()

def get_scoring_service() -> ScoringService:
    return _services_cache.get('scoring_service') or ScoringService()

def get_firebase_service() -> FirebaseService:
    return _services_cache.get('firebase_service') or FirebaseService()

def get_ats_service() -> EvidenceBasedATSService:
    return _services_cache.get('ats_service') or EvidenceBasedATSService()

@app.get("/")
async def root():
    return {"message": "AI Resume Scout API", "status": "active"}

# Legacy endpoints removed - using Evidence-Based ATS endpoints only

# Legacy upload endpoint removed - use /api/ats/evaluate-resume instead
@app.post("/api/upload-resume", response_model=ResumeAnalysis)
async def upload_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = None,
    job_description_file: Optional[UploadFile] = None,
    text_service: TextExtractionService = Depends(get_text_service),
    langchain_service: LangChainService = Depends(get_langchain_service),
    vector_service: VectorService = Depends(get_vector_service),
    firebase_service: FirebaseService = Depends(get_firebase_service)
):
    """Upload and analyze a resume file."""
    try:
        # Validate file type and provide detailed error messages
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
            
        file_extension = os.path.splitext(file.filename.lower())[1]
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        
        if file_extension not in allowed_extensions:
            # Check for common non-resume file types
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg']
            video_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv']
            audio_extensions = ['.mp3', '.wav', '.flac', '.aac']
            archive_extensions = ['.zip', '.rar', '.7z', '.tar', '.gz']
            
            if file_extension in image_extensions:
                raise HTTPException(status_code=400, detail=f"Image files ({file_extension}) are not supported. Please upload a resume in PDF, DOC, DOCX, or TXT format.")
            elif file_extension in video_extensions:
                raise HTTPException(status_code=400, detail=f"Video files ({file_extension}) are not supported. Please upload a resume document.")
            elif file_extension in audio_extensions:
                raise HTTPException(status_code=400, detail=f"Audio files ({file_extension}) are not supported. Please upload a resume document.")
            elif file_extension in archive_extensions:
                raise HTTPException(status_code=400, detail=f"Archive files ({file_extension}) are not supported. Please extract and upload the resume document directly.")
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file format '{file_extension}'. Please upload a resume in PDF, DOC, DOCX, or TXT format.")
        
        # Extract text from uploaded file
        file_content = await file.read()
        extracted_text = await text_service.extract_text(file_content, file.filename)
        
        # Debug: Log the first 500 characters of extracted text
        logger.info(f"📄 Extracted text preview ({len(extracted_text)} chars): {extracted_text[:500]}...")
        
        # Validate that the file contains resume-like content
        if not await _validate_resume_content(extracted_text):
            raise HTTPException(
                status_code=400, 
                detail="This file doesn't appear to contain a resume. Please upload a valid resume with professional information like skills, experience, or education."
            )
        
        # Process with LangChain for skill extraction and embeddings
        skills_analysis = await langchain_service.extract_skills(extracted_text)
        
        # Debug: Log extracted skills and info
        logger.info(f"🔍 Skills analysis result:")
        logger.info(f"   Skills: {skills_analysis.skills}")
        logger.info(f"   Experience: {skills_analysis.experience_years} years")
        logger.info(f"   Education: {skills_analysis.education}")
        logger.info(f"   Email: {skills_analysis.email}")
        
        embeddings = await langchain_service.generate_embeddings(extracted_text)
        
        # Create unique resume ID based on content and timestamp
        import hashlib
        content_hash = hashlib.md5((extracted_text + str(datetime.now())).encode()).hexdigest()[:8]
        unique_filename = f"{content_hash}_{file.filename}"
        
        # Store in vector database
        resume_id = await vector_service.store_resume_embedding(
            embeddings, extracted_text, unique_filename
        )
        
        # Handle job description (text or file)
        jd_text = job_description
        if job_description_file and not jd_text:
            # Validate job description file type
            if job_description_file.filename:
                jd_file_extension = os.path.splitext(job_description_file.filename.lower())[1]
                if jd_file_extension not in allowed_extensions:
                    raise HTTPException(status_code=400, detail=f"Unsupported job description file format '{jd_file_extension}'. Please upload in PDF, DOC, DOCX, or TXT format.")
            
            # Extract text from JD file
            jd_file_content = await job_description_file.read()
            jd_text = await text_service.extract_text(jd_file_content, job_description_file.filename)
        
        # Calculate similarity if job description provided
        similarity_score = None
        if jd_text:
            similarity_score = await vector_service.calculate_similarity(
                resume_id, jd_text
            )
        
        # Generate comprehensive analysis
        analysis = ResumeAnalysis(
            id=resume_id,
            filename=file.filename,
            extracted_text=extracted_text,
            skills=skills_analysis.skills,
            experience_years=skills_analysis.experience_years,
            education=skills_analysis.education,
            email=skills_analysis.email,
            similarity_score=similarity_score,
            timestamp=skills_analysis.timestamp
        )
        
        # Store in Firebase
        await firebase_service.store_resume_analysis(analysis)
        
        return analysis
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/api/analyze-batch", response_model=List[ScoringResult])
async def analyze_resume_batch(
    job_description: JobDescription,
    resume_ids: Optional[List[str]] = Query(None),
    firebase_service: FirebaseService = Depends(get_firebase_service),
    scoring_service: ScoringService = Depends(get_scoring_service)
):
    """Analyze multiple resumes against a job description."""
    try:
        # If no specific resumes provided, get all stored resumes
        if not resume_ids:
            resume_ids = await firebase_service.get_all_resume_ids()
        
        results = []
        for resume_id in resume_ids:
            # Get resume data
            resume_data = await firebase_service.get_resume_analysis(resume_id)
            if not resume_data:
                continue
                
            # Calculate comprehensive score
            score_result = await scoring_service.calculate_comprehensive_score(
                resume_data, job_description.description, job_description.required_skills
            )
            
            results.append(score_result)
        
        # Sort by total score
        results.sort(key=lambda x: x.total_score, reverse=True)
        
        # Store batch analysis results
        batch_id = await firebase_service.store_batch_analysis(
            job_description, results
        )
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.get("/api/resume/{resume_id}", response_model=ResumeAnalysis)
async def get_resume_analysis(
    resume_id: str,
    firebase_service: FirebaseService = Depends(get_firebase_service)
):
    """Get detailed analysis for a specific resume."""
    analysis = await firebase_service.get_resume_analysis(resume_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Resume not found")
    return analysis

@app.get("/api/resumes", response_model=List[ResumeAnalysis])
async def list_all_resumes(
    firebase_service: FirebaseService = Depends(get_firebase_service)
):
    """Get all stored resume analyses."""
    return await firebase_service.get_all_resume_analyses()

@app.post("/api/ats/evaluate-resume-by-id", response_model=ATSResult)
async def ats_evaluate_resume_by_id(
    request: dict,
    firebase_service: FirebaseService = Depends(get_firebase_service),
    ats_service: EvidenceBasedATSService = Depends(get_ats_service)
):
    """Evaluate an existing resume by ID against job description."""
    try:
        resume_id = request.get("resume_id")
        job_description = request.get("job_description")
        
        if not resume_id:
            raise HTTPException(status_code=400, detail="Resume ID is required")
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")
        
        # Get existing resume
        resume_data = await firebase_service.get_resume_analysis(resume_id)
        if not resume_data:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Convert job description dict to text if needed
        if isinstance(job_description, dict):
            job_text = f"""
            Job Title: {job_description.get('job_title', 'Not specified')}
            
            Mandatory Skills: {', '.join(job_description.get('mandatory_skills', []))}
            Good to Have Skills: {', '.join(job_description.get('good_to_have_skills', []))}
            Required Experience: {job_description.get('required_experience', 0)} years
            Education: {', '.join(job_description.get('education_requirements', []))}
            Tools & Technologies: {', '.join(job_description.get('required_tools_technologies', []))}
            Industry Domain: {', '.join(job_description.get('required_industry_domain', []))}
            Keywords: {', '.join(job_description.get('relevant_keywords', []))}
            """
        else:
            job_text = str(job_description)
        
        # Perform ATS evaluation
        result = await ats_service.evaluate_candidate(resume_data.extracted_text, job_text)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating resume by ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Resume evaluation failed: {str(e)}")

@app.delete("/api/resume/{resume_id}")
async def delete_resume(
    resume_id: str,
    firebase_service: FirebaseService = Depends(get_firebase_service),
    vector_service: VectorService = Depends(get_vector_service)
):
    """Delete a resume and its analysis."""
    success = await firebase_service.delete_resume_analysis(resume_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Also remove from vector database
    await vector_service.remove_resume_embedding(resume_id)
    
    return {"message": "Resume deleted successfully"}

# New ATS Endpoints
@app.options("/api/ats/evaluate-resume")
async def ats_evaluate_resume_options():
    """Handle preflight OPTIONS request for ATS evaluation endpoint."""
    return {"message": "OK"}

@app.post("/api/ats/evaluate-resume", response_model=ATSResult)
async def ats_evaluate_resume(
    file: UploadFile = File(...),
    job_description: str = Form(..., description="Job description text for ATS evaluation"),
    text_service: TextExtractionService = Depends(get_text_service),
    ats_service: EvidenceBasedATSService = Depends(get_ats_service)
):
    """Comprehensive ATS evaluation of a single resume against job description."""
    try:
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required for ATS evaluation")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
            
        file_extension = os.path.splitext(file.filename.lower())[1]
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Unsupported file format. Please upload PDF, DOC, DOCX, or TXT files.")
        
        # Read and extract text from resume
        file_content = await file.read()
        resume_text = await text_service.extract_text(file_content, file.filename)
        
        if not resume_text or len(resume_text.strip()) < 100:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from resume")
        
        # Perform comprehensive ATS evaluation
        ats_result = await ats_service.evaluate_candidate(resume_text, job_description)
        
        return ats_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ATS evaluation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ATS evaluation failed: {str(e)}")

@app.options("/api/ats/batch-evaluate")
async def ats_batch_evaluate_options():
    """Handle preflight OPTIONS request for batch ATS evaluation endpoint."""
    return {"message": "OK"}

@app.post("/api/ats/batch-evaluate", response_model=List[ATSResult])
async def ats_batch_evaluate(
    files: List[UploadFile] = File(...),
    job_description: str = Form(..., description="Job description text for batch ATS evaluation"),
    text_service: TextExtractionService = Depends(get_text_service),
    ats_service: EvidenceBasedATSService = Depends(get_ats_service)
):
    """Batch ATS evaluation of multiple resumes against a job description."""
    try:
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required for batch ATS evaluation")
        
        if not files:
            raise HTTPException(status_code=400, detail="At least one resume file is required")
            
        if len(files) > 20:  # Limit batch size
            raise HTTPException(status_code=400, detail="Maximum 20 files allowed per batch")
        
        results = []
        
        for file in files:
            try:
                # Validate file
                if not file.filename:
                    logger.warning(f"Skipping file with no filename")
                    continue
                    
                file_extension = os.path.splitext(file.filename.lower())[1]
                allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
                
                if file_extension not in allowed_extensions:
                    logger.warning(f"Skipping unsupported file: {file.filename}")
                    continue
                
                # Extract text
                file_content = await file.read()
                resume_text = await text_service.extract_text(file_content, file.filename)
                
                if not resume_text or len(resume_text.strip()) < 100:
                    logger.warning(f"Skipping file with insufficient content: {file.filename}")
                    continue
                
                # Perform ATS evaluation
                ats_result = await ats_service.evaluate_candidate(resume_text, job_description)
                results.append(ats_result)
                
            except Exception as e:
                logger.error(f"Error processing file {file.filename}: {str(e)}")
                continue
        
        # Sort by ATS score (highest first)
        results.sort(key=lambda x: x.ats_score, reverse=True)
        
        # Add ranking information without modifying original result data
        for i, result in enumerate(results):
            # Create a copy of contact_information to avoid modifying the original
            contact_info = result.candidate_profile.contact_information.copy()
            contact_info['rank'] = str(i + 1)
            result.candidate_profile.contact_information = contact_info
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch ATS evaluation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch ATS evaluation failed: {str(e)}")

class JobDescriptionRequest(BaseModel):
    job_description: str

@app.post("/api/ats/analyze-job-description")
async def analyze_job_description(
    request: JobDescriptionRequest,
    ats_service: EvidenceBasedATSService = Depends(get_ats_service)
):
    """Analyze and extract structured information from job description."""
    try:
        if not request.job_description or len(request.job_description.strip()) < 50:
            raise HTTPException(status_code=400, detail="Job description must be at least 50 characters long")
        
        # Extract job profile
        job_profile = await ats_service._extract_job_profile(request.job_description)
        
        return {
            "job_profile": job_profile,
            "analysis_summary": {
                "mandatory_skills_count": len(job_profile['mandatory_skills']),
                "good_to_have_skills_count": len(job_profile['good_to_have_skills']),
                "required_experience_years": job_profile['required_experience'],
                "tools_technologies_count": len(job_profile['required_tools_technologies']),
                "education_requirements_specified": len(job_profile['education_requirements']) > 0,
                "certifications_preferred": len(job_profile['preferred_certifications']) > 0,
                "industry_domains": job_profile['required_industry_domain'],
                "key_keywords_count": len(job_profile['relevant_keywords'])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing job description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Job description analysis failed: {str(e)}")

@app.post("/api/ats/analyze-job-description-file")
async def analyze_job_description_file(
    file: UploadFile = File(...),
    ats_service: EvidenceBasedATSService = Depends(get_ats_service)
):
    """Analyze and extract structured information from job description file."""
    try:
        if not file.filename or not (file.filename.endswith('.pdf') or file.filename.endswith('.txt') or file.filename.endswith('.docx')):
            raise HTTPException(status_code=400, detail="Only PDF, TXT, and DOCX files are supported")
            
        # Read file content
        content = await file.read()
        
        # Extract text from file
        text_service = TextExtractionService()
        extracted_text = await text_service.extract_text(content, file.filename)
        
        if not extracted_text or len(extracted_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from job description file")
        
        # Extract job profile
        job_profile = await ats_service._extract_job_profile(extracted_text)
        
        return {
            "extracted_text": extracted_text,
            "job_profile": job_profile,
            "analysis_summary": {
                "mandatory_skills_count": len(job_profile['mandatory_skills']),
                "good_to_have_skills_count": len(job_profile['good_to_have_skills']),
                "required_experience_years": job_profile['required_experience'],
                "tools_technologies_count": len(job_profile['required_tools_technologies']),
                "education_requirements_specified": len(job_profile['education_requirements']) > 0,
                "certifications_preferred": len(job_profile['preferred_certifications']) > 0,
                "industry_domains": job_profile['required_industry_domain'],
                "key_keywords_count": len(job_profile['relevant_keywords'])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing job description file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Job description file analysis failed: {str(e)}")

@app.get("/api/debug/storage")
async def debug_storage(
    firebase_service: FirebaseService = Depends(get_firebase_service)
):
    """Debug endpoint to check storage configuration."""
    import os
    from pathlib import Path
    
    storage_path = firebase_service.storage_path
    resumes_path = Path(storage_path) / "resumes"
    
    return {
        "storage_path": storage_path,
        "resumes_path": str(resumes_path.absolute()),
        "path_exists": resumes_path.exists(),
        "working_directory": os.getcwd(),
        "json_files_count": len(list(resumes_path.glob("*.json"))) if resumes_path.exists() else 0,
        "use_firebase": firebase_service.use_firebase
    }

@app.post("/api/migrate-to-firebase")
async def migrate_local_to_firebase(
    firebase_service: FirebaseService = Depends(get_firebase_service)
):
    """Migrate all local resume data to Firebase."""
    try:
        migrated_count = await firebase_service.migrate_local_to_firebase()
        return {
            "success": True,
            "message": f"Successfully migrated {migrated_count} resumes to Firebase",
            "migrated_count": migrated_count
        }
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint for all AI Resume Scout services."""
    return {
        "status": "healthy",
        "message": "AI Resume Scout API is running with Evidence-Based ATS",
        "version": "2.0.0", 
        "services": {
            "text_extraction": "active",
            "langchain": "active", 
            "vector_db": "active",
            "firebase": "active",
            "evidence_based_ats": "active"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)