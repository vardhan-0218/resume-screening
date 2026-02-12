import { useState, useEffect } from "react";
import { useHybridAuth } from "@/hooks/useHybridAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LogOut, Upload, FileText, Send, Brain, ArrowLeft, Home, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/FileUpload";
import { apiClient, JobDescription, ScoringResult } from "@/lib/api";
import emailjs from "@emailjs/browser";

// Using ScoringResult from api.ts instead of custom interface

export default function HRDashboard() {
  const { signOut } = useHybridAuth();
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleSignOut = () => {
    signOut();
    toast.success("Logged out successfully!");
  };
  const [jobDescFile, setJobDescFile] = useState<File | null>(null);
  const [extractedJobTitle, setExtractedJobTitle] = useState("");
  const [extractedJobDescription, setExtractedJobDescription] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [resumes, setResumes] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScoringResult[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  // Results are now stored in component state after analysis

  const extractJobDetails = async (file: File) => {
    if (!file) return;
    
    setIsExtracting(true);
    try {
      console.log('Analyzing job description file:', file.name);
      // Use API to extract job details from the file
      const analysis = await apiClient.analyzeJobDescriptionFile(file);
      console.log('Job description analysis result:', analysis);
      
      // Extract job title using simple text processing
      const text = analysis.extracted_text || '';
      console.log('Extracted text length:', text.length);
      console.log('First 500 characters:', text.substring(0, 500));
      const lines = text.split('\n').filter(line => line.trim());
      console.log('First 10 lines:', lines.slice(0, 10));

      // Enhanced job title extraction logic
      let jobTitle = '';
      const fullText = text.toLowerCase();
      
      // First, look for explicit job title patterns
      for (const line of lines.slice(0, 15)) { // Check first 15 lines
        const trimmed = line.trim();
        const lowerLine = trimmed.toLowerCase();
        
        // Direct title indicators
        if (lowerLine.includes('position:') || 
            lowerLine.includes('title:') ||
            lowerLine.includes('job title:') ||
            lowerLine.includes('role:') ||
            lowerLine.includes('vacancy:') ||
            lowerLine.includes('opening:')) {
          const parts = trimmed.split(':');
          if (parts.length > 1) {
            jobTitle = parts[1].trim();
            break;
          }
        }
      }
      
      // If no direct pattern found, look for job role keywords in prominent positions
      if (!jobTitle) {
        const jobKeywords = [
          'front end developer', 'frontend developer', 'front-end developer',
          'back end developer', 'backend developer', 'back-end developer',
          'full stack developer', 'fullstack developer', 'full-stack developer',
          'software engineer', 'software developer', 'web developer',
          'senior developer', 'junior developer', 'lead developer',
          'project manager', 'product manager', 'team lead',
          'ui/ux designer', 'ux designer', 'ui designer',
          'data scientist', 'data analyst', 'business analyst',
          'devops engineer', 'system administrator', 'network engineer',
          'qa engineer', 'test engineer', 'quality assurance',
          'mobile developer', 'ios developer', 'android developer',
          'react developer', 'angular developer', 'vue developer',
          'python developer', 'java developer', 'node.js developer'
        ];
        
        // Check each line for job keywords
        for (const line of lines.slice(0, 20)) {
          const trimmed = line.trim();
          if (trimmed.length > 5 && trimmed.length < 100) {
            for (const keyword of jobKeywords) {
              if (trimmed.toLowerCase().includes(keyword)) {
                // Extract the full title context
                let extractedTitle = trimmed;
                // Clean up common prefixes
                extractedTitle = extractedTitle.replace(/^(we are looking for|seeking|hiring|position available|job opening|vacancy for|role:|position:)/i, '').trim();
                // Clean up common suffixes
                extractedTitle = extractedTitle.replace(/(at our company|with us|in our team)$/i, '').trim();
                
                if (extractedTitle.length > 3 && extractedTitle.length < 80) {
                  jobTitle = extractedTitle;
                  break;
                }
              }
            }
            if (jobTitle) break;
          }
        }
      }
      
      // If still no job title found, try pattern matching for common formats
      if (!jobTitle) {
        for (const line of lines.slice(0, 10)) {
          const trimmed = line.trim();
          // Look for lines that look like job titles (capitalized words with job-related terms)
          if (trimmed.length > 8 && trimmed.length < 60 && 
              /^[A-Z]/.test(trimmed) && 
              (trimmed.toLowerCase().includes('developer') ||
               trimmed.toLowerCase().includes('engineer') ||
               trimmed.toLowerCase().includes('manager') ||
               trimmed.toLowerCase().includes('analyst') ||
               trimmed.toLowerCase().includes('specialist') ||
               trimmed.toLowerCase().includes('consultant') ||
               trimmed.toLowerCase().includes('designer') ||
               trimmed.toLowerCase().includes('architect') ||
               trimmed.toLowerCase().includes('lead') ||
               trimmed.toLowerCase().includes('senior') ||
               trimmed.toLowerCase().includes('junior'))) {
            jobTitle = trimmed;
            break;
          }
        }
      }
      
      // Final fallback - extract from filename if available
      if (!jobTitle && file.name) {
        const fileName = file.name.replace(/\.(pdf|doc|docx|txt)$/i, '');
        // Look for job title patterns in filename
        const fileNameLower = fileName.toLowerCase();
        if (fileNameLower.includes('frontend') || fileNameLower.includes('front end')) {
          jobTitle = 'Frontend Developer';
        } else if (fileNameLower.includes('backend') || fileNameLower.includes('back end')) {
          jobTitle = 'Backend Developer';
        } else if (fileNameLower.includes('fullstack') || fileNameLower.includes('full stack')) {
          jobTitle = 'Full Stack Developer';
        } else if (fileNameLower.includes('developer')) {
          jobTitle = 'Software Developer';
        } else if (fileNameLower.includes('engineer')) {
          jobTitle = 'Software Engineer';
        } else {
          jobTitle = 'Software Developer'; // Final fallback
        }
      }
      
      const finalJobTitle = jobTitle || 'Software Developer';
      setExtractedJobTitle(finalJobTitle);
      setExtractedJobDescription(text);
      toast.success(`Job description extracted successfully! Found ${text.length} characters of content.`);
      console.log('Job title extraction results:');
      console.log('- Raw extracted title:', jobTitle);
      console.log('- Final title used:', finalJobTitle);
      console.log('- File name:', file.name);
    } catch (error) {
      console.error('Error extracting job details:', error);
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          toast.error('Cannot connect to server. Please ensure the backend is running.');
        } else if (error.message.includes('CORS')) {
          toast.error('CORS error. Please refresh the page and try again.');
        } else {
          toast.error(`Failed to extract job details: ${error.message}`);
        }
      } else {
        toast.error('Failed to extract job details. Please try again.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleJobDescFileChange = (file: File | null) => {
    setJobDescFile(file);
    if (file) {
      extractJobDetails(file);
    } else {
      setExtractedJobTitle('');
      setExtractedJobDescription('');
    }
  };

  const validateResumeFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    
    files.forEach(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (allowedExtensions.includes(fileExtension)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    // Show warnings for invalid files
    if (invalidFiles.length > 0) {
      toast.error(`❌ Invalid resume files detected`, {
        description: `Rejected ${invalidFiles.length} file(s): ${invalidFiles.join(', ')}. Only PDF, DOC, DOCX, TXT files are allowed.`,
        duration: 6000,
      });
    }
    
    // Show success message for valid files
    if (validFiles.length > 0) {
      toast.success(`✅ ${validFiles.length} resume file(s) uploaded successfully`, {
        description: validFiles.map(f => f.name).join(', '),
        duration: 4000,
      });
    }
    
    return validFiles;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = validateResumeFiles(files);
      setResumes(validFiles);
    }
  };

  const handleMultipleFileUpload = (files: File[]) => {
    const validFiles = validateResumeFiles(files);
    setResumes(validFiles);
  };

  const handleAnalyze = async () => {
    if (!extractedJobDescription) {
      toast.error("Please upload a job description file first");
      return;
    }

    if (resumes.length === 0) {
      toast.error("Please upload at least one resume");
      return;
    }

    setLoading(true);
    const analysisResults: ScoringResult[] = [];

    try {
      // Use batch ATS evaluation for HR efficiency
      toast.loading(`Analyzing ${resumes.length} resumes with ATS evaluation...`);
      
      const atsResults = await apiClient.evaluateBatchWithATS(resumes, extractedJobDescription);
      
      // Convert ATS results to ScoringResult format for backward compatibility
      for (const atsResult of atsResults) {
        const currentIndex = atsResults.indexOf(atsResult);
        const result: ScoringResult = {
          resume_id: atsResult.candidate_profile.contact_information.email || `resume_${currentIndex}_${resumes[currentIndex]?.name}`,
          filename: resumes[currentIndex]?.name || atsResult.candidate_profile.contact_information.filename || 'Unknown',
          total_score: Math.round(atsResult.ats_score),
          skill_match_score: atsResult.score_breakdown.skill_match_score,
          experience_score: atsResult.score_breakdown.experience_score,
          education_score: atsResult.score_breakdown.education_match_score,
          similarity_score: atsResult.score_breakdown.keyword_match_score,
          is_shortlisted: atsResult.status === "SHORTLISTED",
          matched_skills: atsResult.score_breakdown.matched_skills,
          missing_skills: atsResult.score_breakdown.missing_skills,
          candidate_email: atsResult.candidate_profile.contact_information.email,
          suggestions: atsResult.improvement_suggestions,
          // Store full ATS result for detailed view
          atsResult: atsResult
        };
        
        analysisResults.push(result);
      }
      
      // Sort by ATS score (highest first) - same as candidate side
      analysisResults.sort((a, b) => b.total_score - a.total_score);
      
      toast.success(`Successfully analyzed ${analysisResults.length} resumes with professional ATS evaluation!`);
      setResults(analysisResults);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze resumes";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  // HR flow now uses IDENTICAL logic to candidate flow for consistent results

  const sendShortlistEmail = async (candidateEmail: string, candidateName: string) => {
    try {
      toast.loading("Sending shortlist notification...");
      
      const emailParams = {
        to_name: candidateName.replace('.pdf', '').replace('.doc', '').replace('.docx', ''),
        to_email: candidateEmail,
        from_name: "AI Resume Scout HR Team",
        job_title: extractedJobTitle || "Software Developer",
        company_name: "AI Resume Scout",
        message: `Congratulations! Your resume has been reviewed and you have been shortlisted for the ${extractedJobTitle || 'Software Developer'} position. Our HR team will contact you soon to schedule an interview.`,
      };
      
      // For now, use mailto as direct email sending requires valid EmailJS setup
      // To enable direct email sending, configure EmailJS service with valid credentials
      const subject = encodeURIComponent(`Shortlisted for ${extractedJobTitle || 'Software Developer'} Position`);
      const body = encodeURIComponent(`Dear ${candidateName.replace('.pdf', '').replace('.doc', '').replace('.docx', '')},

Congratulations! Your resume has been reviewed and you have been shortlisted for the ${extractedJobTitle || 'Software Developer'} position.

Our HR team will contact you soon to schedule an interview.

Best regards,
AI Resume Scout Team`);
      
      const mailtoLink = `mailto:${candidateEmail}?subject=${subject}&body=${body}`;
      window.open(mailtoLink, '_blank');
      
      toast.dismiss();
      toast.success(`📧 Email client opened for ${candidateName || candidateEmail}`, {
        description: `Email ready to send to: ${candidateEmail}`,
        duration: 4000,
      });
      
      console.log(`Email client opened for ${candidateEmail} for job: ${extractedJobTitle}`);
    } catch (error) {
      toast.dismiss();
      console.error('Email error:', error);
      toast.error('Failed to open email client');
    }
  };

  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={handleBackToHome}
                className="gap-2 hover:bg-primary/10"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
              <div className="w-px h-6 bg-border" />
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                HR Dashboard
              </h1>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="sm:hidden relative mobile-menu-container">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                HR Dashboard
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center gap-2 hover:bg-primary/10"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
            
            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-card/95 backdrop-blur-lg rounded-lg border border-border shadow-lg z-50">
                <div className="p-4 space-y-3">
                  <Button variant="ghost" onClick={() => { handleBackToHome(); setIsMobileMenuOpen(false); }} className="w-full justify-start">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                  <Button variant="outline" onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="w-full justify-start">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Upload Section */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h2 className="text-xl font-bold mb-6">Bulk Resume Screening</h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <FileUpload
                label="Upload Job Description"
                onFileChange={handleJobDescFileChange}
                accept=".pdf,.doc,.docx,.txt"
              />
              
              {isExtracting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="w-4 h-4 animate-spin" />
                  Extracting job details from file...
                </div>
              )}
              
              {extractedJobTitle && (
                <div className="bg-card/30 rounded-lg p-4 border border-border/50">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Extracted Job Title</Label>
                        <p className="text-sm font-medium text-foreground mt-1">{extractedJobTitle}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Content Length</Label>
                        <p className="text-xs text-muted-foreground mt-1">{extractedJobDescription.length} characters</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Job Description Preview</Label>
                      <div className="text-xs text-muted-foreground mt-1 bg-muted/30 rounded p-2 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {extractedJobDescription.slice(0, 500)}{extractedJobDescription.length > 500 ? '...' : ''}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Upload Candidate Resumes (Multiple)</label>
                <div className="relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer group border-border hover:border-accent/50 hover:bg-accent/5">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Upload multiple candidate resumes"
                    title="Upload multiple candidate resumes"
                  />
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 bg-muted group-hover:bg-gradient-accent">
                      <Upload className="w-7 h-7 transition-colors text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Drag & drop or click to upload resumes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Select multiple files • Supported formats: PDF, DOC, DOCX, TXT
                      </p>
                    </div>
                  </div>
                </div>
                {resumes.length > 0 && (
                  <div className="bg-card/30 rounded-lg p-4 border border-border/50">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Selected Files ({resumes.length})
                      </Label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {resumes.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <span className="text-foreground truncate">{file.name}</span>
                            <span className="text-muted-foreground ml-auto">
                              {(file.size / 1024 / 1024).toFixed(1)}MB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>Analyzing Resumes...</>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Analyze All Resumes
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Candidate Rankings</h2>
            {sortedResults.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {sortedResults.filter(r => r.total_score >= 70).length} shortlisted out of {sortedResults.length} candidates
              </div>
            )}
          </div>
          
          {sortedResults.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm">
              <p className="text-muted-foreground">No screening results yet. Upload resumes to get started.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedResults.map((result, index) => {
                const isShortlisted = result.is_shortlisted || result.total_score >= 80;
                const isGoodCandidate = result.total_score >= 60; // Show actions for good candidates too
                return (
                  <Card key={result.resume_id} className={`p-6 bg-card/50 backdrop-blur-sm border-border/50 ${
                    isShortlisted ? 'ring-2 ring-success/30' : isGoodCandidate ? 'ring-1 ring-blue-500/20' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-amber-500/20 text-amber-600' :
                            index === 1 ? 'bg-slate-400/20 text-slate-600' :
                            index === 2 ? 'bg-orange-600/20 text-orange-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">
                              {result.filename}
                            </h3>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                isShortlisted 
                                  ? 'bg-success/20 text-success' 
                                  : isGoodCandidate 
                                    ? 'bg-blue-500/20 text-blue-600' 
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                {result.atsResult?.status || (isShortlisted ? 'SHORTLISTED' : 'UNDER REVIEW')}
                              </div>
                              <span className="text-sm font-semibold">ATS Score: {result.total_score}%</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>Skills: {result.skill_match_score?.toFixed(0)}%</span>
                              <span className="mx-2">•</span>
                              <span>Experience: {result.experience_score?.toFixed(0)}%</span>
                              <span className="mx-2">•</span>
                              <span>Education: {result.education_score?.toFixed(0)}%</span>
                              {result.project_score !== undefined && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Projects: {result.project_score?.toFixed(0)}%</span>
                                </>
                              )}
                            </div>
                            {result.candidate_email && (
                              <div className="text-xs text-muted-foreground mt-1">
                                📧 {result.candidate_email}
                              </div>
                            )}
                          </div>
                          <div className="ml-auto flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                              result.total_score >= 80 ? "bg-success/20 text-success" :
                              result.total_score >= 70 ? "bg-success/15 text-success" :
                              result.total_score >= 50 ? "bg-warning/20 text-warning" :
                              "bg-destructive/20 text-destructive"
                            }`}>
                              {result.total_score}% Match
                            </span>
                            {isShortlisted && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success/30 text-success">
                                ✓ Qualified
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Professional Summary from ATS */}
                        {result.atsResult?.professional_summary && (
                          <div className="mb-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Professional Summary:</span>
                            <p className="text-sm text-blue-900 dark:text-blue-300 mt-1">
                              {result.atsResult.professional_summary}
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-success">Matched Skills: </span>
                            <span className="text-muted-foreground">
                              {result.matched_skills?.join(", ") || "None"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-warning">Missing Skills: </span>
                            <span className="text-muted-foreground">
                              {result.missing_skills?.join(", ") || "None"}
                            </span>
                          </div>
                        </div>
                        
                        {result.suggestions && result.suggestions.length > 0 && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                            <span className="text-xs font-medium text-muted-foreground">Improvement Suggestions:</span>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              {result.suggestions.slice(0, 2).map((suggestion, idx) => (
                                <li key={idx}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons for all candidates with score >= 60 */}
                    {isGoodCandidate && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <div className="flex flex-wrap gap-2">
                          {isShortlisted ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => sendShortlistEmail(result.candidate_email || 'candidate@example.com', result.filename)}
                                className="bg-success/10 text-success hover:bg-success/20"
                                disabled={!result.candidate_email}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                {result.candidate_email ? 'Send Shortlist Email' : 'No Email Found'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.info(`Interview scheduled for ${result.candidate_name || result.filename}`)}
                              >
                                Schedule Interview
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const subject = `Application Update - ${extractedJobTitle || 'Position'}`;
                                  const body = `Thank you for your application. We are reviewing your profile and will get back to you soon.`;
                                  const mailtoLink = `mailto:${result.candidate_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                  window.open(mailtoLink, '_blank');
                                  toast.success(`Email client opened for ${result.filename}`);
                                }}
                                className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                                disabled={!result.candidate_email}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                {result.candidate_email ? 'Send Update' : 'No Email Found'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.info(`Feedback noted for ${result.filename}`)}
                              >
                                Provide Feedback
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {isShortlisted 
                            ? "✅ Shortlisted candidate - Ready for interview process" 
                            : "📋 Under review - Good potential candidate"}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
