import { createContext } from "react";
import { User, Session } from "@supabase/supabase-js";

export interface AuthError {
  message: string;
  status?: number;
}

export interface HybridAuthContextType {
  user: User | null;
  session: Session | null;
  userRole: "candidate" | "hr" | null;
  loading: boolean;
  isOfflineMode: boolean;
  signUp: (email: string, password: string, fullName: string, role: "candidate" | "hr") => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  switchToOfflineMode: (role: "candidate" | "hr") => void;
}

export const HybridAuthContext = createContext<HybridAuthContextType | undefined>(undefined);