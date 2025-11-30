import { ArrowLeft, Download, Lightbulb, TrendingUp, Home, RotateCcw, Brain, Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreGauge } from "@/components/ScoreGauge";
import { SkillCard } from "@/components/SkillCard";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [updateKey, setUpdateKey] = useState<number>(0);
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
  
  // Get ATS results from navigation state  
  const resultData = location.state;
  
  // Simple validation and setup
  useEffect(() => {
    if (!resultData || !resultData.atsResult || typeof resultData.atsResult.ats_score !== 'number') {
      console.log("❌ No valid ATS data found, redirecting to home");
      toast.error("Please upload a resume first to see results.");
      navigate("/", { replace: true });
      return;
    }
    
    console.log("✅ Valid ATS data received:", {
      score: resultData.atsResult.ats_score,
      status: resultData.atsResult.status,
      uploadId: resultData.uploadId
    });
    
    // Trigger component update
    setUpdateKey(Date.now());
  }, [resultData, navigate]);
  
  // Block rendering if no valid ATS data - show helpful message instead of redirect
  if (!resultData || !resultData.atsResult || typeof resultData.atsResult.ats_score !== 'number') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">No Analysis Data Found</h1>
            <p className="text-muted-foreground mb-6">
              It looks like you navigated directly to the results page. Please upload a resume and job description first to see your ATS analysis.
            </p>
          </div>
          
          <Button 
            onClick={() => navigate("/", { replace: true })}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis
          </Button>
        </div>
      </div>
    );
  }

  // Extract ATS data - ensure consistent display format
  const { atsResult } = resultData;

  // Use Evidence-Based ATS evaluation data (consistent with test results)  
  const realScore = atsResult.ats_score;
  const realStatus = atsResult.status;
  const isShortlisted = realStatus === "SHORTLISTED";
  const realMatchedSkills = atsResult.score_breakdown?.matched_skills || [];
  const realMissingSkills = atsResult.score_breakdown?.missing_skills || [];
  const realSuggestions = atsResult.improvement_suggestions || [];
  const professionalSummary = atsResult.professional_summary || "";
  const finalRecommendation = atsResult.final_recommendation || "";

  // Score breakdown components (consistent with backend Evidence-Based ATS)
  const scoreBreakdown = {
    skill_match_score: atsResult.score_breakdown?.skill_match_score || 0,
    experience_score: atsResult.score_breakdown?.experience_score || 0,
    role_fit_score: atsResult.score_breakdown?.role_fit_score || 0,
    education_match_score: atsResult.score_breakdown?.education_match_score || 0,
    certifications_score: atsResult.score_breakdown?.certifications_score || 0,
    tech_stack_match_score: atsResult.score_breakdown?.tech_stack_match_score || 0
  };

  const skillMatchLevel = realScore >= 80 ? "High" : realScore >= 60 ? "Medium" : "Low";
  
  // Log the actual display values for debugging
  console.log("📊 EVIDENCE-BASED ATS DISPLAY VALUES:");
  console.log("- ATS Score:", realScore, "%");
  console.log("- Status:", realStatus);  
  console.log("- Is Shortlisted:", isShortlisted);
  console.log("- Skill Match Level:", skillMatchLevel);
  console.log("- Matched Skills:", realMatchedSkills?.length || 0);
  console.log("- Missing Skills:", realMissingSkills?.length || 0);
  console.log("- Score Breakdown:", scoreBreakdown);
  console.log("- Suggestions Count:", realSuggestions?.length || 0);

  const handleBackToAnalysis = () => {
    navigate("/", { replace: true });
  };

  const handleDownloadReport = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = 30;

    // Header
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("AI Resume Scout Report", margin, yPosition);
    yPosition += 20;

    // Date
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 20;

    // Overall Score Section
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Overall Match Score", margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    const scoreColor: [number, number, number] = realScore >= 80 ? [34, 197, 94] : realScore >= 60 ? [249, 115, 22] : [239, 68, 68];
    pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.text(`${Math.round(realScore)}%`, margin, yPosition);
    pdf.setTextColor(0, 0, 0); // Reset to black
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.text(`Skill Match Level: ${skillMatchLevel}`, margin, yPosition);
    yPosition += 20;

    // Skills sections
    if (realMatchedSkills.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Matched Skills", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      realMatchedSkills.forEach((skill: string) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        pdf.text(`• ${skill}`, margin, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    if (realMissingSkills.length > 0) {
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Skills to Develop", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      realMissingSkills.forEach((skill: string) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        pdf.text(`• ${skill}`, margin, yPosition);
        yPosition += 8;
      });
      yPosition += 20;
    }

    // Recommendations
    if (realSuggestions.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      const suggestionTitle = realStatus 
        ? "Recommendations for Success" 
        : "Improvement Recommendations";
      pdf.text(suggestionTitle, margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      
      realSuggestions.forEach((suggestion: string, index: number) => {
        // Check if we need a new page for this suggestion
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 30;
        }

        const suggestionLines = pdf.splitTextToSize(`${index + 1}. ${suggestion}`, contentWidth - 10);
        suggestionLines.forEach((line: string) => {
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 4;
      });
    }

    pdf.save("ats-analysis-report.pdf");
    toast.success("Report downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden" key={`page-${updateKey}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">ATS Analysis Results</h1>
                <p className="text-muted-foreground">Professional resume evaluation complete</p>
              </div>
            </div>
            <Button
              onClick={handleBackToAnalysis}
              variant="outline"
              className="gap-2 hover:bg-primary/10 border-primary/20"
            >
              <RotateCcw className="w-4 h-4" />
              New Screening
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="sm:hidden relative mobile-menu-container">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">ATS Results</h1>
                </div>
              </div>
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
                <div className="p-4">
                  <Button
                    onClick={() => { handleBackToAnalysis(); setIsMobileMenuOpen(false); }}
                    variant="outline"
                    className="gap-2 hover:bg-primary/10 border-primary/20 w-full"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Screening
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-8" key={`results-${updateKey}`}>
        {/* Status Section */}
        <section className="text-center space-y-6 animate-fade-in" key={`status-${updateKey}`}>
          <StatusBadge isShortlisted={realStatus} key={`badge-${updateKey}`} />
          <div className="flex justify-center" key={`gauge-container-${updateKey}`}>
            <ScoreGauge 
              score={Math.round(realScore)} 
              key={`gauge-${realScore}-${updateKey}`} 
            />
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="px-6 py-3 bg-card rounded-xl border border-border shadow-soft" key={`level-${updateKey}-${skillMatchLevel}`}>
              <span className="text-muted-foreground">Skill Match Level: </span>
              <span className="font-bold text-foreground" key={`level-text-${skillMatchLevel}-${updateKey}`}>{skillMatchLevel}</span>
            </div>
          </div>
        </section>

        {/* Skills Analysis */}
        <section className="grid md:grid-cols-2 gap-6" key={`skills-${updateKey}`}>
          <SkillCard
            key={`matched-${realMatchedSkills.join(',')}-${updateKey}`}
            title="Matched Skills"
            skills={realMatchedSkills}
            isMatched={true}
          />
          <SkillCard
            key={`missing-${realMissingSkills.join(',')}-${updateKey}`}
            title="Missing Skills"
            skills={realMissingSkills}
            isMatched={false}
          />
        </section>

        {/* Evidence-Based ATS Score Breakdown */}
        <section className="animate-slide-up" key={`breakdown-${updateKey}`}>
          <div className="bg-card rounded-2xl p-8 border border-border shadow-medium">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Evidence-Based Score Breakdown</h2>
                <p className="text-muted-foreground">Detailed analysis using professional ATS criteria</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                <div className="text-2xl font-bold text-primary">{scoreBreakdown.skill_match_score}%</div>
                <div className="text-sm text-muted-foreground">Skills Match (40%)</div>
              </div>
              <div className="bg-accent/5 p-4 rounded-xl border border-accent/20">
                <div className="text-2xl font-bold text-accent">{scoreBreakdown.experience_score}%</div>
                <div className="text-sm text-muted-foreground">Experience (25%)</div>
              </div>
              <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/20">
                <div className="text-2xl font-bold text-secondary">{scoreBreakdown.role_fit_score}%</div>
                <div className="text-sm text-muted-foreground">Role Fit (15%)</div>
              </div>
              <div className="bg-success/5 p-4 rounded-xl border border-success/20">
                <div className="text-2xl font-bold text-success">{scoreBreakdown.education_match_score}%</div>
                <div className="text-sm text-muted-foreground">Education (10%)</div>
              </div>
              <div className="bg-warning/5 p-4 rounded-xl border border-warning/20">
                <div className="text-2xl font-bold text-warning">{scoreBreakdown.certifications_score}%</div>
                <div className="text-sm text-muted-foreground">Certifications (5%)</div>
              </div>
              <div className="bg-info/5 p-4 rounded-xl border border-info/20">
                <div className="text-2xl font-bold text-info">{scoreBreakdown.tech_stack_match_score}%</div>
                <div className="text-sm text-muted-foreground">Tech Stack (5%)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Candidate Profile Information */}
        <section className="animate-slide-up" key={`profile-${updateKey}`}>
          <div className="bg-card rounded-2xl p-6 border border-border shadow-medium">
            <h2 className="text-xl font-bold text-foreground mb-4">Candidate Profile Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{atsResult.candidate_profile?.total_experience || 0}</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div className="text-center p-3 bg-accent/5 rounded-lg">
                <div className="text-2xl font-bold text-accent">{atsResult.candidate_profile?.technical_skills?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Technical Skills</div>
              </div>
              <div className="text-center p-3 bg-secondary/5 rounded-lg">
                <div className="text-2xl font-bold text-secondary">{atsResult.candidate_profile?.certifications?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Certifications</div>
              </div>
              <div className="text-center p-3 bg-success/5 rounded-lg">
                <div className="text-2xl font-bold text-success">{atsResult.candidate_profile?.education_details?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Education Entries</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-foreground mb-1">Seniority Level:</div>
              <div className="text-foreground">{atsResult.candidate_profile?.seniority_level || 'Not determined'}</div>
            </div>
          </div>
        </section>

        {/* Comprehensive ATS Results - Only shown when ATS data is available */}
        {atsResult && (
          <>
            {/* Professional Summary Section */}
            <section className="animate-slide-up" key={`summary-${updateKey}`}>
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-primary/20 shadow-medium">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Professional Summary</h2>
                    <p className="text-muted-foreground">Comprehensive analysis of candidate profile</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {professionalSummary}
                  </p>
                </div>
              </div>
            </section>

            {/* Final Recommendation */}
            <section className="animate-slide-up" key={`recommendation-${updateKey}`}>
              <div className={`rounded-2xl p-8 border shadow-medium ${
                isShortlisted 
                  ? "bg-gradient-to-br from-success/10 to-success/5 border-success/20"
                  : "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20"
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    realStatus 
                      ? "bg-success/20 text-success"
                      : "bg-warning/20 text-warning"
                  }`}>
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Final Recommendation</h2>
                    <p className="text-muted-foreground">AI-powered hiring decision support</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground leading-relaxed font-medium">
                    {finalRecommendation}
                  </p>
                </div>
              </div>
            </section>

            {/* Improvement Suggestions */}
            {realSuggestions && realSuggestions.length > 0 && (
              <section className="animate-slide-up" key={`suggestions-${updateKey}`}>
                <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-8 border border-accent/20 shadow-medium">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {realStatus ? "Career Enhancement Tips" : "Improvement Recommendations"}
                      </h2>
                      <p className="text-muted-foreground">Actionable insights for professional growth</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {realSuggestions.map((suggestion: string, index: number) => (
                      <li key={`suggestion-${index}-${updateKey}`} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent">{index + 1}</span>
                        </div>
                        <p className="text-foreground leading-relaxed">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Download Report Section */}
            <section className="text-center animate-fade-in" key={`download-${updateKey}`}>
              <Button
                onClick={handleDownloadReport}
                size="lg"
                className="gap-3 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Download Detailed Report
              </Button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}