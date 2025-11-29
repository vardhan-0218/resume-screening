import os
import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import openai
import google.generativeai as genai

from ..models.resume_models import SkillAnalysis

logger = logging.getLogger(__name__)

class LangChainService:
    """Simplified AI service for skill extraction and embeddings."""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.google_api_key = os.getenv("GOOGLE_AI_API_KEY")
        
        # Initialize AI service based on available API keys
        self.ai_service = None
        self._initialize_ai_service()
    
    def _initialize_ai_service(self):
        """Initialize AI service based on available API keys."""
        try:
            if self.openai_api_key and self.openai_api_key.strip():
                openai.api_key = self.openai_api_key
                self.ai_service = "openai"
                logger.info("✅ Initialized OpenAI service")
            elif self.google_api_key and self.google_api_key.strip():
                genai.configure(api_key=self.google_api_key)
                self.ai_service = "google"
                logger.info("✅ Initialized Google AI service")
            else:
                logger.warning("⚠️ No AI API keys configured. Application will use fallback text-based skill extraction.")
                logger.info("💡 Add OPENAI_API_KEY or GOOGLE_AI_API_KEY to .env for AI-powered analysis")
                self.ai_service = "fallback"
        except Exception as e:
            logger.error(f"❌ Failed to initialize AI service: {e}")
            logger.info("🔄 Falling back to rule-based skill extraction")
            self.ai_service = "fallback"
    
    async def extract_skills(self, text: str) -> SkillAnalysis:
        """Extract skills, experience, and education from resume text."""
        try:
            logger.info(f"🤖 Using AI service: {self.ai_service}")
            if self.ai_service == "openai":
                logger.info("📝 Attempting OpenAI extraction")
                return await self._extract_with_openai(text)
            elif self.ai_service == "google":
                logger.info("📝 Attempting Google AI extraction")
                return await self._extract_with_google(text)
            else:
                logger.info("📝 Using fallback extraction (no AI service)")
                return await self._extract_fallback(text)
        except Exception as e:
            logger.error(f"❌ AI extraction failed: {e}")
            logger.info("🔄 Falling back to pattern-based extraction")
            return await self._extract_fallback(text)
    
    async def _extract_with_openai(self, text: str) -> SkillAnalysis:
        """Extract skills using OpenAI."""
        try:
            prompt = f"""
            Analyze this resume text and extract:
            1. Technical skills (programming languages, tools, technologies)
            2. Years of experience (total professional experience)
            3. Education (degrees, certifications)
            4. Projects (personal projects, work projects, open source contributions)
            5. Email address (contact email)
            
            Resume Text:
            {text[:2000]}
            
            Respond in this format:
            Skills: [skill1, skill2, skill3]
            Experience: X years
            Education: [degree1, degree2]
            Projects: [project1, project2, project3]
            Email: email@example.com
            """
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            return self._parse_ai_response(content)
            
        except Exception as e:
            logger.error(f"OpenAI extraction failed: {e}")
            return await self._extract_fallback(text)
    
    async def _extract_with_google(self, text: str) -> SkillAnalysis:
        """Extract skills using Google Gemini."""
        try:
            model = genai.GenerativeModel('gemini-pro')
            prompt = f"""
            Analyze this resume text and extract:
            1. Technical skills (programming languages, tools, technologies)
            2. Years of experience (total professional experience)
            3. Education (degrees, certifications)
            4. Projects (personal projects, work projects, open source contributions)
            5. Email address (contact email)
            
            Resume Text:
            {text[:2000]}
            
            Respond in this format:
            Skills: [skill1, skill2, skill3]
            Experience: X years
            Education: [degree1, degree2]
            Projects: [project1, project2, project3]
            Email: email@example.com
            """
            
            response = model.generate_content(prompt)
            content = response.text
            return self._parse_ai_response(content)
            
        except Exception as e:
            logger.error(f"Google AI extraction failed: {e}")
            return await self._extract_fallback(text)
    
    async def _extract_fallback(self, text: str) -> SkillAnalysis:
        """Fallback skill extraction using regex and patterns."""
        try:
            logger.info(f"🔄 Using fallback extraction for text length: {len(text)}")
            
            # Extended technical skills list with variations
            tech_skills = [
                'python', 'java', 'javascript', 'js', 'react', 'reactjs', 'nodejs', 'node.js', 
                'typescript', 'ts', 'angular', 'angularjs', 'vue', 'vuejs', 'docker', 
                'kubernetes', 'k8s', 'aws', 'amazon web services', 'azure', 'microsoft azure',
                'gcp', 'google cloud', 'sql', 'mysql', 'postgresql', 'postgres', 'mongodb',
                'redis', 'git', 'github', 'gitlab', 'linux', 'ubuntu', 'windows',
                'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'webpack', 'babel',
                'jenkins', 'ci/cd', 'api', 'rest', 'restful', 'graphql', 'microservices',
                'machine learning', 'ml', 'ai', 'artificial intelligence', 'data science',
                'tensorflow', 'pytorch', 'numpy', 'pandas', 'flask', 'django', 'fastapi',
                'express', 'expressjs', 'spring', 'spring boot', 'dotnet', '.net', 'csharp', 
                'c#', 'php', 'ruby', 'ruby on rails', 'rails', 'scala', 'spark',
                'firebase', 'mongodb', 'elasticsearch', 'kafka', 'rabbitmq'
            ]
            
            found_skills = []
            text_lower = text.lower()
            
            # More sophisticated skill matching
            for skill in tech_skills:
                # Use word boundaries for better matching
                import re
                if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
                    # Format skill name properly
                    formatted_skill = skill.title() if skill.islower() else skill
                    if formatted_skill not in found_skills:
                        found_skills.append(formatted_skill)
            
            # Extract years of experience with more comprehensive patterns
            experience_patterns = [
                r'(\d+)\+?\s*years?\s*of\s*experience',
                r'experience\s*:?\s*(\d+)\+?\s*years?',
                r'(\d+)\+?\s*years?\s*experience',
                r'with\s*(\d+)\s*years?\s*in',  # "with 5 years in"
                r'over\s*(\d+)\s*years?',
                r'more\s*than\s*(\d+)\s*years?',
                r'(\d+)\+\s*years?',
                r'(\d+)-\d+\s*years?',  # Range like 3-5 years
                r'total\s*of\s*(\d+)\s*years?',
                r'around\s*(\d+)\s*years?',
                r'(\d+)\s*years?\s*of\s*professional',
                r'(\d+)\s*years?\s*of\s*industry'
            ]
            
            experience_years = None
            for pattern in experience_patterns:
                match = re.search(pattern, text_lower)
                if match:
                    experience_years = int(match.group(1))
                    break
            
            # Extract education with more comprehensive patterns
            education_patterns = [
                (r'bachelor[s]?.*(?:degree|of)?.*(?:in)?\s*([a-zA-Z\s]+)', 'Bachelor'),
                (r'master[s]?.*(?:degree|of)?.*(?:in)?\s*([a-zA-Z\s]+)', 'Master'),
                (r'(?:phd|doctorate|doctoral).*(?:in)?\s*([a-zA-Z\s]+)', 'PhD'),
                (r'mba.*([a-zA-Z\s]*)', 'MBA'),
                (r'b\.?\s*tech.*(?:in)?\s*([a-zA-Z\s]+)', 'B.Tech'),
                (r'm\.?\s*tech.*(?:in)?\s*([a-zA-Z\s]+)', 'M.Tech'),
                (r'bsc?.*(?:in)?\s*([a-zA-Z\s]+)', 'BSc'),
                (r'msc?.*(?:in)?\s*([a-zA-Z\s]+)', 'MSc'),
                (r'engineering.*(?:in)?\s*([a-zA-Z\s]+)', 'Engineering'),
                (r'computer\s*science', 'Computer Science'),
                (r'information\s*technology', 'Information Technology'),
                (r'software\s*engineering', 'Software Engineering')
            ]
            
            found_education = []
            for pattern, degree_type in education_patterns:
                matches = re.finditer(pattern, text_lower)
                for match in matches:
                    if match.group(0):
                        found_education.append(degree_type)
                        break  # Only add each type once
            
            # Simplified project extraction
            found_projects = []
            lines = text.split('\n')
            projects_section_found = False
            
            logger.info(f"🔍 Scanning for projects in {len(lines)} lines")
            
            for i, line in enumerate(lines):
                line_clean = line.strip()
                line_lower = line_clean.lower()
                
                # Check if we hit a projects section
                if 'projects' in line_lower and len(line_clean) < 50:
                    projects_section_found = True
                    logger.info(f"🎯 Found projects header: '{line_clean}'")
                    continue
                
                # Extract from projects section
                if projects_section_found and line_clean:
                    # Stop if we hit another section
                    if any(section in line_lower for section in ['skill', 'education', 'experience', 'certification', 'contact']):
                        if len(line_clean) < 50:  # Likely a section header
                            projects_section_found = False
                            logger.info(f"🔚 End of projects section at: '{line_clean}'")
                            continue
                    
                    # Extract project if it looks like one
                    if 5 < len(line_clean) < 150:
                        # Remove common prefixes
                        clean_project = re.sub(r'^[•\-\*\+\d\.)\s]+', '', line_clean).strip()
                        if clean_project and len(clean_project) > 3:
                            found_projects.append(clean_project)
                            logger.info(f"✅ Extracted project: '{clean_project}'")
                            
                    if len(found_projects) >= 5:
                        break

            # Extract email address
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            email_match = re.search(email_pattern, text)
            candidate_email = email_match.group() if email_match else None
            
            # Log extraction results
            logger.info(f"📊 Fallback extraction results:")
            logger.info(f"   Found {len(found_skills)} skills: {found_skills[:10]}")
            logger.info(f"   Experience: {experience_years} years")
            logger.info(f"   Education: {found_education}")
            logger.info(f"   Projects: {found_projects}")
            logger.info(f"   Email: {candidate_email}")
            
            return SkillAnalysis(
                skills=found_skills[:20],  # Limit to top 20 skills
                experience_years=experience_years,
                education=found_education[:5],  # Limit to top 5 education items
                projects=found_projects[:5],  # Limit to top 5 projects
                email=candidate_email,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Fallback extraction failed: {e}")
            return SkillAnalysis(
                skills=[],
                experience_years=None,
                education=[],
                projects=[],
                email=None,
                timestamp=datetime.now()
            )
    
    def _parse_ai_response(self, content: str) -> SkillAnalysis:
        """Parse AI response into SkillAnalysis object."""
        try:
            skills = []
            experience_years = None
            education = []
            
            # Extract skills
            skills_match = re.search(r'Skills:\s*\[(.*?)\]', content, re.IGNORECASE)
            if skills_match:
                skills_text = skills_match.group(1)
                skills = [skill.strip().strip('"\'') for skill in skills_text.split(',')]
            
            # Extract experience
            exp_match = re.search(r'Experience:\s*(\d+)', content, re.IGNORECASE)
            if exp_match:
                experience_years = int(exp_match.group(1))
            
            # Extract education
            edu_match = re.search(r'Education:\s*\[(.*?)\]', content, re.IGNORECASE)
            if edu_match:
                edu_text = edu_match.group(1)
                education = [edu.strip().strip('"\'') for edu in edu_text.split(',')]
            
            # Extract projects
            projects = []
            projects_match = re.search(r'Projects:\s*\[(.*?)\]', content, re.IGNORECASE | re.DOTALL)
            if projects_match:
                projects_text = projects_match.group(1)
                projects = [proj.strip().strip('"\'') for proj in projects_text.split(',')]

            # Extract email
            email_match = re.search(r'Email:\s*([^\s\n]+)', content, re.IGNORECASE)
            candidate_email = email_match.group(1) if email_match else None
            
            return SkillAnalysis(
                skills=skills,
                experience_years=experience_years,
                education=education,
                projects=projects,
                email=candidate_email,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Failed to parse AI response: {e}")
            return SkillAnalysis(
                skills=[],
                experience_years=None,
                education=[],
                projects=[],
                email=None,
                timestamp=datetime.now()
            )
    
    async def generate_embeddings(self, text: str) -> List[float]:
        """Generate embeddings for text (simplified version)."""
        try:
            # For now, return a simple hash-based embedding
            # In production, this would use proper embedding models
            words = text.lower().split()[:384]  # Limit to 384 dimensions
            embedding = []
            
            for i, word in enumerate(words):
                # Create a simple hash-based embedding
                hash_val = abs(hash(word)) % 1000
                embedding.append(hash_val / 1000.0)
            
            # Pad or truncate to 384 dimensions
            while len(embedding) < 384:
                embedding.append(0.0)
            
            return embedding[:384]
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            # Return zero embedding as fallback
            return [0.0] * 384
