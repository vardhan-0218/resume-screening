import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AuthContext, AuthContextType, AuthError } from "./AuthContextTypes";



export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<"candidate" | "hr" | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Try to fetch user role with better error handling
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() to avoid errors when no rows found

      if (error) {
        console.warn("Database error fetching user role:", error.message);
        // For now, default to 'candidate' role to allow app to function
        setUserRole("candidate");
      } else if (data) {
        setUserRole(data.role as "candidate" | "hr");
      } else {
        // No role found, default to candidate
        console.info("No role found for user, defaulting to candidate");
        setUserRole("candidate");
        
        // Try to insert a default role
        try {
          await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "candidate" });
        } catch (insertError) {
          console.warn("Could not insert default role:", insertError);
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      // Fallback to candidate role to keep app functional
      setUserRole("candidate");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: "candidate" | "hr") => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) return { error };
      if (!data.user) return { error: { message: "Failed to create user" } };

      // Try to insert user role with better error handling
      try {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role });

        if (roleError) {
          console.warn("Could not insert user role immediately:", roleError.message);
          // Don't fail the signup process, role can be set later
        }
      } catch (roleError) {
        console.warn("Error inserting user role:", roleError);
        // Continue with signup success even if role insertion fails
      }

      return { error: null };
    } catch (error: unknown) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error: unknown) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    navigate("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};


