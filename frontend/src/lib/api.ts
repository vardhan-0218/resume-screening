const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ResumeAnalysis {
  id: string;
  filename: string;
  extracted_text: string;
  skills: string[];
  experience_years: number;
  education: string;
  projects?: string[];
  email?: string;
  similarity_score?: number;
  timestamp: string;
}

export interface JobDescription {
  title: string;
  description: string;
  required_skills: string[];
  experience_level: string;
  salary_range?: string;
  location?: string;
}

export interface ScoringResult {
  resume_id: string;
  filename: string;
  total_score: number;
  skill_match_score: number;
  experience_score: number;
  education_score: number;
  project_score?: number;
  similarity_score: number;
  is_shortlisted: boolean;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
  candidate_email?: string;
  // Enhanced for ATS integration
  atsResult?: ATSResult;
  detailed_scoring?: Record<string, unknown>;
  rank?: number;
  recommendations?: string[];
}

// New ATS Types
export interface ATSCandidateProfile {
  candidate_summary: string;
  total_experience: number;
  relevant_experience: number;
  technical_skills: string[];
  soft_skills: string[];
  tools_technologies: string[];
  certifications: string[];
  education_details: string[];
  job_titles: string[];
  projects_responsibilities: string[];
  achievements_awards: string[];
  domain_experience: string[];
  contact_information: { [key: string]: string };
  resume_keywords: string[];
  seniority_level: string;
}

export interface ATSJobProfile {
  mandatory_skills: string[];
  good_to_have_skills: string[];
  required_experience: number;
  required_tools_technologies: string[];
  role_responsibilities: string[];
  education_requirements: string[];
  preferred_certifications: string[];
  required_industry_domain: string[];
  relevant_keywords: string[];
}

export interface ATSScoreBreakdown {
  skill_match_score: number;
  experience_score: number;
  keyword_match_score: number;
  education_match_score: number;
  certifications_score: number;
  role_fit_score: number;
  tech_stack_match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_tools: string[];
  missing_tools: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  matched_certifications: string[];
  missing_certifications: string[];
}

export interface ATSResult {
  ats_score: number;
  status: string;
  score_breakdown: ATSScoreBreakdown;
  candidate_profile: ATSCandidateProfile;
  job_profile: ATSJobProfile;
  professional_summary: string;
  improvement_suggestions: string[];
  keywords_to_add: string[];
  final_recommendation: string;
}

export interface BatchAnalysisResult {
  batch_id: string;
  job_description: JobDescription;
  results: ScoringResult[];
  total_resumes: number;
  shortlisted_count: number;
  average_score: number;
  created_at: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server. Please ensure the backend is running on ${API_BASE_URL}`);
      }
      throw error;
    }
  }

  async uploadResume(
    file: File,
    jobDescription?: string,
    jobDescriptionFile?: File
  ): Promise<ResumeAnalysis> {
    const formData = new FormData();
    formData.append('file', file);

    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }

    if (jobDescriptionFile) {
      formData.append('job_description_file', jobDescriptionFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/ats/batch-evaluate`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': Date.now().toString(),
          'X-Request-Id': Math.random().toString(36).substring(7)
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Unable to connect to server. Please ensure the backend is running on ${API_BASE_URL}.`);
      }
      throw error;
    }
  }

  async analyzeJobDescriptionFile(file: File): Promise<{
    job_profile: ATSJobProfile;
    analysis_summary: {
      mandatory_skills_count: number;
      good_to_have_skills_count: number;
      required_experience_years: number;
      tools_technologies_count: number;
      education_requirements_specified: boolean;
      certifications_preferred: boolean;
      industry_domains: string[];
      key_keywords_count: number;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ats/analyze-job-description-file`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': Date.now().toString(),
          'X-Request-Id': Math.random().toString(36).substring(7)
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return response.json() as Promise<{
        job_profile: ATSJobProfile;
        analysis_summary: {
          mandatory_skills_count: number;
          good_to_have_skills_count: number;
          required_experience_years: number;
          tools_technologies_count: number;
          education_requirements_specified: boolean;
          certifications_preferred: boolean;
          industry_domains: string[];
          key_keywords_count: number;
        };
      }>;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Unable to connect to server. Please ensure the backend is running on ${API_BASE_URL}.`);
      }
      throw error;
    }
  }

  async analyzeBatch(
    jobDescription: JobDescription,
    resumeIds?: string[]
  ): Promise<ScoringResult[]> {
    const params = new URLSearchParams();
    if (resumeIds && resumeIds.length > 0) {
      resumeIds.forEach(id => params.append('resume_ids', id));
    }

    return this.request<ScoringResult[]>(
      `/api/analyze-batch?${params.toString()}`,
      {
        method: 'POST',
        body: JSON.stringify(jobDescription),
      }
    );
  }

  async getResumeAnalysis(resumeId: string): Promise<ResumeAnalysis> {
    return this.request<ResumeAnalysis>(`/api/resume/${resumeId}`);
  }

  async getAllResumes(): Promise<ResumeAnalysis[]> {
    return this.request<ResumeAnalysis[]>('/api/resumes');
  }

  async deleteResume(resumeId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/resume/${resumeId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{
    status: string;
    services: Record<string, string>;
  }> {
    return this.request<{
      status: string;
      services: Record<string, string>;
    }>('/api/health');
  }

  // New ATS Methods
  // Unified ATS Evaluation Method - Works for both single and batch
  async evaluateResumeWithATS(
    file: File,
    jobDescription: string
  ): Promise<ATSResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ats/evaluate-resume`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': Date.now().toString(),
          'X-Request-Id': Math.random().toString(36).substring(7)
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Unable to connect to server. Please ensure the backend is running on ${API_BASE_URL}.`);
      }
      throw error;
    }
  }

  // Batch evaluation using the same unified logic
  async evaluateBatchWithATS(
    files: File[],
    jobDescription: string
  ): Promise<ATSResult[]> {
    try {
      // Process files one by one using the same evaluation logic
      const results: ATSResult[] = [];

      for (const file of files) {
        try {
          const result = await this.evaluateResumeWithATS(file, jobDescription);
          results.push(result);
        } catch (error) {
          console.error(`Failed to evaluate ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      return results;
    } catch (error) {
      console.error('Batch evaluation error:', error);
      throw error;
    }
  }

  async analyzeJobDescription(jobDescription: string): Promise<{
    job_profile: ATSJobProfile;
    analysis_summary: {
      mandatory_skills_count: number;
      good_to_have_skills_count: number;
      required_experience_years: number;
      tools_technologies_count: number;
      education_requirements_specified: boolean;
      certifications_preferred: boolean;
      industry_domains: string[];
      key_keywords_count: number;
    };
  }> {
    return this.request<{
      job_profile: ATSJobProfile;
      analysis_summary: {
        mandatory_skills_count: number;
        good_to_have_skills_count: number;
        required_experience_years: number;
        tools_technologies_count: number;
        education_requirements_specified: boolean;
        certifications_preferred: boolean;
        industry_domains: string[];
        key_keywords_count: number;
      };
    }>('/api/ats/analyze-job-description', {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription }),
    });
  }
}

export const apiClient = new ApiClient();
