import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  getSession,
  onAuthStateChange,
  signInWithPassword,
  getProfileActive,
  signOut as apiSignOut,
} from '@/api/auth';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((session) => {
      setSession(session);
      setLoading(false);
    });

    getSession().then((session) => {
      setSession(session);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await signInWithPassword(email, password);
    if (error) return { error: error as Error | null };

    // Check if the user's profile is active
    const profile = await getProfileActive(data.user.id);

    if (profile && !profile.is_active) {
      await apiSignOut();
      return { error: new Error('Your account has been deactivated. Please contact your administrator.') };
    }

    return { error: null };
  };

  const signOut = async () => {
    await apiSignOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
