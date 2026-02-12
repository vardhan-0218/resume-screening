import { useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { HybridAuthContext, HybridAuthContextType, AuthError } from "./HybridAuthContextTypes";

export const HybridAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<"candidate" | "hr" | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we should start in offline mode (if Supabase is not working)
    const checkSupabaseHealth = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error && (error.message.includes('406') || error.message.includes('403'))) {
          console.warn('Supabase RLS issues detected, offline mode available');
          setIsOfflineMode(true);
          setUserRole(null); // Don't set default role until user chooses
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Supabase connection issues, offline mode available');
        setIsOfflineMode(true);
        setUserRole(null); // Don't set default role until user chooses
        setLoading(false);
        return;
      }

      // If Supabase is working, set up normal auth
      setupSupabaseAuth();
    };

    const setupSupabaseAuth = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log(`Auth state changed: event=${event}, user=${!!session?.user}`);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setTimeout(() => {
              fetchUserRole(session.user.id);
            }, 0);
          } else {
            setUserRole(null);
            setLoading(false);
          }
        }
      );

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
    };

    checkSupabaseHealth();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // First try to get from user_roles table
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Database error fetching user role:", error.message);
        
        // Try to get from user metadata as fallback
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user?.user_metadata?.role) {
          console.log("Using role from user metadata:", user.user_metadata.role);
          setUserRole(user.user_metadata.role as "candidate" | "hr");
          setLoading(false);
          return;
        }
        
        // If database is completely unavailable, switch to offline mode
        setIsOfflineMode(true);
        setUserRole("candidate");
      } else if (data) {
        console.log("User role fetched from database:", data.role);
        setUserRole(data.role as "candidate" | "hr");
      } else {
        console.log("No role found in database, checking user metadata");
        
        // Try to get from user metadata
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user?.user_metadata?.role) {
          console.log("Using role from user metadata:", user.user_metadata.role);
          setUserRole(user.user_metadata.role as "candidate" | "hr");
        } else {
          console.log("No role found, defaulting to candidate");
          setUserRole("candidate");
        }
      }
    } catch (error) {
      console.warn("Error fetching user role:", error);
      // Try user metadata as final fallback before going offline
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user?.user_metadata?.role) {
          console.log("Using role from user metadata as fallback:", user.user_metadata.role);
          setUserRole(user.user_metadata.role as "candidate" | "hr");
        } else {
          setIsOfflineMode(true);
          setUserRole("candidate");
        }
      } catch (metaError) {
        setIsOfflineMode(true);
        setUserRole("candidate");
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: "candidate" | "hr") => {
    if (isOfflineMode) {
      // In offline mode, just set the role locally
      setUserRole(role);
      setIsOfflineMode(true);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: role, // Add role to user metadata
          },
        },
      });

      if (error) return { error };
      if (!data.user) return { error: { message: "Failed to create user" } };

      // Insert user role into database with better error handling and retry logic
      try {
        // First, check if user already exists in user_roles table
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (!existingRole) {
          // Insert new role if doesn't exist
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: role
            });

          if (roleError) {
            console.warn('Failed to insert user role, trying upsert:', roleError.message);
            // Try upsert as fallback
            const { error: upsertError } = await supabase
              .from('user_roles')
              .upsert({
                user_id: data.user.id,
                role: role
              }, { onConflict: 'user_id' });
            
            if (upsertError) {
              console.warn('Upsert also failed:', upsertError.message);
            } else {
              console.log('Role successfully upserted for user:', data.user.id);
            }
          } else {
            console.log('Role successfully inserted for user:', data.user.id);
          }
        } else {
          console.log('User role already exists:', existingRole.role);
        }
      } catch (roleInsertError) {
        console.warn('Error with user role operation:', roleInsertError);
        // Continue with signup success even if role insertion fails
      }

      return { error: null };
    } catch (error: unknown) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (isOfflineMode) {
      // In offline mode, just authenticate locally
      console.log("Signing in with offline mode");
      
      // Determine role based on email domain (simple heuristic)
      const role = email.toLowerCase().includes('hr') ? 'hr' : 'candidate';
      
      // Create a mock user object for offline mode
      const mockUser = {
        id: 'offline-user',
        email: email,
        user_metadata: { role: role }
      } as User;
      
      setUser(mockUser);
      setUserRole(role);
      setLoading(false);
      console.log(`Offline login successful: role=${role}`);
      return { error: null };
    }

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
    if (!isOfflineMode) {
      await supabase.auth.signOut();
    }
    setUserRole(null);
    setUser(null);
    setSession(null);
    navigate("/auth/login");
  };

  const switchToOfflineMode = (role: "candidate" | "hr") => {
    console.log(`Switching to offline mode as ${role}`);
    setIsOfflineMode(true);
    setUserRole(role);
    
    // Create mock user for offline mode
    const mockUser = {
      id: `offline-${role}`,
      email: `test-${role}@example.com`,
      user_metadata: { role: role }
    } as User;
    
    setUser(mockUser);
    setLoading(false);
    
    // Navigate to appropriate page
    if (role === 'hr') {
      navigate('/hr/dashboard', { replace: true });
    } else {
      navigate('/app', { replace: true });
    }
  };

  return (
    <HybridAuthContext.Provider value={{
      user,
      session,
      userRole,
      loading,
      isOfflineMode,
      signUp,
      signIn,
      signOut,
      switchToOfflineMode
    }}>
      {children}
    </HybridAuthContext.Provider>
  );
};

