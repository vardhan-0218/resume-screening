import { Navigate } from "react-router-dom";
import { useHybridAuth } from "@/hooks/useHybridAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "candidate" | "hr";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, userRole, loading, isOfflineMode } = useHybridAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isOfflineMode) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === "candidate" ? "/" : "/hr/dashboard"} replace />;
  }

  return <>{children}</>;
};
