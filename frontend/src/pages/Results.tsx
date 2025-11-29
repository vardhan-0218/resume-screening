import { ArrowLeft, Download, Lightbulb, TrendingUp, Home, RotateCcw, Brain } from "lucide-react";
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
  
  // Force re-render state with cache busting
  const [renderKey, setRenderKey] = useState<string>("");
  const [componentResetKey, setComponentResetKey] = useState<number>(0);
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  
  // Get real-time ATS results from navigation state with backup recovery
  let resultData = location.state;
  
  // Backup recovery mechanism if navigation state is lost
  if (!resultData) {
    console.log("🔄 ATTEMPTING BACKUP RECOVERY - Navigation state lost");
    const backupData = sessionStorage.getItem('atsResultBackup');
    if (backupData) {
      try {
        const parsed = JSON.parse(backupData);
        const ageMinutes = (Date.now() - parsed.preservedAt) / (1000 * 60);
        if (ageMinutes < 5) { // Only use backup if less than 5 minutes old
          console.log("✅ BACKUP RECOVERY SUCCESSFUL - Using preserved data");
          resultData = parsed;
        } else {
          console.log("⏰ BACKUP TOO OLD - Clearing stale data");
          sessionStorage.removeItem('atsResultBackup');
        }
      } catch (error) {
        console.log("❌ BACKUP RECOVERY FAILED - Invalid stored data");
        sessionStorage.removeItem('atsResultBackup');
      }
    }
  }
  
  // Force complete page refresh if same data detected
  useEffect(() => {
    if (!resultData) return;
    
    const lastData = sessionStorage.getItem('lastAtsResult');
    const currentData = JSON.stringify(resultData?.atsResult);
    
    if (lastData === currentData && resultData?.uploadId && lastData !== 'null') {
      console.log("🔄 FORCING PAGE REFRESH - Same data detected");
      sessionStorage.removeItem('lastAtsResult');
      window.location.reload();
      return;
    }
    
    sessionStorage.setItem('lastAtsResult', currentData);
  }, [resultData]);
  
  // Monitor score changes and force refresh if needed
  useEffect(() => {
    if (resultData?.atsResult?.ats_score && lastScore !== null) {
      if (lastScore === resultData.atsResult.ats_score && resultData.uploadId) {
        console.log("🚨 SAME SCORE DETECTED - Different upload but same score!");
        console.log("🔄 FORCING IMMEDIATE PAGE REFRESH");
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
    
    if (resultData?.atsResult?.ats_score) {
      setLastScore(resultData.atsResult.ats_score);
    }
  }, [resultData?.atsResult?.ats_score, resultData?.uploadId, lastScore]);
  
  // STRICT validation with detailed logging
  useEffect(() => {
    console.log("🔍 RESULTS PAGE DEBUG:");
    console.log("1. Navigation location.state:", location.state);
    console.log("2. ResultData exists:", !!resultData);
    console.log("3. AtsResult exists:", !!resultData?.atsResult);
    console.log("4. ATS Score value:", resultData?.atsResult?.ats_score);
    console.log("5. ATS Score type:", typeof resultData?.atsResult?.ats_score);
    console.log("6. ATS Status:", resultData?.atsResult?.status);
    console.log("7. Upload ID:", resultData?.uploadId);
    console.log("8. Timestamp:", resultData?.timestamp ? new Date(resultData.timestamp).toISOString() : 'No timestamp');
    console.log("9. Full ATS Result:", JSON.stringify(resultData?.atsResult, null, 2));
    console.log("10. Current URL:", window.location.href);
    console.log("11. Location pathname:", location.pathname);
    console.log("12. Full location object:", location);
    
    if (!resultData || !resultData.atsResult || typeof resultData.atsResult.ats_score !== 'number') {
      console.log("❌ REDIRECTING - Invalid data detected");
      console.log("📍 Possible causes:");
      console.log("   - Direct access to /results URL");
      console.log("   - Browser refresh on results page");
      console.log("   - Navigation state lost");
      console.log("   - API call failed during analysis");
      
      toast.error("No valid ATS results found. Please analyze a resume first.");
      
      // Add small delay to ensure toast shows before navigation
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
      return;
    }
    
    console.log("✅ VALID DATA - Proceeding with display");
    console.log("📊 UNIQUE UPLOAD CONFIRMED - Upload ID:", resultData.uploadId);
    console.log("🔥 FORCING COMPLETE COMPONENT RESET");
    
    // Force complete component reset
    setComponentResetKey(prev => prev + 1);
    setRenderKey(`render-${resultData.uploadId}-${resultData.timestamp}-${Date.now()}`);
    
    // Complete browser cache clearing
    if (window.performance && window.performance.navigation) {
      console.log("🧹 Browser navigation type:", window.performance.navigation.type);
    }
    
    // Preserve navigation state in sessionStorage as backup
    sessionStorage.setItem('atsResultBackup', JSON.stringify({
      ...resultData,
      preservedAt: Date.now()
    }));
    
    // Force browser history clear
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const newState = {
        ...resultData,
        clearCache: Date.now()
      };
      window.history.replaceState(newState, '', window.location.href);
    }
  }, [resultData, navigate, location]);
  
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

  // Extract ONLY real ATS data - no legacy data allowed
  const {
    atsResult,
    candidateProfile,
    scoreBreakdown,
    professionalSummary,
    finalRecommendation,
    keywordsToAdd
  } = resultData;

  // Use ONLY real-time ATS evaluation data
  const realScore = atsResult.ats_score;
  const realStatus = atsResult.status === "SHORTLISTED";
  const realMatchedSkills = atsResult.score_breakdown.matched_skills;
  const realMissingSkills = atsResult.score_breakdown.missing_skills;
  const realSuggestions = atsResult.improvement_suggestions;

  const skillMatchLevel = realScore >= 80 ? "High" : realScore >= 60 ? "Medium" : "Low";
  
  // Log the actual display values
  console.log("📊 DISPLAY VALUES:");
  console.log("- Real Score:", realScore);
  console.log("- Real Status:", realStatus);
  console.log("- Skill Match Level:", skillMatchLevel);
  console.log("- Matched Skills:", realMatchedSkills);
  console.log("- Missing Skills:", realMissingSkills);
  console.log("- Suggestions:", realSuggestions);

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

    // Status Section
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Application Status", margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    const statusColor: [number, number, number] = realStatus ? [34, 197, 94] : [239, 68, 68];
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.text(realStatus ? "✓ Shortlisted" : "✗ Not Shortlisted", margin, yPosition);
    pdf.setTextColor(0, 0, 0); // Reset to black
    yPosition += 20;

    // Matched Skills Section
    if (realMatchedSkills && realMatchedSkills.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Matched Skills", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      realMatchedSkills.forEach((skill: string) => {
        pdf.text(`• ${skill}`, margin, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Missing Skills Section
    if (realMissingSkills && realMissingSkills.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Missing Skills", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      realMissingSkills.forEach((skill: string) => {
        pdf.text(`• ${skill}`, margin, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Suggestions Section
    if (realSuggestions && realSuggestions.length > 0) {
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

    // Footer
    const totalPages = pdf.internal.pages.length - 1; // Subtract 1 because of the empty first element
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        `Generated by AI Resume Scout - Page ${i} of ${totalPages}`,
        margin,
        pdf.internal.pageSize.getHeight() - 10
      );
    }

    // Download the PDF
    const fileName = realStatus 
      ? `Resume_Screening_Report_${new Date().toISOString().split('T')[0]}.pdf`
      : `Resume_Improvement_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    pdf.save(fileName);
    toast.success("Report downloaded successfully!");
  };

  const handleBackToApp = () => {
    navigate("/app");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleNewScreening = () => {
    navigate("/app", { replace: true });
    toast.success("Ready for new resume screening!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5" key={renderKey || `results-root-${resultData?.uploadId}`}>
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleBackToApp}
              className="gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Upload
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="gap-2 hover:bg-primary/10"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
          </div>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {atsResult ? 'ATS Evaluation Results' : 'Screening Results'}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleNewScreening}
              className="gap-2 hover:bg-primary/10"
            >
              <RotateCcw className="w-4 h-4" />
              New Screening
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-8" key={`results-${resultData.uploadId}`}>
        {/* Status Section */}
        <section className="text-center space-y-6 animate-fade-in" key={`status-${resultData.uploadId}`}>
          <StatusBadge isShortlisted={realStatus} key={`badge-${resultData.uploadId}`} />
          <div className="flex justify-center" key={`gauge-container-${componentResetKey}`}>
            <ScoreGauge 
              score={Math.round(realScore)} 
              key={`gauge-${resultData.uploadId}-${realScore}-${componentResetKey}-${Date.now()}`} 
            />
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="px-6 py-3 bg-card rounded-xl border border-border shadow-soft" key={`level-${resultData.uploadId}-${componentResetKey}-${skillMatchLevel}`}>
              <span className="text-muted-foreground">Skill Match Level: </span>
              <span className="font-bold text-foreground" key={`level-text-${skillMatchLevel}-${componentResetKey}`}>{skillMatchLevel}</span>
            </div>
          </div>
        </section>

        {/* Skills Analysis */}
        <section className="grid md:grid-cols-2 gap-6" key={`skills-${resultData.uploadId}`}>
          <SkillCard
            key={`matched-${resultData.uploadId}-${realMatchedSkills.join(',')}-${componentResetKey}`}
            title="Matched Skills"
            skills={realMatchedSkills}
            isMatched={true}
          />
          <SkillCard
            key={`missing-${resultData.uploadId}-${realMissingSkills.join(',')}-${componentResetKey}`}
            title="Missing Skills"
            skills={realMissingSkills}
            isMatched={false}
          />
        </section>

        {/* Comprehensive ATS Results - Only shown when ATS data is available */}
        {atsResult && (
          <>
            {/* Professional Summary Section */}
            <section className="animate-slide-up" key={`summary-${resultData.uploadId}`}>
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-primary/20 shadow-medium">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Professional Summary</h2>
                    <p className="text-sm text-muted-foreground">HR-Ready Evaluation Report</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-card rounded-xl border border-border" key={`summary-text-${resultData.uploadId}`}>
                    <p className="text-foreground">{professionalSummary}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4" key={`profile-${resultData.uploadId}`}>
                    <div className="p-4 bg-card rounded-xl border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Seniority Level</div>
                      <div className="text-xl font-bold text-foreground">{candidateProfile?.seniority_level}</div>
                    </div>
                    <div className="p-4 bg-card rounded-xl border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Total Experience</div>
                      <div className="text-xl font-bold text-foreground">{candidateProfile?.total_experience} years</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Detailed Score Breakdown */}
            <section className="animate-slide-up">
              <div className="bg-card rounded-2xl p-8 border border-border shadow-medium">
                <h2 className="text-2xl font-bold text-foreground mb-6">ATS Score Breakdown</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {scoreBreakdown && [
                    { label: "Skills Match", score: scoreBreakdown.skill_match_score, weight: "40%" },
                    { label: "Experience Match", score: scoreBreakdown.experience_score, weight: "25%" },
                    { label: "Role Fit", score: scoreBreakdown.role_fit_score, weight: "15%" },
                    { label: "Education Match", score: scoreBreakdown.education_match_score, weight: "10%" },
                    { label: "Certifications", score: scoreBreakdown.certifications_score, weight: "5%" },
                    { label: "Keywords & Tools", score: Math.round((scoreBreakdown.keyword_match_score + scoreBreakdown.tech_stack_match_score) / 2), weight: "5%" },
                  ].map((item, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-xs text-muted-foreground">Weight: {item.weight}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full bg-gradient-primary rounded-full transition-all duration-1000 ${
                              item.score >= 90 ? 'w-full' :
                              item.score >= 80 ? 'w-4/5' :
                              item.score >= 70 ? 'w-3/4' :
                              item.score >= 60 ? 'w-3/5' :
                              item.score >= 50 ? 'w-1/2' :
                              item.score >= 40 ? 'w-2/5' :
                              item.score >= 30 ? 'w-1/3' :
                              item.score >= 20 ? 'w-1/5' :
                              item.score >= 10 ? 'w-1/12' : 'w-0'
                            }`}
                          />
                        </div>
                        <span className="text-sm font-bold text-foreground">{Math.round(item.score)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Final Recommendation */}
            <section className="animate-slide-up">
              <div className={`rounded-2xl p-8 border-2 shadow-medium ${
                realStatus 
                  ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/30' 
                  : 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30'
              }`}>
                <h2 className="text-2xl font-bold text-foreground mb-4">Final Recommendation</h2>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-foreground font-medium">{finalRecommendation}</p>
                </div>
              </div>
            </section>

            {/* Keywords to Add */}
            {keywordsToAdd && keywordsToAdd.length > 0 && (
              <section className="animate-slide-up" key={`keywords-${resultData.uploadId}`}>
                <div className="bg-card rounded-2xl p-8 border border-border shadow-medium">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Keywords to Add</h2>
                  <div className="flex flex-wrap gap-2">
                    {keywordsToAdd.map((keyword, index) => (
                      <span 
                        key={`keyword-${resultData.uploadId}-${index}`}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Adding these keywords to your resume can improve ATS compatibility and match score.
                  </p>
                </div>
              </section>
            )}
          </>
        )}

        {/* AI Feedback Section */}
        {!realStatus && (
          <section className="animate-slide-up" key={`feedback-${resultData.uploadId}`}>
            <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl p-8 border-2 border-warning/30 shadow-medium">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning to-destructive flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-warning-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    AI Improvement Suggestions
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your resume needs improvement to qualify for this role
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {realSuggestions.map((suggestion: string, index: number) => (
                  <div
                    key={`suggestion-${resultData.uploadId}-${index}`}
                    className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border"
                  >
                    <TrendingUp className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Shortlisting Success Section */}
        {realStatus && (
          <section className="animate-slide-up" key={`success-${resultData.uploadId}`}>
            <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-2xl p-8 border-2 border-success/30 shadow-medium text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-success flex items-center justify-center animate-pulse-glow">
                  <Download className="w-8 h-8 text-success-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Congratulations! 🎉
                </h2>
                <p className="text-muted-foreground max-w-md">
                  You have been shortlisted for this position. Your profile has been
                  sent to the recruiter.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Download Report Button */}
        <section className="flex justify-center animate-fade-in">
          <Button
            onClick={handleDownloadReport}
            size="lg"
            className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-large"
          >
            <Download className="w-5 h-5" />
            Download {realStatus ? "Screening" : "Improvement"} Report
          </Button>
        </section>
      </main>
    </div>
  );
}
