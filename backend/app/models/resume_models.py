from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class SkillAnalysis(BaseModel):
    skills: List[str]
    experience_years: Optional[int]
    education: List[str]
    projects: List[str] = []
    email: Optional[str] = None
    timestamp: datetime

class ResumeAnalysis(BaseModel):
    id: str
    filename: str
    extracted_text: str
    skills: List[str]
    experience_years: Optional[int]
    education: List[str]
    projects: List[str] = []
    email: Optional[str] = None
    similarity_score: Optional[float] = None
    timestamp: datetime

class JobDescription(BaseModel):
    description: str
    required_skills: List[str]
    nice_to_have_skills: Optional[List[str]] = []
    experience_required: Optional[int] = None
    education_requirements: Optional[List[str]] = []

# New ATS Models
class ATSCandidateProfile(BaseModel):
    """Comprehensive candidate profile for ATS evaluation"""
    candidate_summary: str
    total_experience: int
    relevant_experience: int
    technical_skills: List[str]
    soft_skills: List[str]
    tools_technologies: List[str]
    certifications: List[str]
    education_details: List[str]
    job_titles: List[str]
    projects_responsibilities: List[str]
    achievements_awards: List[str]
    domain_experience: List[str]
    contact_information: Dict[str, str]
    resume_keywords: List[str]
    seniority_level: str  # Junior | Mid | Senior

class ATSJobProfile(BaseModel):
    """Comprehensive job profile for ATS evaluation"""
    mandatory_skills: List[str]
    good_to_have_skills: List[str]
    required_experience: int
    required_tools_technologies: List[str]
    role_responsibilities: List[str]
    education_requirements: List[str]
    preferred_certifications: List[str]
    required_industry_domain: List[str]
    relevant_keywords: List[str]

class ATSScoreBreakdown(BaseModel):
    """Detailed ATS scoring breakdown"""
    skill_match_score: float
    experience_score: float
    keyword_match_score: float
    education_match_score: float
    certifications_score: float
    role_fit_score: float
    tech_stack_match_score: float
    
    # Detailed matching information
    matched_skills: List[str]
    missing_skills: List[str]
    matched_tools: List[str]
    missing_tools: List[str]
    matched_keywords: List[str]
    missing_keywords: List[str]
    matched_certifications: List[str]
    missing_certifications: List[str]

class ATSResult(BaseModel):
    """Complete ATS evaluation result"""
    ats_score: float
    status: str  # SHORTLISTED | BORDERLINE | NOT SHORTLISTED
    score_breakdown: ATSScoreBreakdown
    candidate_profile: ATSCandidateProfile
    job_profile: ATSJobProfile
    professional_summary: str
    improvement_suggestions: List[str]
    keywords_to_add: List[str]
    final_recommendation: str

class ScoringCriteria(BaseModel):
    skill_match_weight: float = 0.35
    experience_weight: float = 0.25
    education_weight: float = 0.15
    project_weight: float = 0.15
    semantic_similarity_weight: float = 0.1

class DetailedScoring(BaseModel):
    skill_match_score: float
    experience_score: float
    education_score: float
    project_score: float
    semantic_similarity_score: float
    skill_details: Dict[str, bool]
    missing_skills: List[str]
    extra_skills: List[str]
    project_details: List[str] = []

class ScoringResult(BaseModel):
    resume_id: str
    filename: str
    total_score: float
    detailed_scoring: DetailedScoring
    candidate_email: Optional[str] = None
    rank: Optional[int] = None
    recommendations: List[str] = []

class BatchAnalysis(BaseModel):
    id: str
    job_description: JobDescription
    results: List[ScoringResult]
    timestamp: datetime
    total_resumes: int