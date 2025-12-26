import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  province: string | null;
  city: string | null;
  phone: string | null;
  onboarding_complete: boolean;
  is_admin: boolean; // Deprecated: kept for backwards compat, use roles
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isOnboardingRequired: boolean;
  signUp: (email: string, password: string, fullName?: string, termsAccepted?: boolean) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // Fetch profile and roles in parallel
    const [profileResult, rolesResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    if (profileResult.error) {
      console.error("Error fetching profile:", profileResult.error);
      return null;
    }

    const roles = rolesResult.data?.map((r) => r.role) || [];
    const isAdmin = roles.includes("admin");

    return {
      ...profileResult.data,
      roles,
      is_admin: isAdmin, // Backwards compatibility
    } as Profile;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Fetch profile after auth state change (deferred to avoid deadlock)
        if (session?.user) {
          setProfileLoading(true);
          setTimeout(() => {
            fetchProfile(session.user.id).then((p) => {
              setProfile(p);
              setProfileLoading(false);
            });
          }, 0);
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setProfileLoading(true);
        fetchProfile(session.user.id).then((p) => {
          setProfile(p);
          setProfileLoading(false);
        });
      } else {
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, termsAccepted?: boolean) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || "",
        },
      },
    });

    // If signup successful and terms accepted, update the profile with timestamp
    if (!error && data.user && termsAccepted) {
      // Deferred to avoid auth state listener deadlock
      setTimeout(async () => {
        await supabase
          .from("profiles")
          .update({ terms_accepted_at: new Date().toISOString() })
          .eq("id", data.user!.id);
      }, 100);
    }
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/app/dashboard`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const isOnboardingRequired = Boolean(user && profile && !profile.onboarding_complete);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        isOnboardingRequired,
        signUp,
        signIn,
        signInWithMagicLink,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
