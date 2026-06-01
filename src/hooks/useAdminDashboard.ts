import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import type { Profile, KpiResult } from '@/types/database';

// ============================================================
// Types
// ============================================================

interface DashboardStats {
  activeUsers: number;
  gestores: number;
  sectors: number;
  inactiveUsers: number;
}

interface DashboardHealth {
  evalsCompleted: number;
  evalsTotal: number;
  pdisActive: number;
  tasksPending: number;
  tasksEscalated: number;
  avgKpi: number;
}

interface DashboardAlert {
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  actionUrl?: string;
  data?: unknown;
}

interface ManagerOverviewItem {
  manager: Profile;
  teamSize: number;
  pdisActive: number;
  tasksPendingApproval: number;
  evalsCompleted: number;
  evalsTotal: number;
  avgKpi: number;
}

interface AdminDashboardResult {
  stats: DashboardStats;
  health: DashboardHealth;
  alerts: DashboardAlert[];
  managerOverview: ManagerOverviewItem[];
  loading: boolean;
}

// ============================================================
// Mock data for DEMO_MODE
// ============================================================

const now = new Date().toISOString();
const currentYear = new Date().getFullYear();

const MOCK_MANAGERS: Profile[] = [
  { id: 'demo-profile', user_id: 'demo-user', email: 'demo@elmisti.com', full_name: 'Demo Admin', avatar_url: null, sector_id: 's1', manager_id: null, preferred_language: 'pt', created_at: now, updated_at: now },
  { id: 'profile-mgr2', user_id: 'user-mgr2', email: 'laura@elmisti.com', full_name: 'Laura Perez', avatar_url: null, sector_id: 's2', manager_id: null, preferred_language: 'es', created_at: now, updated_at: now },
];

const MOCK_ADMIN_DATA: Omit<AdminDashboardResult, 'loading'> = {
  stats: {
    activeUsers: 12,
    gestores: 3,
    sectors: 4,
    inactiveUsers: 2,
  },
  health: {
    evalsCompleted: 8,
    evalsTotal: 12,
    pdisActive: 7,
    tasksPending: 4,
    tasksEscalated: 1,
    avgKpi: 78.5,
  },
  alerts: [
    {
      type: 'no_manager',
      message: '2 colaboradores sem gestor atribuído',
      severity: 'high',
      actionUrl: '/admin',
    },
    {
      type: 'task_escalated',
      message: '1 tarefa PDI aguarda revisão há mais de 10 dias',
      severity: 'critical',
      actionUrl: '/pdi',
    },
    {
      type: 'eval_pending',
      message: '4 avaliações do mês atual não foram concluídas',
      severity: 'medium',
      actionUrl: '/evaluations',
    },
    {
      type: 'birthday_week',
      message: '1 aniversário esta semana',
      severity: 'low',
    },
  ],
  managerOverview: [
    {
      manager: MOCK_MANAGERS[0],
      teamSize: 5,
      pdisActive: 4,
      tasksPendingApproval: 2,
      evalsCompleted: 3,
      evalsTotal: 5,
      avgKpi: 80.2,
    },
    {
      manager: MOCK_MANAGERS[1],
      teamSize: 4,
      pdisActive: 3,
      tasksPendingApproval: 2,
      evalsCompleted: 5,
      evalsTotal: 7,
      avgKpi: 76.8,
    },
  ],
};

// ============================================================
// Fetcher function
// ============================================================

