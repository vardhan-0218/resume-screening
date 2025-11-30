import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { Loader2, Sparkles, Brain, LogIn, LogOut, User, Users, ArrowLeft, RotateCcw, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { apiClient, ATSResult } from "@/lib/api";
import { useHybridAuth } from "@/hooks/useHybridAuth";

export default function Index() {
  const navigate = useNavigate();
  const { user, userRole, signOut, loading } = useHybridAuth();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescFile, setJobDescFile] = useState<File | null>(null);
  const [jobDescText, setJobDescText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(false);
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

  // Clear any cached results on page load
  useEffect(() => {
    console.log("🧹 CLEARING ALL CACHES - Fresh Index Load");
    
    // Clear all possible cached data
    sessionStorage.clear();
    localStorage.removeItem('lastAtsResult');
    localStorage.removeItem('lastUploadId');
    localStorage.removeItem('atsEvaluationCache');
    
    // Clear browser caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('ats') || name.includes('resume') || name.includes('api')) {
            caches.delete(name);
            console.log(`🗑️ Cleared cache: ${name}`);
          }
        });
      });
    }
    
    // Force browser to reload API calls
    if (navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
  }, []);

  // Reset function to clear all form data
  const handleReset = () => {
    setResumeFile(null);
    setJobDescFile(null);
    setJobDescText("");
    setIsAnalyzing(false);
    setResetTrigger(!resetTrigger); // Trigger FileUpload reset
    toast.success("Form reset successfully!");
  };

  // Back to home function
  const handleBackToHome = () => {
    if (isAnalyzing) {
      toast.error("Please wait for analysis to complete before navigating away.");
      return;
    }
    navigate("/", { replace: true });
  };

  // Automatically redirect HR users to dashboard
  useEffect(() => {
    if (!loading && user && userRole === 'hr') {
      // Use a small delay to ensure auth state is fully settled
      const timer = setTimeout(() => {
        navigate('/hr/dashboard', { replace: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [user, userRole, loading, navigate]);

  // Clear any cached navigation state when page loads
  useEffect(() => {
    console.log("🔄 INDEX PAGE LOADED - Clearing cached state");
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // Handle job description file upload and extract text
  const handleJobDescFileChange = async (file: File) => {
    setJobDescFile(file);
    
    // Extract text from job description file
    try {
      const text = await file.text();
      setJobDescText(text);
      toast.success("Job description file loaded successfully!");
    } catch (error) {
      toast.error("Failed to read job description file. Please try again.");
    }
  };

  const handleScreening = async () => {
    // Check if we have both resume and job description
    const hasJobDescription = jobDescText.trim().length > 0 || jobDescFile;
    
    if (!resumeFile || !hasJobDescription) {
      toast.error("Please upload a resume and provide a job description (either as text or file).");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Use job description text or extract from file if needed
      let finalJobDescription = jobDescText.trim();
      
      if (!finalJobDescription && jobDescFile) {
        try {
          finalJobDescription = await jobDescFile.text();
        } catch {
          throw new Error("Failed to read job description file");
        }
      }

      if (finalJobDescription.length < 50) {
        throw new Error("Job description must be at least 50 characters long");
      }

      // Perform comprehensive ATS evaluation
      console.log("🚀 CALLING ATS API:");
      console.log("- Resume file:", resumeFile.name, resumeFile.size, "bytes");
      console.log("- Job description length:", finalJobDescription.length, "chars");
      console.log("- API endpoint: /api/ats/evaluate-resume");
      
      const atsResult: ATSResult = await apiClient.evaluateResumeWithATS(
        resumeFile,
        finalJobDescription
      );

      console.log("📡 API RESPONSE DEBUG:");
      console.log("=".repeat(50));
      console.log("1. Raw ATS Result:", JSON.stringify(atsResult, null, 2));
      console.log("2. ATS Score:", atsResult.ats_score, "(type:", typeof atsResult.ats_score, ")");
      console.log("3. Status:", atsResult.status);
      console.log("4. Matched Skills:", atsResult.score_breakdown?.matched_skills);
      console.log("5. Professional Summary:", atsResult.professional_summary?.substring(0, 100) + "...");
      console.log("6. Is this REAL data?", atsResult.ats_score !== 85 && atsResult.status !== "Shortlisted");
      console.log("=".repeat(50));

      // Determine if shortlisted based on ATS score
      const isShortlisted = atsResult.status === "SHORTLISTED";
      
      // REAL DATA VALIDATION - Only flag actual dummy content, not legitimate results
      const isDummyData = (
        atsResult.professional_summary?.toLowerCase().includes("dummy") ||
        atsResult.professional_summary?.toLowerCase().includes("sample") ||
        atsResult.professional_summary?.toLowerCase().includes("placeholder") ||
        atsResult.candidate_profile?.candidate_summary?.toLowerCase().includes("dummy")
      );
      
      if (isDummyData) {
        console.error("🚨 DUMMY DATA DETECTED! This should NOT happen!");
        console.error("Professional Summary:", atsResult.professional_summary);
        toast.error("Warning: Dummy data detected. Backend may not be processing correctly.");
      } else {
        console.log("✅ REAL DATA CONFIRMED - Score:", atsResult.ats_score, "Status:", atsResult.status);
        console.log("✅ Evidence-Based ATS evaluation successful");
      }
      
      // Navigate to results with ONLY real ATS data - NO legacy/dummy data
      const navigationState = {
        // ONLY real ATS evaluation data - no legacy fallbacks
        atsResult,
        candidateProfile: atsResult.candidate_profile,
        scoreBreakdown: atsResult.score_breakdown,
        professionalSummary: atsResult.professional_summary,
        finalRecommendation: atsResult.final_recommendation,
        keywordsToAdd: atsResult.keywords_to_add,
      };
      
      console.log("🚀 NAVIGATION STATE DEBUG:");
      console.log("Navigation state being sent:", JSON.stringify(navigationState, null, 2));
      
      // Add unique timestamp to prevent caching
      const uniqueNavigationState = {
        ...navigationState,
        timestamp: Date.now(),
        uploadId: Math.random().toString(36).substring(7)
      };
      
      console.log("🔍 PRE-NAVIGATION DEBUG:");
      console.log("1. Current URL:", window.location.href);
      console.log("2. Navigation state size:", JSON.stringify(uniqueNavigationState).length, "characters");
      console.log("3. ATS Score being passed:", uniqueNavigationState.atsResult.ats_score);
      console.log("4. Upload ID being passed:", uniqueNavigationState.uploadId);
      
      // Clear any existing browser history state
      window.history.replaceState(null, '', window.location.pathname);
      
      try {
        navigate("/results", {
          replace: true,
          state: uniqueNavigationState
        });
        console.log("✅ NAVIGATION INITIATED SUCCESSFULLY");
      } catch (navError) {
        console.error("❌ NAVIGATION FAILED:", navError);
        toast.error("Navigation failed. Please try again.");
        setIsAnalyzing(false);
        return;
      }
      
      // Clear form data after successful navigation
      setResumeFile(null);
      setJobDescFile(null);
      setJobDescText("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze resume";
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow [animation-delay:1s]" />
      </div>

      <div className="relative z-10 w-full min-h-screen">
        <div className="fluid-width fluid-padding py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Header */}
        <header className="mb-8 md:mb-16 animate-fade-in">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex justify-between items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToHome}
              className="flex items-center gap-2 hover:bg-primary/10"
              disabled={isAnalyzing}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {userRole === 'hr' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <span>{user.email}</span>
                  <span className="text-xs">({userRole?.toUpperCase()})</span>
                </div>
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => navigate("/auth/login")}>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="sm:hidden relative mb-6 mobile-menu-container">
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                onClick={handleBackToHome}
                className="flex items-center gap-2 hover:bg-primary/10"
                disabled={isAnalyzing}
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center gap-2 hover:bg-primary/10"
                disabled={isAnalyzing}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
            
            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-card/95 backdrop-blur-lg rounded-lg border border-border shadow-lg z-50">
                <div className="p-4 space-y-4">
                  {user ? (
                    <>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground border-b border-border pb-3">
                        {userRole === 'hr' ? <Users className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        <div className="flex flex-col min-w-0">
                          <span className="text-foreground font-medium truncate">{user.email}</span>
                          <span className="text-xs text-muted-foreground">{userRole?.toUpperCase()} Account</span>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => { navigate("/auth/login"); setIsMobileMenuOpen(false); }} className="w-full">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-gradient-accent rounded-full text-accent-foreground shadow-medium">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-semibold">Powered by Advanced AI</span>
            </div>
            <h1 className="fluid-heading font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              {userRole === 'hr' ? 'HR Resume Screening Dashboard' : 'AI Resume Screening System'}
            </h1>
            <p className="fluid-text text-muted-foreground w-full max-w-4xl mx-auto px-4 sm:px-0">
              {userRole === 'hr' 
                ? 'Access your HR dashboard for multiple resume screening and candidate ranking'
                : user 
                  ? 'Upload your resume and job description for instant AI-powered analysis and feedback'
                  : 'Login to access AI-powered resume screening and career insights'}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full max-w-7xl mx-auto">
          {/* Upload interface - always visible but disabled when not logged in */}
          <div className="responsive-grid grid grid-cols-1 md:grid-cols-2 fluid-gap">
              {/* Left Panel - Upload Section */}
              <section className="space-y-6 md:space-y-8 animate-slide-up">
                <div className="bg-card/80 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-border shadow-large relative w-full">
                  {!user && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-3xl z-10 flex items-center justify-center">
                      <div className="text-center p-6">
                        <h3 className="text-xl font-bold mb-2">Login Required</h3>
                        <p className="text-muted-foreground mb-4">Please login to upload and analyze resumes</p>
                        <Button onClick={() => navigate("/auth/login")}>
                          <LogIn className="w-4 h-4 mr-2" />
                          Login Now
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="fluid-text-xl md:fluid-text-2xl font-bold text-foreground">
                      Upload Documents
                    </h2>
                  </div>

                  <div className="space-y-6 animate-slide-up">
                    <FileUpload
                    label="Upload Your Resume"
                    onFileChange={setResumeFile}
                    resetTrigger={resetTrigger}
                    showClearButton={true}
                    className="animate-fade-in"
                  />

                  <div className="space-y-4 animate-fade-in [animation-delay:0.2s]">
                    <h3 className="text-lg font-semibold text-foreground">Job Description</h3>
                    <div className="space-y-3">
                      <FileUpload
                        label="Upload Job Description File (Optional)"
                        onFileChange={(file) => {
                          if (!file) {
                            // Clear job description state when FileUpload signals removal
                            setJobDescFile(null);
                            setJobDescText("");
                            return;
                          }
                          // Call the async handler for non-null files (ignore returned Promise)
                          void handleJobDescFileChange(file);
                        }}
                        resetTrigger={resetTrigger}
                        showClearButton={true}
                      />
                      <div className="text-center text-sm text-muted-foreground">
                        OR
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Paste Job Description Text
                        </label>
                        <textarea
                          value={jobDescText}
                          onChange={(e) => setJobDescText(e.target.value)}
                          placeholder="Paste the complete job description here including required skills, experience, education requirements, etc."
                          className="w-full h-28 sm:h-32 px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg sm:rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none fluid-text-sm"
                          disabled={isAnalyzing}
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                          {jobDescText.length} characters (minimum 50 required)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isAnalyzing || (!resumeFile && !jobDescFile && !jobDescText)}
                      className="w-full sm:flex-1 h-12 sm:h-14 fluid-text-sm sm:text-lg font-semibold border-2 hover:bg-muted/50 transition-colors touch-friendly"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={handleScreening}
                      disabled={isAnalyzing || !user || !resumeFile || (!jobDescText.trim() && !jobDescFile)}
                      className="w-full sm:flex-[2] h-12 sm:h-14 fluid-text-sm sm:text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity shadow-large disabled:opacity-50 touch-friendly"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ATS Evaluation...
                        </>
                      ) : !user ? (
                        <>
                          <LogIn className="w-5 h-5 mr-2" />
                          Login to Analyze
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5 mr-2" />
                          Start ATS Evaluation
                        </>
                      )}
                    </Button>
                  </div>
                  {isAnalyzing && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-accent animate-[pulse_1.5s_ease-in-out_infinite] w-2/3" />
                      </div>
                      <p className="text-sm text-center text-muted-foreground">
                        Professional ATS evaluation in progress...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Right Panel - Info Section */}
            <section className="space-y-4 md:space-y-6 animate-slide-up [animation-delay:0.2s]">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-primary/20 shadow-medium w-full">
                <h2 className="fluid-text-2xl font-bold text-foreground mb-4 md:mb-6">
                  How It Works
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Upload Resume & JD",
                      desc: "Upload your resume and provide job description (file or text)",
                    },
                    {
                      step: "2",
                      title: "Professional ATS Evaluation",
                      desc: "14-point analysis with industry-standard weighted scoring",
                    },
                    {
                      step: "3",
                      title: "Comprehensive Report",
                      desc: "HR-ready evaluation with hiring recommendations",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-card/50 rounded-lg sm:rounded-xl border border-border"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-success/20 shadow-medium w-full">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  ✨ What You'll Get
                </h3>
                <ul className="space-y-3">
                  {[
                    "Professional ATS score (0-100%) with status",
                    "14-point candidate profile analysis",
                    "Skills gap analysis and missing skills identification",
                    "Experience validation and seniority assessment",
                    "Education & certification verification",
                    "HR-ready professional summary and recommendations",
                    "Keywords optimization suggestions for ATS",
                    "Role fit analysis and hiring decision support",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3 fluid-text-xs sm:text-sm">
                      <div className="w-2 h-2 rounded-full bg-success flex-shrink-0 mt-1.5" />
                      <span className="text-foreground flex-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
