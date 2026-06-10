import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'team' | 'personal';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showToggle: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = 'hr-compass:viewMode';

function readStoredMode(): ViewMode {
  if (typeof window === 'undefined') return 'team';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'personal' || stored === 'team' ? stored : 'team';
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin, isGestor, hasRole } = useAuth();
  const [viewMode, setViewModeState] = useState<ViewMode>(readStoredMode);

  // Show the toggle whenever the user has both a leadership role (admin or gestor)
  // AND is also a colaborador. This covers Pedro's case of admin+gestor+colaborador.
  const showToggle = (isGestor || isAdmin) && hasRole('colaborador');

  // When the toggle is hidden, force the implicit mode based on the role:
  // - admin/gestor without colaborador role -> always team
  // - pure colaborador -> always personal
  const effectiveMode: ViewMode = showToggle
    ? viewMode
    : (isAdmin || isGestor ? 'team' : 'personal');

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  };

  // If roles change and the toggle becomes hidden, drop the stored override.
  useEffect(() => {
    if (!showToggle && typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
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
