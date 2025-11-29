import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useHybridAuth } from "@/hooks/useHybridAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, User, Users, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const { signIn, userRole, isOfflineMode, switchToOfflineMode, user } = useHybridAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in (only if we have a real user, not just offline mode flag)
  useEffect(() => {
    if (user && userRole && !loading && !hasRedirected) {
      console.log(`Login redirect: user=${!!user}, userRole=${userRole}, loading=${loading}`);
      setHasRedirected(true);
      
      // Only redirect if we have both user and userRole set (indicating a complete auth state)
      if (userRole === "hr") {
        console.log("Redirecting HR user to dashboard");
        navigate("/hr/dashboard", { replace: true });
      } else if (userRole === "candidate") {
        console.log("Redirecting candidate to app");
        navigate("/app", { replace: true });
      }
    }
  }, [user, userRole, loading, navigate, hasRedirected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
    } catch (error: unknown) {
      toast.error(error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      setLoading(false);
      toast.error(error.message || "Failed to login");
      return;
    }

    toast.success("Login successful!");
    
    // Let the useEffect handle navigation after auth state updates
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-elegant">
          <div className="flex justify-start mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/")}
              className="gap-2 hover:bg-primary/10 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              {isOfflineMode ? "Offline Mode - Testing Environment" : "Login to your account"}
            </p>
            {isOfflineMode && (
              <Badge variant="secondary" className="mt-2">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Offline Mode Active
              </Badge>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Offline Mode Testing */}
          {isOfflineMode && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 mb-2">Offline Mode - Quick Testing</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => switchToOfflineMode('candidate')}
                  className="text-xs"
                >
                  <User className="w-3 h-3 mr-1" />
                  Test as Candidate
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => switchToOfflineMode('hr')}
                  className="text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Test as HR
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/auth/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
