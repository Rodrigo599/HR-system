import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/types/database';
import { DEMO_MODE } from '@/lib/demoMode';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isColaborador: boolean;
  isAnalista: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for DEMO_MODE
const DEMO_PROFILE: Profile = {
  id: 'demo-profile',
  user_id: 'demo-user',
  email: 'demo@elmisti.com',
  full_name: 'Demo Admin',
  avatar_url: null,
  sector_id: null,
  manager_id: null,
  preferred_language: 'pt',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      // In demo mode, set a fake profile with all roles
      setProfile(DEMO_PROFILE);
      setRoles(['admin', 'gestor', 'colaborador']);
      setUser({ id: 'demo-user', email: 'demo@elmisti.com' } as User);
      setLoading(false);
      return;
    }

    // setTimeout(...,0) preserva o padrao do Supabase pra evitar deadlocks com
    // chamadas reentrantes dentro do callback do onAuthStateChange. So sinalizamos
    // loading=false depois que profile+roles resolvem — senao ProtectedRoute redireciona
    // /admin pra /dashboard quando hasRole('admin') ainda e false.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setLoading(true);
          setTimeout(async () => {
            await Promise.all([
              loadProfile(session.user.id),
              loadRoles(session.user.id),
            ]);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          loadProfile(session.user.id),
          loadRoles(session.user.id),
        ]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*, sector:sectors(*)')
      .eq('user_id', userId)
      .single();

    if (data) {
      // Check if user is deactivated
      if (data.active === false) {
        await supabase.auth.signOut();
        setProfile(null);
        setRoles([]);
        return;
      }
      setProfile(data as Profile);
    }
  };

  const loadRoles = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (data) {
      setRoles(data.map((r) => r.role));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const value: AuthContextType = {
    user,
    session,
    profile,
    roles,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin: hasRole('admin'),
    isGestor: hasRole('gestor'),
    isColaborador: hasRole('colaborador'),
    isAnalista: hasRole('analista'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
