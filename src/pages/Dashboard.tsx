import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { GestorDashboard } from '@/components/dashboard/GestorDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ColaboradorDashboard } from '@/components/dashboard/ColaboradorDashboard';

export default function Dashboard() {
  const { isAdmin, isGestor } = useAuth();
  const { viewMode } = useViewMode();

  // Toggle "Visao Colaborador" tem prioridade — vale ate pra admin/gestor que querem
  // ver o dashboard como o time ve.
  if (viewMode === 'personal') return <ColaboradorDashboard />;

  // Admin sempre ve dashboard admin (em modo team)
  if (isAdmin) return <AdminDashboard />;

  // Gestor em modo team
  if (isGestor) return <GestorDashboard />;

  // Pure colaborador
  return <ColaboradorDashboard />;
}
