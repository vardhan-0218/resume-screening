import { Button } from "@/components/ui/button";
import { Brain, Sparkles, CheckCircle, ArrowRight, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Professional ATS Evaluation",
      description: "Industry-standard ATS scoring system used by HR departments with 14-point candidate analysis and weighted scoring"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Real-Time Processing",
      description: "Get comprehensive ATS scores, professional summaries, and hiring recommendations within seconds"
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Detailed HR Insights",
      description: "Complete breakdown including skill gaps, experience matching, education verification, and improvement suggestions"
    }
  ];

  const benefits = [
    "Professional ATS scoring (0-100%) with weighted criteria",
    "14-point candidate profile extraction and analysis", 
    "Skills matching with synonym recognition and gap analysis",
    "Experience validation and seniority level assessment",
    "Education and certification verification",
    "Missing skills identification and keyword suggestions",
    "Role fit analysis and hiring recommendations",
    "Professional HR-style summary generation"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow [animation-delay:1s]" />
      </div>

      <div className="relative z-10">
        {/* Header/Navigation */}
        <header className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">AI Resume Scout</h1>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate("/auth/login")}>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button onClick={() => navigate("/auth/signup")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 bg-gradient-accent rounded-full text-accent-foreground shadow-medium">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-semibold">Powered by Advanced AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              AI Resume Screening System
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform your hiring process with intelligent resume analysis. 
              Get instant compatibility scores, detailed skill matching, and AI-powered insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 bg-gradient-primary hover:opacity-90 transition-opacity shadow-large"
                onClick={() => navigate("/app")}
              >
                <Brain className="w-5 h-5 mr-2" />
                Start ATS Evaluation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => navigate("/auth/login")}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login to Account
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose AI Resume Scout?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of resume screening technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card/80 backdrop-blur-lg rounded-3xl p-8 border border-border shadow-large hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-6 text-primary-foreground">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-3xl p-12 border border-success/20 shadow-large">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-foreground mb-8 text-center">
                What You'll Get
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Ready to Transform Your Hiring Process?
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Join thousands of HR professionals and candidates who trust AI Resume Scout
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 bg-gradient-primary hover:opacity-90 transition-opacity shadow-large"
                onClick={() => navigate("/app")}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Try It Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-border">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 AI Resume Scout. Powered by advanced AI technology.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}