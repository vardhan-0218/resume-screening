import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useHybridAuth } from "@/hooks/useHybridAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { z } from "zod";
import { UserCircle, Briefcase, ArrowLeft } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["candidate", "hr"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "hr">("candidate");
  const [loading, setLoading] = useState(false);
  const { signUp } = useHybridAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      signupSchema.parse({ fullName, email, password, confirmPassword, role });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Validation error");
      }
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to create account");
      return;
    }

    console.log("Signup successful with role:", role);
    toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully! Please check your email to confirm.`);
    navigate("/auth/login");
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
              Create Account
            </h1>
            <p className="text-muted-foreground">Join our AI Resume Screening System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Account Type</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "candidate" | "hr")}>
                <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all ${
                  role === "candidate" 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-border hover:bg-accent/50"
                }`}>
                  <RadioGroupItem value="candidate" id="candidate" />
                  <Label htmlFor="candidate" className="flex items-center gap-3 cursor-pointer flex-1">
                    <UserCircle className={`w-6 h-6 ${role === "candidate" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="font-medium">Job Candidate</div>
                      <div className="text-xs text-muted-foreground">Upload resume and get AI-powered feedback</div>
                    </div>
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all ${
                  role === "hr" 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-border hover:bg-accent/50"
                }`}>
                  <RadioGroupItem value="hr" id="hr" />
                  <Label htmlFor="hr" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Briefcase className={`w-6 h-6 ${role === "hr" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="font-medium">HR Manager / Recruiter</div>
                      <div className="text-xs text-muted-foreground">Screen multiple resumes and rank candidates</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">
                  {role === "candidate" ? "Job Candidate Account" : "HR Manager Account"}
                </span>
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