async function fetchAdminDashboard(): Promise<Omit<AdminDashboardResult, 'loading'>> {
  if (DEMO_MODE) {
    return MOCK_ADMIN_DATA;
  }

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  // --- Stats: users, gestores, sectors ---
  const [
    { count: activeCount },
    { count: inactiveCount },
    { count: sectorsCount },
    { data: gestorRoles },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('active', false),
    supabase.from('sectors').select('id', { count: 'exact', head: true }),
    supabase.from('user_roles').select('user_id').eq('role', 'gestor'),
  ]);

  const stats: DashboardStats = {
    activeUsers: activeCount ?? 0,
    inactiveUsers: inactiveCount ?? 0,
    sectors: sectorsCount ?? 0,
    gestores: gestorRoles?.length ?? 0,
  };

  // --- Health: evaluations, PDIs, tasks ---
  const [
    { count: evalsTotal },
    { count: evalsCompleted },
    { count: pdisActive },
    { count: tasksPending },
    { count: tasksEscalated },
    { data: kpiData },
  ] = await Promise.all([
    supabase
      .from('evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('month', currentMonth)
      .eq('year', currentYear),
    supabase
      .from('evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .eq('status', 'completed'),
    supabase
      .from('pdis')
      .select('id', { count: 'exact', head: true })
      .lte('start_date', today.toISOString().slice(0, 10))
      .gte('end_date', today.toISOString().slice(0, 10)),
    supabase
      .from('pdi_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase
      .from('pdi_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .lte('updated_at', tenDaysAgo),
    supabase
      .from('kpi_results')
      .select('score')
      .eq('month', currentMonth)
      .eq('year', currentYear),
  ]);

  const scores = (kpiData ?? []) as Pick<KpiResult, 'score'>[];
  const avgKpi = scores.length > 0
    ? scores.reduce((sum, r) => sum + r.score, 0) / scores.length
    : 0;

  const health: DashboardHealth = {
    evalsCompleted: evalsCompleted ?? 0,
    evalsTotal: evalsTotal ?? 0,
    pdisActive: pdisActive ?? 0,
    tasksPending: tasksPending ?? 0,
    tasksEscalated: tasksEscalated ?? 0,
    avgKpi: Math.round(avgKpi * 10) / 10,
  };

  // --- Collaborators without manager (excluding admins) ---
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  const adminUserIds = (adminRoles ?? []).map(r => r.user_id);

  const { data: noManagerProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .is('manager_id', null)
    .eq('active', true)
    .not('user_id', 'in', `(${adminUserIds.join(',')})`);

  const noManagerCount = (noManagerProfiles ?? []).length;

  // --- Weekly birthdays ---
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, birth_date')
    .not('birth_date', 'is', null)
    .eq('active', true);

  const { data: allDependents } = await supabase
    .from('dependents')
    .select('id, name, birth_date')
    .not('birth_date', 'is', null);

  const birthdayThisWeek: string[] = [];

  const checkBirthday = (name: string, birthDate: string) => {
    const [, bMonth, bDay] = birthDate.split('-').map(Number);
    for (let offset = 0; offset <= 7; offset++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + offset);
      if (checkDate.getMonth() + 1 === bMonth && checkDate.getDate() === bDay) {
        birthdayThisWeek.push(name);
        break;
      }
    }
  };

  (allProfiles ?? []).forEach(p => p.birth_date && checkBirthday(p.full_name, p.birth_date));
  (allDependents ?? []).forEach(d => d.birth_date && checkBirthday(d.name, d.birth_date));

  // --- Build alerts ---
  const alerts: DashboardAlert[] = [];

  if ((tasksEscalated ?? 0) > 0) {
    alerts.push({
      type: 'task_escalated',
      message: `${tasksEscalated} tarefa(s) PDI aguardam revisão há mais de 10 dias`,
      severity: 'critical',
      actionUrl: '/pdi',
      data: { count: tasksEscalated },
    });
  }

  if (noManagerCount > 0) {
    alerts.push({
      type: 'no_manager',
      message: `${noManagerCount} colaborador(es) sem gestor atribuído`,
      severity: 'high',
      actionUrl: '/admin',
      data: { profiles: noManagerProfiles },
    });
  }

  const evalsMissing = (evalsTotal ?? 0) - (evalsCompleted ?? 0);
  if (evalsMissing > 0) {
    alerts.push({
      type: 'eval_pending',
      message: `${evalsMissing} avaliação(ões) do mês atual não concluídas`,
      severity: 'medium',
      actionUrl: '/evaluations',
      data: { count: evalsMissing },
    });
  }

  if (birthdayThisWeek.length > 0) {
    alerts.push({
      type: 'birthday_week',
      message: `${birthdayThisWeek.length} aniversario(s) esta semana: ${birthdayThisWeek.slice(0, 3).join(', ')}`,
      severity: 'low',
      data: { names: birthdayThisWeek },
    });
  }

  // --- Manager overview ---
  const gestorUserIds = (gestorRoles ?? []).map(r => r.user_id);

  let managerOverview: ManagerOverviewItem[] = [];

  if (gestorUserIds.length > 0) {
    const { data: gestorProfiles } = await supabase
      .from('profiles')
      .select('*, sector:sectors(*)')
      .in('user_id', gestorUserIds)
      .eq('active', true);

    const managers = (gestorProfiles ?? []) as Profile[];

    managerOverview = await Promise.all(
      managers.map(async (manager) => {
        const { data: teamRows } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('manager_id', manager.id)
          .eq('active', true);

        const teamMembers = teamRows ?? [];
        const teamSize = teamMembers.length;
        const teamUserIds = teamMembers.map(m => m.user_id);
        const teamProfileIds = teamMembers.map(m => m.id);

        if (teamSize === 0) {
          return {
            manager,
            teamSize: 0,
            pdisActive: 0,
            tasksPendingApproval: 0,
            evalsCompleted: 0,
            evalsTotal: 0,
            avgKpi: 0,
          };
        }

        const [
          { count: mPdisActive },
          { count: mTasksPending },
          { count: mEvalsCompleted },
          { count: mEvalsTotal },
          { data: mKpiData },
        ] = await Promise.all([
          supabase
            .from('pdis')
            .select('id', { count: 'exact', head: true })
            .in('user_id', teamUserIds)
            .lte('start_date', today.toISOString().slice(0, 10))
            .gte('end_date', today.toISOString().slice(0, 10)),
          supabase
            .from('pdi_tasks')
            .select('pdi_id, pdi:pdis!inner(user_id)', { count: 'exact', head: true })
            .eq('status', 'submitted')
            .in('pdi.user_id', teamUserIds),
          supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .in('assigned_to', teamUserIds)
            .eq('month', currentMonth)
            .eq('year', currentYear)
            .eq('status', 'completed'),
          supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .in('assigned_to', teamUserIds)
            .eq('month', currentMonth)
            .eq('year', currentYear),
          supabase
            .from('kpi_results')
            .select('score')
            .in('user_id', teamUserIds)
            .eq('month', currentMonth)
            .eq('year', currentYear),
        ]);

        const mScores = (mKpiData ?? []) as Pick<KpiResult, 'score'>[];
        const mAvgKpi = mScores.length > 0
          ? Math.round((mScores.reduce((s, r) => s + r.score, 0) / mScores.length) * 10) / 10
          : 0;

        return {
          manager,
          teamSize,
          pdisActive: mPdisActive ?? 0,
          tasksPendingApproval: mTasksPending ?? 0,
          evalsCompleted: mEvalsCompleted ?? 0,
          evalsTotal: mEvalsTotal ?? 0,
          avgKpi: mAvgKpi,
        };
      })
    );
  }

  return { stats, health, alerts, managerOverview };
}

// ============================================================
// Hook
// ============================================================

export function useAdminDashboard(): AdminDashboardResult {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes — dashboard data doesn't need real-time freshness
  });

  return {
    stats: data?.stats ?? { activeUsers: 0, gestores: 0, sectors: 0, inactiveUsers: 0 },
    health: data?.health ?? { evalsCompleted: 0, evalsTotal: 0, pdisActive: 0, tasksPending: 0, tasksEscalated: 0, avgKpi: 0 },
    alerts: data?.alerts ?? [],
    managerOverview: data?.managerOverview ?? [],
    loading: isLoading,
  };
}
