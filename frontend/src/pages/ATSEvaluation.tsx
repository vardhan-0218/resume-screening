import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Target, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Download,
  Loader2,
  BrainCircuit,
  Users,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ATSScoreBreakdown {
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

interface ATSCandidateProfile {
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
  contact_information: Record<string, string>;
  resume_keywords: string[];
  seniority_level: string;
}

interface ATSResult {
  ats_score: number;
  status: string;
  score_breakdown: ATSScoreBreakdown;
  candidate_profile: ATSCandidateProfile;
  professional_summary: string;
  improvement_suggestions: string[];
  keywords_to_add: string[];
  final_recommendation: string;
}

export default function ATSEvaluationPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes('pdf') || 
          file.type.includes('document') || 
          file.type.includes('text')) {
        setResumeFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, DOCX, or TXT file",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleEvaluate = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload a resume and provide a job description",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);
    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('job_description', jobDescription);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/ats/evaluate-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ATS evaluation failed');
      }

      const result: ATSResult = await response.json();
      setAtsResult(result);
      
      toast({
        title: "ATS Evaluation Complete",
        description: `Candidate scored ${result.ats_score}% - Status: ${result.status}`,
      });
    } catch (error) {
      console.error('ATS evaluation error:', error);
      toast({
        title: "Evaluation Failed",
        description: error instanceof Error ? error.message : "An error occurred during ATS evaluation",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === "SHORTLISTED") return "default";
    if (status === "BORDERLINE – NEEDS IMPROVEMENT") return "secondary";
    return "destructive";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const resetEvaluation = () => {
    setResumeFile(null);
    setJobDescription('');
    setAtsResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-gradient-accent rounded-full text-accent-foreground shadow-medium">
            <BrainCircuit className="w-5 h-5" />
            <span className="text-sm font-semibold">Professional ATS Evaluation</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Advanced Resume Screening Engine
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get comprehensive ATS-style evaluation with detailed scoring, professional insights, 
            and improvement recommendations - just like HR departments use.
          </p>
        </div>

        {!atsResult ? (
          /* Input Section */
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Resume Upload */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{resumeFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResumeFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">Drop resume here</p>
                        <p className="text-muted-foreground mb-4">
                          Or click to select file
                        </p>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                          id="resume-upload"
                        />
                        <Button asChild variant="outline">
                          <label htmlFor="resume-upload" className="cursor-pointer">
                            Select File
                          </label>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste the complete job description here...

Example:
We are looking for a Senior Software Engineer with 5+ years of experience in Python, React, and AWS. Must have strong problem-solving skills and experience with microservices architecture..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={12}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {jobDescription.length} characters
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={handleEvaluate}
                disabled={!resumeFile || !jobDescription.trim() || isEvaluating}
                size="lg"
                className="text-lg px-8 py-4"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-5 h-5 mr-2" />
                    Start ATS Evaluation
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="max-w-7xl mx-auto">
            {/* Overall Score Header */}
            <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-2">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(atsResult.ats_score)}`}>
                      {atsResult.ats_score}%
                    </div>
                    <p className="text-lg text-muted-foreground">ATS Score</p>
                  </div>
                  
                  <div className="text-center">
                    <Badge 
                      variant={getStatusBadgeVariant(atsResult.status)}
                      className="text-lg px-4 py-2 mb-3"
                    >
                      {atsResult.status}
                    </Badge>
                    <p className="text-muted-foreground">Evaluation Status</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-6 h-6 text-primary" />
                      <span className="text-2xl font-bold">
                        {atsResult.candidate_profile.seniority_level}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {atsResult.candidate_profile.total_experience} years experience
                    </p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Professional Summary</h4>
                  <p className="text-muted-foreground">{atsResult.professional_summary}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Detailed Scores */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Score Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Skills Match", score: atsResult.score_breakdown.skill_match_score, weight: "40%" },
                      { label: "Experience Match", score: atsResult.score_breakdown.experience_score, weight: "25%" },
                      { label: "Role Fit", score: atsResult.score_breakdown.role_fit_score, weight: "15%" },
                      { label: "Education Match", score: atsResult.score_breakdown.education_match_score, weight: "10%" },
                      { label: "Certifications", score: atsResult.score_breakdown.certifications_score, weight: "5%" },
                      { label: "Keywords & Tools", score: (atsResult.score_breakdown.keyword_match_score + atsResult.score_breakdown.tech_stack_match_score) / 2, weight: "5%" }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.weight}
                            </Badge>
                            <span className={`font-bold ${getScoreColor(item.score)}`}>
                              {item.score.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress value={item.score} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Matched Skills & Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Skills ({atsResult.score_breakdown.matched_skills.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.score_breakdown.matched_skills.slice(0, 10).map((skill, index) => (
                            <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Tools ({atsResult.score_breakdown.matched_tools.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.score_breakdown.matched_tools.slice(0, 10).map((tool, index) => (
                            <Badge key={index} variant="default" className="bg-blue-100 text-blue-800">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Gaps and Recommendations */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Missing Skills & Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Missing Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.score_breakdown.missing_skills.slice(0, 10).map((skill, index) => (
                            <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Missing Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.score_breakdown.missing_tools.slice(0, 10).map((tool, index) => (
                            <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {atsResult.improvement_suggestions.map((suggestion, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Final Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium">{atsResult.final_recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={resetEvaluation} variant="outline" size="lg">
                Evaluate Another Resume
              </Button>
              <Button size="lg" disabled>
                <Download className="w-4 h-4 mr-2" />
                Export Report (Coming Soon)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}