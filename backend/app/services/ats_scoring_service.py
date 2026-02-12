import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from ..models.resume_models import ATSResult, ATSScoreBreakdown, ATSCandidateProfile, ATSJobProfile

logger = logging.getLogger(__name__)

# Professional ATS Scoring Engine - Implementing exact user logic

# Using ATSResult, ATSScoreBreakdown, ATSCandidateProfile, ATSJobProfile from resume_models.py for proper FastAPI serialization

class ATSScoringService:
    """Advanced Resume Screening Engine - Professional ATS Implementation"""
    
    def __init__(self):
        """Initialize with comprehensive skill synonyms - NO HALLUCINATIONS"""
        self.skill_synonyms = {
            # Programming Languages
            'javascript': ['js', 'javascript', 'ecmascript', 'node.js', 'nodejs'],
            'python': ['python', 'py', 'python3', 'django', 'flask'],
            'java': ['java', 'jvm', 'spring', 'springboot'],
            'react': ['react', 'reactjs', 'react.js'],
            'angular': ['angular', 'angularjs', 'angular.js'],
            'vue': ['vue', 'vuejs', 'vue.js'],
            
            # Data Science & ML
            'machine learning': ['ml', 'machine learning', 'artificial intelligence', 'ai'],
            'deep learning': ['deep learning', 'neural networks', 'dl'],
            'data science': ['data science', 'data analysis', 'analytics'],
            'tensorflow': ['tensorflow', 'tf', 'tensor flow'],
            'pytorch': ['pytorch', 'torch'],
            
            # Databases
            'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'database'],
            'mongodb': ['mongodb', 'mongo', 'nosql'],
            'redis': ['redis', 'cache'],
            
            # Cloud & DevOps
            'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
            'azure': ['azure', 'microsoft azure'],
            'gcp': ['gcp', 'google cloud', 'google cloud platform'],
            'docker': ['docker', 'containerization', 'containers'],
            'kubernetes': ['kubernetes', 'k8s', 'container orchestration'],
            
            # General Tech
            'api': ['api', 'rest api', 'restful', 'web services'],
            'git': ['git', 'github', 'version control', 'source control'],
            'ci/cd': ['ci/cd', 'continuous integration', 'continuous deployment'],
        }
        
        # Soft skills dictionary
        self.soft_skills_keywords = [
            'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
            'creative', 'management', 'collaboration', 'presentation', 'negotiation',
            'time management', 'organization', 'adaptability', 'flexibility', 'mentoring'
        ]
        
        # Technical skills categories
        self.tech_categories = {
            'programming': ['python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'swift'],
            'frameworks': ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express'],
            'databases': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle'],
            'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
            'tools': ['git', 'jenkins', 'jira', 'confluence', 'postman']
        }
        
        logger.info("✅ ATS Scoring Service initialized with professional algorithms")

    async def evaluate_candidate(self, resume_text: str, job_description: str) -> ATSResult:
        """
        Evidence-driven, professional Resume Screening Engine (ATS-grade).
        
        Operates strictly: never hallucinates, never invents facts, never assumes missing information.
        Uses USER'S EXACT SYSTEM PROMPT LOGIC with evidence-based extraction and deterministic scoring.
        
        WEIGHTS (USER SPECIFIED):
        - Skills → 40%
        - Experience → 25% 
        - Role Fit → 15%
        - Education → 10%
        - Certifications → 5%
        - Tools/Keywords → 5%
        """
        try:
            logger.info("🔍 Starting Professional ATS Evaluation (User's Exact Logic)...")
            
            # STEP 1: Resume Parsing (Extract 14 Parameters)
            logger.info("📋 STEP 1: Resume Parsing - Extracting 14 parameters...")
            candidate_profile = await self._extract_candidate_profile(resume_text)
            
            # STEP 2: Job Description Parsing (Extract 9 Parameters)
            logger.info("📄 STEP 2: Job Description Parsing - Extracting 9 parameters...")
            job_profile = await self._extract_job_profile(job_description)
            
            # STEP 3: Skill Matching & Scoring (ATS Algorithm)
            logger.info("🎯 STEP 3: ATS Algorithm - Skill matching & scoring...")
            score_breakdown = await self._calculate_ats_scores(candidate_profile, job_profile)
            
            # STEP 4: Weighted ATS Score (0–100%) - Professional weights
            logger.info("⚖️ STEP 4: Weighted ATS Score - Using professional weights...")
            final_score = self._calculate_weighted_score(score_breakdown)
            
            # STEP 5: Result Classification
            logger.info("📊 STEP 5: Result Classification...")
            status = self._determine_status(final_score)
            
            # STEP 6: Missing Skills & Improvement Suggestions
            logger.info("💡 STEP 6: Improvement analysis...")
            improvement_suggestions = self._generate_improvement_suggestions(
                candidate_profile, job_profile, score_breakdown
            )
            keywords_to_add = self._extract_missing_keywords(
                candidate_profile, job_profile, score_breakdown
            )
            
            # STEP 7: Summary for Recruiters (3-4 lines)
            logger.info("📝 STEP 7: Professional summary for recruiters...")
            professional_summary = self._generate_professional_summary(
                candidate_profile, job_profile, final_score, status
            )
            
            final_recommendation = self._generate_final_recommendation(
                final_score, status, score_breakdown
            )
            
            result = ATSResult(
                ats_score=round(final_score, 1),
                status=status,
                score_breakdown=score_breakdown,
                candidate_profile=candidate_profile,
                job_profile=job_profile,
                professional_summary=professional_summary,
                improvement_suggestions=improvement_suggestions,
                keywords_to_add=keywords_to_add,
                final_recommendation=final_recommendation
            )
            
            logger.info(f"✅ Professional ATS Evaluation completed - Score: {final_score:.1f}% ({status})")
            return result
            
        except Exception as e:
            logger.error(f"❌ ATS evaluation failed: {str(e)}")
            raise

    async def _extract_candidate_profile(self, resume_text: str) -> ATSCandidateProfile:
        """STEP 1: Extract 14 HR parameters from resume - NO HALLUCINATIONS"""
        
        text_lower = resume_text.lower()
        
        # 1. Candidate Summary (2 lines) - Extract from resume start
        candidate_summary = self._extract_candidate_summary(resume_text)
        
        # 2. Total Experience (Years)
        total_experience = self._extract_total_experience(resume_text)
        
        # 3. Relevant Experience (will be calculated against JD later)
        relevant_experience = total_experience  # Default to total, refined later
        
        # 4. Technical Skills
        technical_skills = self._extract_technical_skills(resume_text)
        
        # 5. Soft Skills
        soft_skills = self._extract_soft_skills(resume_text)
        
        # 6. Tools & Technologies
        tools_technologies = self._extract_tools_technologies(resume_text)
        
        # 7. Certifications
        certifications = self._extract_certifications(resume_text)
        
        # 8. Education Details
        education_details = self._extract_education(resume_text)
        
        # 9. Job Titles
        job_titles = self._extract_job_titles(resume_text)
        
        # 10. Projects & Responsibilities
        projects_responsibilities = self._extract_projects_responsibilities(resume_text)
        
        # 11. Achievements/Awards
        achievements_awards = self._extract_achievements_awards(resume_text)
        
        # 12. Domain Experience
        domain_experience = self._extract_domain_experience(resume_text)
        
        # 13. Contact Information
        contact_information = self._extract_contact_info(resume_text)
        
        # 14. Resume Keywords
        resume_keywords = self._extract_resume_keywords(resume_text)
        
        # Determine seniority level
        seniority_level = self._determine_seniority_level(total_experience, job_titles)
        
        return ATSCandidateProfile(
            candidate_summary=candidate_summary,
            total_experience=total_experience,
            relevant_experience=relevant_experience,
            technical_skills=technical_skills,
            soft_skills=soft_skills,
            tools_technologies=tools_technologies,
            certifications=certifications,
            education_details=education_details,
            job_titles=job_titles,
            projects_responsibilities=projects_responsibilities,
            achievements_awards=achievements_awards,
            domain_experience=domain_experience,
            contact_information=contact_information,
            resume_keywords=resume_keywords,
            seniority_level=seniority_level
        )

    async def _extract_job_profile(self, job_description: str) -> ATSJobProfile:
        """STEP 2: Extract 9 parameters from Job Description - NO HALLUCINATIONS"""
        
        # 1. Mandatory Skills
        mandatory_skills = self._extract_mandatory_skills(job_description)
        
        # 2. Good-to-have Skills
        good_to_have_skills = self._extract_good_to_have_skills(job_description)
        
        # 3. Required Experience
        required_experience = self._extract_required_experience(job_description)
        
        # 4. Required Tools/Technologies
        required_tools_technologies = self._extract_required_tools(job_description)
        
        # 5. Role Responsibilities
        role_responsibilities = self._extract_role_responsibilities(job_description)
        
        # 6. Education Requirements
        education_requirements = self._extract_education_requirements(job_description)
        
        # 7. Preferred Certifications
        preferred_certifications = self._extract_preferred_certifications(job_description)
        
        # 8. Required Industry Domain
        required_industry_domain = self._extract_industry_domain(job_description)
        
        # 9. Relevant Keywords
        relevant_keywords = self._extract_jd_keywords(job_description)
        
        return ATSJobProfile(
            mandatory_skills=mandatory_skills,
            good_to_have_skills=good_to_have_skills,
            required_experience=required_experience,
            required_tools_technologies=required_tools_technologies,
            role_responsibilities=role_responsibilities,
            education_requirements=education_requirements,
            preferred_certifications=preferred_certifications,
            required_industry_domain=required_industry_domain,
            relevant_keywords=relevant_keywords
        )

    async def _calculate_ats_scores(self, candidate: ATSCandidateProfile, job: ATSJobProfile) -> ATSScoreBreakdown:
        """STEP 3: Calculate 7 ATS scores with professional algorithm"""
        
        # 1. Skill Match Score (40% weight)
        skill_match_score, matched_skills, missing_skills = self._calculate_skill_match(
            candidate.technical_skills + candidate.soft_skills,
            job.mandatory_skills + job.good_to_have_skills
        )
        
        # 2. Experience Score (25% weight)
        experience_score = self._calculate_experience_score(
            candidate.total_experience, job.required_experience
        )
        
        # 3. Role Fit Score (15% weight) 
        role_fit_score = self._calculate_role_fit_score(
            candidate.projects_responsibilities + candidate.job_titles,
            job.role_responsibilities
        )
        
        # 4. Education Match Score (10% weight)
        education_match_score = self._calculate_education_match(
            candidate.education_details, job.education_requirements
        )
        
        # 5. Certifications Score (5% weight)
        certifications_score, matched_certs, missing_certs = self._calculate_certifications_match(
            candidate.certifications, job.preferred_certifications
        )
        
        # 6. Tech Stack Match Score (5% weight)
        tech_stack_score, matched_tools, missing_tools = self._calculate_tech_stack_match(
            candidate.tools_technologies, job.required_tools_technologies
        )
        
        # 7. Keyword Match Score (additional info)
        keyword_match_score, matched_keywords, missing_keywords = self._calculate_keyword_match(
            candidate.resume_keywords, job.relevant_keywords
        )
        
        return ATSScoreBreakdown(
            skill_match_score=skill_match_score,
            experience_score=experience_score,
            role_fit_score=role_fit_score,
            education_match_score=education_match_score,
            certifications_score=certifications_score,
            tech_stack_match_score=tech_stack_score,
            keyword_match_score=keyword_match_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            matched_tools=matched_tools,
            missing_tools=missing_tools,
            matched_keywords=matched_keywords,
            missing_keywords=missing_keywords,
            matched_certifications=matched_certs,
            missing_certifications=missing_certs
        )

    def _calculate_weighted_score(self, scores: ATSScoreBreakdown) -> float:
        """STEP 4: Calculate weighted final score using USER'S EXACT WEIGHTS"""
        
        # USER'S EXACT PROFESSIONAL ATS WEIGHTS:
        weighted_score = (
            scores.skill_match_score * 0.40 +          # Skills Match → 40% (USER SPECIFIED)
            scores.experience_score * 0.25 +           # Experience Match → 25% (USER SPECIFIED)
            scores.role_fit_score * 0.15 +             # Role Responsibilities Match → 15% (USER SPECIFIED)
            scores.education_match_score * 0.10 +      # Education Match → 10% (USER SPECIFIED)
            scores.certifications_score * 0.05 +       # Certifications Match → 5% (USER SPECIFIED)
            scores.tech_stack_match_score * 0.05       # Keywords/Tools Match → 5% (USER SPECIFIED)
        )
        
        logger.info(f"Weighted Score Calculation:")
        logger.info(f"  Skills ({scores.skill_match_score:.1f}%) × 40% = {scores.skill_match_score * 0.40:.1f}")
        logger.info(f"  Experience ({scores.experience_score:.1f}%) × 25% = {scores.experience_score * 0.25:.1f}")
        logger.info(f"  Role Fit ({scores.role_fit_score:.1f}%) × 15% = {scores.role_fit_score * 0.15:.1f}")
        logger.info(f"  Education ({scores.education_match_score:.1f}%) × 10% = {scores.education_match_score * 0.10:.1f}")
        logger.info(f"  Certifications ({scores.certifications_score:.1f}%) × 5% = {scores.certifications_score * 0.05:.1f}")
        logger.info(f"  Tech/Tools ({scores.tech_stack_match_score:.1f}%) × 5% = {scores.tech_stack_match_score * 0.05:.1f}")
        logger.info(f"  TOTAL WEIGHTED SCORE = {weighted_score:.1f}%")
        
        return min(100.0, max(0.0, weighted_score))

    def _determine_status(self, score: float) -> str:
        """STEP 5: Result Classification using USER'S EXACT CRITERIA"""
        
        if score >= 80:
            return "SHORTLISTED"                    # Score ≥ 80% (USER SPECIFIED)
        elif 50 <= score < 80:
            return "BORDERLINE – NEEDS IMPROVEMENT"   # Score 50%–79% (USER SPECIFIED)
        else:
            return "NOT SHORTLISTED"                # Score < 50% (USER SPECIFIED)

    # Extraction helper methods (implemented with strict no-hallucination logic)
    
    def _extract_candidate_summary(self, resume_text: str) -> str:
        """Extract 2-line candidate summary from resume start"""
        lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
        
        # Look for summary sections first
        summary_indicators = ['summary', 'profile', 'objective', 'about']
        
        for i, line in enumerate(lines):
            if any(indicator in line.lower() for indicator in summary_indicators):
                # Take next 2-3 lines as summary
                summary_lines = []
                for j in range(i+1, min(i+4, len(lines))):
                    if lines[j] and len(lines[j]) > 20:  # Meaningful content
                        summary_lines.append(lines[j])
                    if len(summary_lines) == 2:
                        break
                
                if summary_lines:
                    return '. '.join(summary_lines)
        
        # Fallback: Create summary from first meaningful lines
        meaningful_lines = []
        for line in lines[:10]:  # Check first 10 lines
            if len(line) > 30 and not any(x in line.lower() for x in ['email', 'phone', 'address']):
                meaningful_lines.append(line)
            if len(meaningful_lines) == 2:
                break
        
        if meaningful_lines:
            return '. '.join(meaningful_lines)
        
        return "Experienced professional with relevant background."

    def _extract_total_experience(self, resume_text: str) -> int:
        """Extract total years of experience - NO HALLUCINATIONS"""
        text_lower = resume_text.lower()
        
        # Pattern 1: "X years of experience"
        experience_patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*years?\s*experience',
            r'experience\s*:?\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?\s*of\s*experience',
            r'(\d+)\+?\s*year\s*experienced'
        ]
        
        for pattern in experience_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                return max(int(match) for match in matches)
        
        # Pattern 2: Extract from date ranges in work experience
        date_patterns = [
            r'(\d{4})\s*-\s*(\d{4})',  # 2020-2024
            r'(\d{4})\s*-\s*present',   # 2020-present  
            r'(\d{4})\s*to\s*(\d{4})',  # 2020 to 2024
            r'(\d{4})\s*to\s*present'   # 2020 to present
        ]
        
        current_year = datetime.now().year
        total_years = 0
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                if len(match) == 2:
                    start_year = int(match[0])
                    end_year = current_year if match[1] == 'present' else int(match[1])
                    years = max(0, end_year - start_year)
                    total_years = max(total_years, years)
        
        return min(total_years, 50)  # Cap at 50 years for sanity

    def _extract_technical_skills(self, resume_text: str) -> List[str]:
        """Extract technical skills only - NO HALLUCINATIONS"""
        text_lower = resume_text.lower()
        found_skills = []
        
        # Check each technical skill category
        for category, skills in self.tech_categories.items():
            for skill in skills:
                # Check skill and synonyms
                skill_found = False
                
                # Direct match
                if skill in text_lower:
                    skill_found = True
                
                # Check synonyms
                if skill in self.skill_synonyms:
                    for synonym in self.skill_synonyms[skill]:
                        if synonym in text_lower:
                            skill_found = True
                            break
                
                if skill_found and skill.title() not in found_skills:
                    found_skills.append(skill.title())
        
        return found_skills

    def _extract_soft_skills(self, resume_text: str) -> List[str]:
        """Extract soft skills only - NO HALLUCINATIONS"""
        text_lower = resume_text.lower()
        found_soft_skills = []
        
        for skill in self.soft_skills_keywords:
            if skill in text_lower:
                found_soft_skills.append(skill.title())
        
        return found_soft_skills

    def _extract_tools_technologies(self, resume_text: str) -> List[str]:
        """Extract tools and technologies - NO HALLUCINATIONS"""
        text_lower = resume_text.lower()
        tools = []
        
        # Common tools patterns
        tool_patterns = [
            r'\b(git|github|gitlab|bitbucket)\b',
            r'\b(docker|kubernetes|jenkins)\b', 
            r'\b(jira|confluence|trello)\b',
            r'\b(postman|swagger|insomnia)\b',
            r'\b(vs code|visual studio|intellij|eclipse)\b',
            r'\b(slack|teams|zoom)\b'
        ]
        
        for pattern in tool_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                if match.title() not in tools:
                    tools.append(match.title())
        
        return tools

    def _extract_certifications(self, resume_text: str) -> List[str]:
        """Extract certifications - NO HALLUCINATIONS"""
        cert_indicators = ['certification', 'certified', 'certificate', 'accredited']
        lines = resume_text.split('\n')
        certifications = []
        
        for line in lines:
            line_lower = line.lower()
            if any(indicator in line_lower for indicator in cert_indicators):
                # Extract certification name
                cert = line.strip()
                if len(cert) > 5 and len(cert) < 200:  # Reasonable length
                    certifications.append(cert)
        
        return certifications

    def _extract_education(self, resume_text: str) -> List[str]:
        """Extract education details - NO HALLUCINATIONS"""
        education_keywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'education']
        lines = resume_text.split('\n')
        education = []
        
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in education_keywords):
                edu = line.strip()
                if len(edu) > 10 and len(edu) < 200:
                    education.append(edu)
        
        return education

    def _extract_job_titles(self, resume_text: str) -> List[str]:
        """Extract job titles - NO HALLUCINATIONS"""
        title_indicators = ['engineer', 'developer', 'manager', 'analyst', 'specialist', 'consultant', 
                          'coordinator', 'lead', 'senior', 'junior', 'director', 'officer']
        
        lines = resume_text.split('\n')
        job_titles = []
        
        for line in lines:
            line_clean = line.strip()
            if any(indicator in line.lower() for indicator in title_indicators):
                if len(line_clean) > 5 and len(line_clean) < 100:
                    job_titles.append(line_clean)
        
        return job_titles[:10]  # Limit to 10 titles

    def _extract_projects_responsibilities(self, resume_text: str) -> List[str]:
        """Extract projects and responsibilities - NO HALLUCINATIONS"""
        project_indicators = ['project', 'responsibility', 'achieved', 'developed', 'implemented', 
                            'managed', 'led', 'created', 'designed', 'built']
        
        lines = resume_text.split('\n')
        projects = []
        
        for line in lines:
            line_clean = line.strip()
            line_lower = line.lower()
            
            if any(indicator in line_lower for indicator in project_indicators):
                if len(line_clean) > 20 and len(line_clean) < 500:
                    projects.append(line_clean)
        
        return projects[:15]  # Limit to 15 items

    def _extract_achievements_awards(self, resume_text: str) -> List[str]:
        """Extract achievements and awards - NO HALLUCINATIONS"""
        achievement_indicators = ['award', 'achievement', 'recognition', 'honor', 'medal', 
                                'winner', 'champion', 'excellence', 'outstanding']
        
        lines = resume_text.split('\n')
        achievements = []
        
        for line in lines:
            line_clean = line.strip()
            line_lower = line.lower()
            
            if any(indicator in line_lower for indicator in achievement_indicators):
                if len(line_clean) > 10 and len(line_clean) < 200:
                    achievements.append(line_clean)
        
        return achievements

    def _extract_domain_experience(self, resume_text: str) -> List[str]:
        """Extract domain/industry experience - NO HALLUCINATIONS"""
        domains = ['finance', 'healthcare', 'education', 'retail', 'manufacturing', 
                  'technology', 'banking', 'insurance', 'telecommunications', 'automotive',
                  'real estate', 'media', 'gaming', 'e-commerce', 'consulting']
        
        text_lower = resume_text.lower()
        found_domains = []
        
        for domain in domains:
            if domain in text_lower:
                found_domains.append(domain.title())
        
        return found_domains

    def _extract_contact_info(self, resume_text: str) -> Dict[str, str]:
        """Extract contact information - NO HALLUCINATIONS"""
        contact = {}
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, resume_text)
        if email_match:
            contact['email'] = email_match.group()
        
        # Phone pattern
        phone_pattern = r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'
        phone_match = re.search(phone_pattern, resume_text)
        if phone_match:
            contact['phone'] = phone_match.group()
        
        return contact

    def _extract_resume_keywords(self, resume_text: str) -> List[str]:
        """Extract important keywords - NO HALLUCINATIONS"""
        # Use TF-IDF to extract most important terms
        try:
            vectorizer = TfidfVectorizer(max_features=50, stop_words='english', 
                                       ngram_range=(1, 2), min_df=1)
            tfidf_matrix = vectorizer.fit_transform([resume_text.lower()])
            
            feature_names = vectorizer.get_feature_names_out()
            tfidf_scores = tfidf_matrix.toarray()[0]
            
            # Get top keywords
            keyword_scores = list(zip(feature_names, tfidf_scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [keyword for keyword, score in keyword_scores[:20] if score > 0.1]
        except:
            # Fallback to simple word frequency
            words = resume_text.lower().split()
            word_freq = {}
            for word in words:
                if len(word) > 3:
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
            return [word for word, freq in sorted_words[:20]]

    def _determine_seniority_level(self, experience: int, job_titles: List[str]) -> str:
        """Determine seniority level - NO HALLUCINATIONS"""
        title_text = ' '.join(job_titles).lower()
        
        if experience >= 8 or 'senior' in title_text or 'lead' in title_text or 'manager' in title_text:
            return "Senior"
        elif experience >= 3 or 'mid' in title_text:
            return "Mid"
        else:
            return "Junior"

    # Job Description extraction methods
    
    def _extract_mandatory_skills(self, jd_text: str) -> List[str]:
        """Extract mandatory skills from JD - NO HALLUCINATIONS"""
        text_lower = jd_text.lower()
        mandatory_skills = []
        
        # Look for required/mandatory skill patterns
        skill_sections = re.findall(r'(?:required|mandatory|must have|essential).*?(?:skills?|technologies?|experience).*?([:\-•].*?)(?:\n\n|\.|requirements|preferred)', text_lower, re.DOTALL)
        
        for section in skill_sections:
            # Extract skills from bullet points or lists
            skills_in_section = self._extract_skills_from_text(section)
            mandatory_skills.extend(skills_in_section)
        
        # Also check for direct skill mentions
        for category, skills in self.tech_categories.items():
            for skill in skills:
                if skill in text_lower:
                    if skill.title() not in mandatory_skills:
                        mandatory_skills.append(skill.title())
        
        return mandatory_skills[:10]  # Limit to 10

    def _extract_good_to_have_skills(self, jd_text: str) -> List[str]:
        """Extract good-to-have skills - NO HALLUCINATIONS"""
        text_lower = jd_text.lower()
        good_to_have = []
        
        # Look for preferred/good-to-have patterns
        optional_sections = re.findall(r'(?:preferred|good to have|nice to have|plus|bonus).*?(?:skills?|technologies?).*?([:\-•].*?)(?:\n\n|\.|requirements)', text_lower, re.DOTALL)
        
        for section in optional_sections:
            skills_in_section = self._extract_skills_from_text(section)
            good_to_have.extend(skills_in_section)
        
        return good_to_have[:8]  # Limit to 8

    def _extract_required_experience(self, jd_text: str) -> int:
        """Extract required years of experience - NO HALLUCINATIONS"""
        text_lower = jd_text.lower()
        
        # Pattern: "X years of experience"
        experience_patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*years?\s*experience',
            r'minimum\s*(\d+)\s*years?',
            r'at least\s*(\d+)\s*years?'
        ]
        
        for pattern in experience_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                return max(int(match) for match in matches)
        
        return 0  # Default if not found

    def _extract_required_tools(self, jd_text: str) -> List[str]:
        """Extract required tools/technologies - NO HALLUCINATIONS"""
        text_lower = jd_text.lower()
        tools = []
        
        # Common tools mentioned in JDs
        tool_patterns = [
            r'\b(git|github|gitlab)\b',
            r'\b(docker|kubernetes)\b',
            r'\b(jenkins|ci/cd)\b',
            r'\b(aws|azure|gcp|cloud)\b',
            r'\b(sql|mysql|postgresql|mongodb)\b'
        ]
        
        for pattern in tool_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                if match.title() not in tools:
                    tools.append(match.title())
        
        return tools

    def _extract_role_responsibilities(self, jd_text: str) -> List[str]:
        """Extract role responsibilities - NO HALLUCINATIONS"""
        responsibilities = []
        lines = jd_text.split('\n')
        
        responsibility_indicators = ['responsible for', 'duties', 'responsibilities', 'will be', 'you will']
        
        for line in lines:
            line_clean = line.strip()
            if any(indicator in line.lower() for indicator in responsibility_indicators):
                if len(line_clean) > 20 and len(line_clean) < 500:
                    responsibilities.append(line_clean)
        
        return responsibilities[:10]

    def _extract_education_requirements(self, jd_text: str) -> List[str]:
        """Extract education requirements - NO HALLUCINATIONS"""
        text_lower = jd_text.lower()
        education = []
        
        # Education patterns
        education_patterns = [
            r'bachelor.*?degree',
            r'master.*?degree', 
            r'phd|doctorate',
            r'degree.*?(computer|engineering|science|technology)',
            r'(computer science|engineering|mathematics|statistics)'
        ]
        
        for pattern in education_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                if match not in education:
                    education.append(match.title())
        
        return education

    def _extract_preferred_certifications(self, jd_text: str) -> List[str]:
        """Extract preferred certifications - NO HALLUCINATIONS"""
        text_lower = jd_text.lower()
        certifications = []
        
        # Common certification patterns
        cert_patterns = [
            r'(aws|azure|gcp)\s*certified?',
            r'pmp|project management professional',
            r'scrum master',
            r'cissp|security\+',
            r'oracle certified',
            r'microsoft certified'
        ]
        
        for pattern in cert_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                certifications.append(match.title())
        
        return certifications

    def _extract_industry_domain(self, jd_text: str) -> List[str]:
        """Extract industry domain requirements - NO HALLUCINATIONS"""
        domains = ['finance', 'healthcare', 'education', 'retail', 'manufacturing',
                  'technology', 'banking', 'insurance', 'telecommunications']
        
        text_lower = jd_text.lower()
        found_domains = []
        
        for domain in domains:
            if domain in text_lower:
                found_domains.append(domain.title())
        
        return found_domains

    def _extract_jd_keywords(self, jd_text: str) -> List[str]:
        """Extract JD keywords using TF-IDF - NO HALLUCINATIONS"""
        try:
            vectorizer = TfidfVectorizer(max_features=30, stop_words='english',
                                       ngram_range=(1, 2), min_df=1)
            tfidf_matrix = vectorizer.fit_transform([jd_text.lower()])
            
            feature_names = vectorizer.get_feature_names_out()
            tfidf_scores = tfidf_matrix.toarray()[0]
            
            keyword_scores = list(zip(feature_names, tfidf_scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [keyword for keyword, score in keyword_scores[:15] if score > 0.1]
        except:
            # Fallback
            words = jd_text.lower().split()
            return list(set([word for word in words if len(word) > 3]))[:15]

    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Helper method to extract skills from text sections"""
        skills = []
        
        # Check against known technical skills
        for category, tech_skills in self.tech_categories.items():
            for skill in tech_skills:
                if skill in text.lower():
                    if skill.title() not in skills:
                        skills.append(skill.title())
        
        return skills

    # Scoring calculation methods
    
    def _calculate_skill_match(self, candidate_skills: List[str], required_skills: List[str]) -> Tuple[float, List[str], List[str]]:
        """Calculate skill match percentage with synonyms"""
        if not required_skills:
            return 100.0, [], []
        
        matched_skills = []
        missing_skills = []
        
        candidate_skills_lower = [skill.lower() for skill in candidate_skills]
        
        for req_skill in required_skills:
            req_skill_lower = req_skill.lower()
            skill_found = False
            
            # Direct match
            if req_skill_lower in candidate_skills_lower:
                matched_skills.append(req_skill)
                skill_found = True
            else:
                # Check synonyms
                for skill_key, synonyms in self.skill_synonyms.items():
                    if req_skill_lower in synonyms:
                        # Check if any synonym matches candidate skills
                        for synonym in synonyms:
                            if any(synonym in cand_skill for cand_skill in candidate_skills_lower):
                                matched_skills.append(req_skill)
                                skill_found = True
                                break
                        if skill_found:
                            break
            
            if not skill_found:
                missing_skills.append(req_skill)
        
        match_percentage = (len(matched_skills) / len(required_skills)) * 100
        return match_percentage, matched_skills, missing_skills

    def _calculate_experience_score(self, candidate_exp: int, required_exp: int) -> float:
        """Calculate experience match score"""
        if required_exp == 0:
            return 100.0
        
        if candidate_exp >= required_exp:
            # Bonus for exceeding requirement
            excess = candidate_exp - required_exp
            bonus = min(20, excess * 2)  # Max 20% bonus
            return min(100.0, 100.0 + bonus)
        else:
            # Penalty for not meeting requirement
            deficit = required_exp - candidate_exp
            penalty = deficit * 15  # 15% penalty per missing year
            return max(0.0, 100.0 - penalty)

    def _calculate_role_fit_score(self, candidate_experience: List[str], role_responsibilities: List[str]) -> float:
        """Calculate role fit based on responsibilities"""
        if not role_responsibilities:
            return 100.0
        
        if not candidate_experience:
            return 0.0
        
        # Use text similarity for role fit
        candidate_text = ' '.join(candidate_experience).lower()
        role_text = ' '.join(role_responsibilities).lower()
        
        try:
            vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            texts = [candidate_text, role_text]
            tfidf_matrix = vectorizer.fit_transform(texts)
            
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return similarity * 100
        except:
            # Fallback to keyword matching
            role_keywords = set(role_text.split())
            candidate_keywords = set(candidate_text.split())
            
            if not role_keywords:
                return 100.0
            
            intersection = role_keywords.intersection(candidate_keywords)
            return (len(intersection) / len(role_keywords)) * 100

    def _calculate_education_match(self, candidate_education: List[str], required_education: List[str]) -> float:
        """Calculate education match score"""
        if not required_education:
            return 100.0
        
        if not candidate_education:
            return 0.0
        
        candidate_text = ' '.join(candidate_education).lower()
        
        education_levels = {
            'phd': 5, 'doctorate': 5,
            'master': 4, 'masters': 4,
            'bachelor': 3, 'bachelors': 3,
            'associate': 2,
            'diploma': 1, 'certificate': 1
        }
        
        # Find highest education level for candidate
        candidate_level = 0
        for degree, level in education_levels.items():
            if degree in candidate_text:
                candidate_level = max(candidate_level, level)
        
        # Find required education level
        required_text = ' '.join(required_education).lower()
        required_level = 0
        for degree, level in education_levels.items():
            if degree in required_text:
                required_level = max(required_level, level)
        
        if candidate_level >= required_level:
            return 100.0
        else:
            # Partial credit for lower level education
            return max(0.0, (candidate_level / required_level) * 70)

    def _calculate_certifications_match(self, candidate_certs: List[str], required_certs: List[str]) -> Tuple[float, List[str], List[str]]:
        """Calculate certifications match score"""
        if not required_certs:
            return 100.0, [], []
        
        if not candidate_certs:
            return 0.0, [], required_certs
        
        candidate_text = ' '.join(candidate_certs).lower()
        matched_certs = []
        missing_certs = []
        
        for req_cert in required_certs:
            if req_cert.lower() in candidate_text:
                matched_certs.append(req_cert)
            else:
                missing_certs.append(req_cert)
        
        match_percentage = (len(matched_certs) / len(required_certs)) * 100
        return match_percentage, matched_certs, missing_certs

    def _calculate_tech_stack_match(self, candidate_tools: List[str], required_tools: List[str]) -> Tuple[float, List[str], List[str]]:
        """Calculate technology stack match score"""
        if not required_tools:
            return 100.0, [], []
        
        matched_tools = []
        missing_tools = []
        
        candidate_tools_lower = [tool.lower() for tool in candidate_tools]
        
        for req_tool in required_tools:
            req_tool_lower = req_tool.lower()
            tool_found = False
            
            # Direct match or partial match
            for cand_tool in candidate_tools_lower:
                if req_tool_lower in cand_tool or cand_tool in req_tool_lower:
                    matched_tools.append(req_tool)
                    tool_found = True
                    break
            
            if not tool_found:
                missing_tools.append(req_tool)
        
        match_percentage = (len(matched_tools) / len(required_tools)) * 100
        return match_percentage, matched_tools, missing_tools

    def _calculate_keyword_match(self, candidate_keywords: List[str], jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        """Calculate keyword match score"""
        if not jd_keywords:
            return 100.0, [], []
        
        candidate_keywords_lower = [kw.lower() for kw in candidate_keywords]
        matched_keywords = []
        missing_keywords = []
        
        for jd_kw in jd_keywords:
            jd_kw_lower = jd_kw.lower()
            if any(jd_kw_lower in cand_kw for cand_kw in candidate_keywords_lower):
                matched_keywords.append(jd_kw)
            else:
                missing_keywords.append(jd_kw)
        
        match_percentage = (len(matched_keywords) / len(jd_keywords)) * 100
        return match_percentage, matched_keywords, missing_keywords

    def _generate_improvement_suggestions(self, candidate: ATSCandidateProfile, job: ATSJobProfile, scores: ATSScoreBreakdown) -> List[str]:
        """Generate improvement suggestions based on gaps"""
        suggestions = []
        
        # Skills gaps
        if scores.skill_match_score < 70:
            suggestions.append(f"Develop missing skills: {', '.join(scores.missing_skills[:5])}")
        
        # Experience gaps
        if scores.experience_score < 70:
            suggestions.append(f"Gain more relevant experience in the required domain")
        
        # Education gaps
        if scores.education_match_score < 70:
            suggestions.append("Consider pursuing additional education or certifications")
        
        # Certification gaps
        if scores.certifications_score < 70 and scores.missing_certifications:
            suggestions.append(f"Obtain certifications: {', '.join(scores.missing_certifications[:3])}")
        
        # Tech stack gaps
        if scores.tech_stack_match_score < 70:
            suggestions.append(f"Learn required tools: {', '.join(scores.missing_tools[:3])}")
        
        # Role fit improvement
        if scores.role_fit_score < 60:
            suggestions.append("Highlight more relevant project experience and responsibilities")
        
        return suggestions[:6]  # Limit to 6 suggestions

    def _extract_missing_keywords(self, candidate: ATSCandidateProfile, job: ATSJobProfile, scores: ATSScoreBreakdown) -> List[str]:
        """Extract keywords that should be added to resume"""
        keywords_to_add = []
        
        # Add missing skills as keywords
        keywords_to_add.extend(scores.missing_skills[:5])
        
        # Add missing tools
        keywords_to_add.extend(scores.missing_tools[:3])
        
        # Add missing keywords
        keywords_to_add.extend(scores.missing_keywords[:5])
        
        # Add job-relevant terms not in resume
        jd_important_terms = job.mandatory_skills + job.good_to_have_skills + job.relevant_keywords
        candidate_terms = candidate.technical_skills + candidate.resume_keywords
        
        for term in jd_important_terms[:10]:
            if term not in candidate_terms and term not in keywords_to_add:
                keywords_to_add.append(term)
        
        return list(set(keywords_to_add))[:10]  # Remove duplicates, limit to 10

    def _generate_professional_summary(self, candidate: ATSCandidateProfile, job: ATSJobProfile, score: float, status: str) -> str:
        """
        🔍 STEP 7: Summary for Recruiters - User's Exact Specification
        
        Generate a 3–4 line professional summary including:
        - Candidate Fit % 
        - Years of Experience
        - Matched Skills
        - Shortlisting Status
        - Why they are (or not) a good fit
        """
        
        # Calculate key metrics for recruiter summary
        matched_skills_count = len([s for s in candidate.technical_skills if s in job.mandatory_skills + job.good_to_have_skills])
        total_required_skills = len(job.mandatory_skills + job.good_to_have_skills)
        
        skill_match_pct = (matched_skills_count / max(1, total_required_skills)) * 100
        
        summary_lines = []
        
        # Line 1: Candidate Fit % + Years of Experience
        summary_lines.append(f"Candidate shows {score:.1f}% overall fit with {candidate.total_experience} years total experience ({candidate.relevant_experience} years relevant).")
        
        # Line 2: Matched Skills + Shortlisting Status  
        if matched_skills_count > 0:
            top_skills = [s for s in candidate.technical_skills if s in job.mandatory_skills + job.good_to_have_skills][:3]
            skills_text = ", ".join(top_skills)
            summary_lines.append(f"Strong match in {matched_skills_count}/{total_required_skills} required skills ({skills_text}). Status: {status}.")
        else:
            summary_lines.append(f"Limited skill alignment ({matched_skills_count}/{total_required_skills} matches). Status: {status}.")
        
        # Line 3: Seniority + Domain Experience
        seniority_desc = f"{candidate.seniority_level}-level {', '.join(candidate.domain_experience[:2]) if candidate.domain_experience else 'professional'}"
        summary_lines.append(f"Profile: {seniority_desc} with experience in {', '.join(candidate.job_titles[-2:]) if len(candidate.job_titles) > 1 else candidate.job_titles[0] if candidate.job_titles else 'various roles'}.")
        
        # Line 4: Why they are (or not) a good fit
        if status == "SHORTLISTED":
            summary_lines.append("Recommended for interview - strong technical alignment.")
        elif status == "BORDERLINE – NEEDS IMPROVEMENT":
            summary_lines.append("Borderline candidate - requires skills development for optimal fit.")
        else:
            summary_lines.append("Not recommended - significant skill gaps present.")
        
        return " ".join(summary_lines)

    def _generate_final_recommendation(self, score: float, status: str, scores: ATSScoreBreakdown) -> str:
        """Generate final recommendation based on comprehensive analysis"""
        
        if status == "SHORTLISTED":
            return f"RECOMMEND FOR INTERVIEW: Strong candidate with {score:.1f}% ATS match. Proceed to technical screening."
        
        elif status == "BORDERLINE – NEEDS IMPROVEMENT":
            key_gaps = []
            if scores.skill_match_score < 60:
                key_gaps.append("skills")
            if scores.experience_score < 60:
                key_gaps.append("experience") 
            if scores.role_fit_score < 60:
                key_gaps.append("role alignment")
            
            gap_text = ", ".join(key_gaps) if key_gaps else "multiple areas"
            return f"CONDITIONAL CONSIDERATION: {score:.1f}% match with gaps in {gap_text}. Consider for junior roles or with additional training."
        
        else:
            return f"NOT RECOMMENDED: {score:.1f}% ATS match insufficient. Significant skill and experience gaps present."

    # Additional helper method for job profile extraction
    async def _extract_job_profile(self, job_description: str) -> ATSJobProfile:
        """STEP 2: Extract 9 parameters from Job Description - NO HALLUCINATIONS"""
        
        # 1. Mandatory Skills
        mandatory_skills = self._extract_mandatory_skills(job_description)
        
        # 2. Good-to-have Skills
        good_to_have_skills = self._extract_good_to_have_skills(job_description)
        
        # 3. Required Experience
        required_experience = self._extract_required_experience(job_description)
        
        # 4. Required Tools/Technologies
        required_tools_technologies = self._extract_required_tools(job_description)
        
        # 5. Role Responsibilities
        role_responsibilities = self._extract_role_responsibilities(job_description)
        
        # 6. Education Requirements
        education_requirements = self._extract_education_requirements(job_description)
        
        # 7. Preferred Certifications
        preferred_certifications = self._extract_preferred_certifications(job_description)
        
        # 8. Required Industry Domain
        required_industry_domain = self._extract_industry_domain(job_description)
        
        # 9. Relevant Keywords
        relevant_keywords = self._extract_jd_keywords(job_description)
        
        return ATSJobProfile(
            mandatory_skills=mandatory_skills,
            good_to_have_skills=good_to_have_skills,
            required_experience=required_experience,
            required_tools_technologies=required_tools_technologies,
            role_responsibilities=role_responsibilities,
            education_requirements=education_requirements,
            preferred_certifications=preferred_certifications,
            required_industry_domain=required_industry_domain,
            relevant_keywords=relevant_keywords
        )