import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { VIEW_MODE_KEY } from '@/lib/apiClient';

type ViewMode = 'team' | 'personal';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showToggle: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

function readStoredMode(): ViewMode {
  if (typeof window === 'undefined') return 'team';
  const stored = window.localStorage.getItem(VIEW_MODE_KEY);
  return stored === 'personal' || stored === 'team' ? stored : 'team';
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin, isGestor, hasRole } = useAuth();
  const qc = useQueryClient();
  const [viewMode, setViewModeState] = useState<ViewMode>(readStoredMode);

  const showToggle = (isGestor || isAdmin) && hasRole('colaborador');

  const effectiveMode: ViewMode = showToggle
    ? viewMode
    : (isAdmin || isGestor ? 'team' : 'personal');

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_MODE_KEY, mode);
    }
    qc.invalidateQueries();
  };

  // If roles change and the toggle becomes hidden, drop the stored override.
  useEffect(() => {
    if (!showToggle && typeof window !== 'undefined') {
      window.localStorage.removeItem(VIEW_MODE_KEY);
    }
  }, [showToggle]);

  return (
    <ViewModeContext.Provider value={{ viewMode: effectiveMode, setViewMode, showToggle }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) throw new Error('useViewMode must be used within ViewModeProvider');
  return context;
}
