import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HybridAuthProvider } from "@/contexts/HybridAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Results from "./pages/Results";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import HRDashboard from "./pages/hr/Dashboard";
import NotFound from "./pages/NotFound";
import ResponsiveVerification from "@/components/ResponsiveVerification";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (like 406/403)
        if (typeof error === 'object' && error !== null && 'status' in error) {
          const statusError = error as { status: number };
          if (statusError.status >= 400 && statusError.status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <HybridAuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/app" element={<Index />} />
              <Route path="/results" element={<Results />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route
                path="/hr/dashboard"
                element={
                  <ProtectedRoute requiredRole="hr">
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/test/responsive" element={<ResponsiveVerification />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HybridAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
