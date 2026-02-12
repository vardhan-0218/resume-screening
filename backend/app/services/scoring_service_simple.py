import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import re

from ..models.resume_models import ResumeAnalysis, JobDescription, ScoringResult, DetailedScoring

logger = logging.getLogger(__name__)

class ScoringService:
    """Simplified scoring service for resume analysis."""
    
    def __init__(self):
        self.skill_weight = 0.35
        self.experience_weight = 0.25
        self.education_weight = 0.15
        self.project_weight = 0.15
        self.semantic_weight = 0.1
    
    async def calculate_comprehensive_score(
        self, 
        resume: ResumeAnalysis, 
        job_description: str, 
        required_skills: List[str]
    ) -> ScoringResult:
        """Calculate comprehensive score for resume against job description."""
        try:
            # Log resume content for debugging
            logger.info(f"🔍 Scoring resume: {resume.filename}")
            logger.info(f"   Skills count: {len(resume.skills)}, Experience: {resume.experience_years}, Education count: {len(resume.education)}")
            
            # Always proceed with scoring, even if content is minimal
            # This will help identify extraction issues
            
            # Calculate individual scores
            skill_score, skill_details, missing_skills, extra_skills = await self._calculate_skill_score(
                resume.skills, required_skills
            )
            
            experience_score = await self._calculate_experience_score(
                resume.experience_years, job_description
            )
            
            education_score = await self._calculate_education_score(
                resume.education, job_description
            )
            
            project_score, project_details = await self._calculate_project_score(
                resume.projects, job_description, resume.skills
            )
            
            semantic_score = await self._calculate_semantic_score(
                resume.extracted_text, job_description
            )
            
            # Calculate weighted total score
            total_score = (
                skill_score * self.skill_weight +
                experience_score * self.experience_weight +
                education_score * self.education_weight +
                project_score * self.project_weight +
                semantic_score * self.semantic_weight
            )
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(
                skill_score, experience_score, education_score, project_score,
                missing_skills, resume, job_description
            )
            
            detailed_scoring = DetailedScoring(
                skill_match_score=skill_score,
                experience_score=experience_score,
                education_score=education_score,
                project_score=project_score,
                semantic_similarity_score=semantic_score,
                skill_details=skill_details,
                missing_skills=missing_skills,
                extra_skills=extra_skills,
                project_details=project_details
            )
            
            return ScoringResult(
                resume_id=resume.id,
                filename=resume.filename,
                total_score=round(total_score, 2),
                detailed_scoring=detailed_scoring,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Failed to calculate comprehensive score: {e}")
            # Return default scoring result
            return ScoringResult(
                resume_id=resume.id,
                filename=resume.filename,
                total_score=0.0,
                detailed_scoring=DetailedScoring(
                    skill_match_score=0.0,
                    experience_score=0.0,
                    education_score=0.0,
                    semantic_similarity_score=0.0,
                    skill_details={},
                    missing_skills=[],
                    extra_skills=[]
                ),
                recommendations=["Scoring failed due to an error"]
            )
    
    async def _calculate_skill_score(
        self, 
        resume_skills: List[str], 
        required_skills: List[str]
    ) -> tuple[float, Dict[str, bool], List[str], List[str]]:
        """Calculate skill match score."""
        try:
            # If no skills found in resume, return very low score
            if not resume_skills or len(resume_skills) == 0:
                if required_skills:
                    return 5.0, {skill: False for skill in required_skills}, required_skills, []
                else:
                    return 10.0, {}, [], []  # Still low score even if no requirements
            
            if not required_skills:
                return 85.0, {}, [], resume_skills[:3]  # Good score if skills exist but no requirements
            
            # Normalize skills for comparison
            resume_skills_normalized = [skill.lower().strip() for skill in resume_skills]
            required_skills_normalized = [skill.lower().strip() for skill in required_skills]
            
            skill_details = {}
            matched_skills = []
            missing_skills = []
            extra_skills = []
            
            # Check each required skill
            for req_skill in required_skills_normalized:
                found = False
                for res_skill in resume_skills_normalized:
                    if req_skill in res_skill or res_skill in req_skill:
                        skill_details[req_skill] = True
                        matched_skills.append(req_skill)
                        found = True
                        break
                
                if not found:
                    skill_details[req_skill] = False
                    missing_skills.append(req_skill)
            
            # Find extra skills (skills in resume but not required)
            for res_skill in resume_skills_normalized:
                if not any(res_skill in req_skill or req_skill in res_skill 
                           for req_skill in required_skills_normalized):
                    extra_skills.append(res_skill)
            
            # Calculate match percentage
            match_percentage = (len(matched_skills) / len(required_skills_normalized)) * 100
            
            return round(match_percentage, 2), skill_details, missing_skills, extra_skills
            
        except Exception as e:
            logger.error(f"Failed to calculate skill score: {e}")
            return 0.0, {}, [], []
    
    async def _calculate_experience_score(
        self, 
        experience_years: Optional[int], 
        job_description: str
    ) -> float:
        """Calculate experience score based on job requirements."""
        try:
            if not experience_years:
                return 50.0  # Neutral score if experience not specified
            
            # Extract required experience from job description
            exp_patterns = [
                r'(\d+)\+?\s*years?\s*of\s*experience',
                r'(\d+)\s*years?\s*experience',
                r'minimum\s*(\d+)\s*years?',
                r'(\d+)\+?\s*years?\s*required'
            ]
            
            required_experience = None
            for pattern in exp_patterns:
                match = re.search(pattern, job_description.lower())
                if match:
                    required_experience = int(match.group(1))
                    break
            
            if not required_experience:
                # If no specific requirement, score based on experience level
                if experience_years >= 5:
                    return 90.0
                elif experience_years >= 2:
                    return 75.0
                elif experience_years >= 1:
                    return 60.0
                else:
                    return 40.0
            
            # Score based on meeting or exceeding requirement
            if experience_years >= required_experience:
                return 100.0
            elif experience_years >= required_experience * 0.8:
                return 80.0
            elif experience_years >= required_experience * 0.6:
                return 60.0
            elif experience_years >= required_experience * 0.4:
                return 40.0
            else:
                return 20.0
                
        except Exception as e:
            logger.error(f"Failed to calculate experience score: {e}")
            return 50.0
    
    async def _calculate_education_score(
        self, 
        education: List[str], 
        job_description: str
    ) -> float:
        """Calculate education score based on job requirements."""
        try:
            if not education:
                return 50.0  # Neutral score if education not specified
            
            education_text = ' '.join(education).lower()
            job_text = job_description.lower()
            
            # Check for degree requirements
            degree_requirements = {
                'phd': ['phd', 'doctorate', 'doctoral'],
                'master': ['master', 'msc', 'm.tech', 'mba'],
                'bachelor': ['bachelor', 'bsc', 'b.tech', 'undergraduate'],
                'associate': ['associate', 'diploma']
            }
            
            required_level = None
            for level, keywords in degree_requirements.items():
                if any(keyword in job_text for keyword in keywords):
                    required_level = level
                    break
            
            if not required_level:
                return 80.0  # Good score if no specific requirement
            
            # Check if education meets requirement
            if required_level == 'phd' and any(kw in education_text for kw in degree_requirements['phd']):
                return 100.0
            elif required_level == 'master' and any(kw in education_text for kw in degree_requirements['master'] + degree_requirements['phd']):
                return 100.0
            elif required_level == 'bachelor' and any(kw in education_text for kw in degree_requirements['bachelor'] + degree_requirements['master'] + degree_requirements['phd']):
                return 100.0
            elif required_level == 'associate' and any(kw in education_text for kw in degree_requirements['associate'] + degree_requirements['bachelor'] + degree_requirements['master'] + degree_requirements['phd']):
                return 100.0
            else:
                # Partial score for having some education
                return 60.0
                
        except Exception as e:
            logger.error(f"Failed to calculate education score: {e}")
            return 50.0
    
    async def _calculate_project_score(
        self, 
        projects: List[str], 
        job_description: str,
        skills: List[str]
    ) -> tuple[float, List[str]]:
        """Calculate project score based on relevance and technical content."""
        try:
            if not projects:
                return 40.0, []  # Lower score if no projects shown
            
            job_text = job_description.lower()
            project_details = []
            total_relevance = 0
            
            # Key project indicators
            technical_keywords = [
                'web', 'mobile', 'api', 'database', 'frontend', 'backend',
                'fullstack', 'machine learning', 'ai', 'cloud', 'devops',
                'microservices', 'rest', 'graphql', 'react', 'angular', 'vue',
                'python', 'java', 'javascript', 'node', 'docker', 'kubernetes'
            ]
            
            impact_keywords = [
                'users', 'performance', 'scalable', 'optimization', 'automated',
                'improved', 'reduced', 'increased', 'deployed', 'production',
                'team', 'collaboration', 'open source', 'github', 'portfolio'
            ]
            
            for project in projects:
                project_lower = project.lower()
                project_score = 0
                
                # Score based on technical relevance
                tech_matches = sum(1 for kw in technical_keywords if kw in project_lower)
                project_score += min(tech_matches * 10, 40)  # Max 40 points for tech relevance
                
                # Score based on impact indicators
                impact_matches = sum(1 for kw in impact_keywords if kw in project_lower)
                project_score += min(impact_matches * 8, 30)  # Max 30 points for impact
                
                # Bonus for skill alignment with projects
                skill_alignment = sum(1 for skill in skills if skill.lower() in project_lower)
                project_score += min(skill_alignment * 5, 20)  # Max 20 points for skill alignment
                
                # Bonus for job description keyword matches
                jd_matches = sum(1 for word in job_text.split() 
                                if len(word) > 3 and word in project_lower)
                project_score += min(jd_matches * 2, 10)  # Max 10 points for JD alignment
                
                total_relevance += min(project_score, 100)  # Cap individual project score at 100
                project_details.append(f"{project[:100]}... (Score: {min(project_score, 100):.0f})")
            
            # Calculate average project score
            average_score = total_relevance / len(projects) if projects else 0
            
            # Bonus for having multiple relevant projects
            if len(projects) >= 3:
                average_score *= 1.1  # 10% bonus for having 3+ projects
            elif len(projects) >= 2:
                average_score *= 1.05  # 5% bonus for having 2+ projects
            
            return min(average_score, 100.0), project_details
            
        except Exception as e:
            logger.error(f"Failed to calculate project score: {e}")
            return 40.0, []
    
    async def _calculate_semantic_score(
        self, 
        resume_text: str, 
        job_description: str
    ) -> float:
        """Calculate semantic similarity score."""
        try:
            # Simple keyword-based semantic similarity
            resume_words = set(resume_text.lower().split())
            job_words = set(job_description.lower().split())
            
            # Remove common words
            common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'}
            
            resume_words -= common_words
            job_words -= common_words
            
            if not job_words:
                return 50.0
            
            # Calculate Jaccard similarity
            intersection = len(resume_words & job_words)
            union = len(resume_words | job_words)
            
            similarity = (intersection / union) * 100 if union > 0 else 0
            
            return round(min(similarity, 100.0), 2)
            
        except Exception as e:
            logger.error(f"Failed to calculate semantic score: {e}")
            return 50.0
    
    async def _generate_recommendations(
        self,
        skill_score: float,
        experience_score: float,
        education_score: float,
        project_score: float,
        missing_skills: List[str],
        resume: ResumeAnalysis,
        job_description: str
    ) -> List[str]:
        """Generate improvement recommendations."""
        recommendations = []
        
        try:
            # Skill-based recommendations with specific guidance
            if skill_score < 30:
                # Very low skill score - likely no skills detected
                if not resume.skills or len(resume.skills) == 0:
                    recommendations.append("No technical skills detected. Add a dedicated 'Skills' section with relevant technical skills.")
                    recommendations.append("Include programming languages, tools, frameworks, and technologies you know.")
                elif missing_skills:
                    recommendations.append(f"Critical skills missing: {', '.join(missing_skills[:3])}. Consider gaining experience through courses or projects.")
            elif skill_score < 70:
                if missing_skills:
                    # Generate specific recommendations for each missing skill
                    skill_recommendations = []
                    for skill in missing_skills[:5]:  # Limit to top 5 missing skills
                        rec = await self._generate_skill_improvement_recommendation(skill, resume)
                        skill_recommendations.append(rec)
                    
                    recommendations.extend(skill_recommendations[:2])  # Add top 2 skill recommendations
                    
                    # General skill development advice
                    if len(missing_skills) > 2:
                        recommendations.append(f"Focus on developing these key skills: {', '.join(missing_skills[:3])}. Consider online courses, certifications, or personal projects.")
                else:
                    recommendations.append("Highlight more relevant technical skills in your resume with specific examples")
            
            # Experience-based recommendations
            if experience_score < 60:
                recommendations.append("Emphasize relevant projects, internships, or volunteer work to demonstrate practical experience")
            
            # Project-based recommendations
            if project_score < 60:
                if not resume.projects or len(resume.projects) == 0:
                    recommendations.append("Add 2-3 relevant projects showcasing your technical skills. Include GitHub links and live demos if possible.")
                elif len(resume.projects) < 2:
                    recommendations.append("Include more projects that demonstrate your skills. Focus on projects using technologies mentioned in the job description.")
                else:
                    recommendations.append("Improve project descriptions with technical details, challenges solved, and measurable outcomes (users, performance improvements, etc.).")
            
            # Education-based recommendations
            if education_score < 60:
                recommendations.append("Consider relevant certifications, online courses, or bootcamps to strengthen your qualifications")
            
            # High performer recommendations
            if skill_score > 80 and experience_score > 80:
                recommendations.append("Excellent match! Quantify your achievements with specific metrics and impact")
            
            # Add specific action items
            if missing_skills:
                actionable_recommendations = await self._generate_actionable_recommendations(missing_skills)
                recommendations.extend(actionable_recommendations[:1])  # Add 1 actionable recommendation
            
            if len(recommendations) == 0:
                recommendations.append("Good overall match. Consider adding specific achievements and metrics to strengthen your resume")
            
            return recommendations[:4]  # Limit to top 4 recommendations
            
        except Exception as e:
            logger.error(f"Failed to generate recommendations: {e}")
            return ["Unable to generate recommendations due to an error"]
    
    async def _generate_skill_improvement_recommendation(self, skill: str, resume: ResumeAnalysis) -> str:
        """Generate specific improvement recommendation for a missing skill."""
        skill_lower = skill.lower()
        
        # Skill-specific recommendations
        skill_guidance = {
            'python': "Take Python courses on Codecademy or Coursera. Build projects like web scrapers or data analysis scripts.",
            'javascript': "Learn JavaScript through freeCodeCamp or MDN. Build interactive web projects to practice.",
            'react': "Master React through official documentation. Create portfolio projects like e-commerce sites or dashboards.",
            'node.js': "Build backend APIs with Node.js. Start with Express.js and create RESTful services.",
            'sql': "Practice SQL on platforms like LeetCode or HackerRank. Design database schemas for sample applications.",
            'aws': "Get AWS Certified Cloud Practitioner. Practice with free tier services like EC2 and S3.",
            'docker': "Learn containerization through Docker's official tutorials. Containerize your existing projects.",
            'kubernetes': "Take Kubernetes courses on Udemy. Practice with minikube for local development.",
            'machine learning': "Start with Andrew Ng's ML course on Coursera. Implement algorithms from scratch.",
            'data analysis': "Learn pandas and NumPy. Analyze public datasets from Kaggle to build portfolio.",
            'git': "Master Git through GitHub's Learning Lab. Contribute to open source projects.",
            'typescript': "Convert existing JavaScript projects to TypeScript. Learn type system fundamentals."
        }
        
        # Check for skill-specific guidance
        for key, guidance in skill_guidance.items():
            if key in skill_lower:
                return f"For {skill}: {guidance}"
        
        # General tech skill recommendation
        tech_keywords = ['java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin']
        if any(keyword in skill_lower for keyword in tech_keywords):
            return f"For {skill}: Build projects using this language, contribute to open source, and create a GitHub portfolio."
        
        # General framework recommendation
        framework_keywords = ['angular', 'vue', 'django', 'flask', 'spring', 'laravel', 'rails']
        if any(keyword in skill_lower for keyword in framework_keywords):
            return f"For {skill}: Follow official tutorials, build a full-stack application, and deploy it to showcase your skills."
        
        # Default recommendation
        return f"For {skill}: Take online courses, build practical projects, and create a portfolio demonstrating your proficiency."
    
    async def _generate_actionable_recommendations(self, missing_skills: List[str]) -> List[str]:
        """Generate actionable recommendations for skill development."""
        actionable = []
        
        if len(missing_skills) >= 3:
            actionable.append("Create a 90-day learning plan focusing on one missing skill per month. Use platforms like Coursera, Udemy, or freeCodeCamp.")
        
        if any('certification' in skill.lower() or 'certified' in skill.lower() for skill in missing_skills):
            actionable.append("Pursue industry certifications - they validate skills and make your resume stand out to recruiters.")
        
        project_based_skills = ['python', 'javascript', 'react', 'node.js', 'java', 'sql']
        if any(skill.lower() in project_based_skills for skill in missing_skills):
            actionable.append("Build 2-3 portfolio projects showcasing missing skills. Document them on GitHub with detailed READMEs.")
        
        return actionable
