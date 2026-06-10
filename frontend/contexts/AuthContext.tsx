import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, TOKEN_KEY } from '@/lib/apiClient';
import type { AuthUser, AppRole } from '@/types/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isColaborador: boolean;
  isAnalista: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    apiClient.get<{ data: AuthUser }>('/auth/me')
      .then(({ data }) => setUser(data.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data } = await apiClient.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { error: null };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Credenciais inválidas.';
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  const hasRole = (role: AppRole) => user?.roles.includes(role) ?? false;

  const value: AuthContextType = {
    user,
    loading,
    signIn,
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
