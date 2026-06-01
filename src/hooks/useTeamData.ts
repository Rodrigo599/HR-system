import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, Pdi, PdiTask, Evaluation, KpiResult } from '@/types/database';
import { mockPdis, mockPdiTasks, mockEvaluations, mockKpiResults } from '@/lib/mockData';

// ============================================================
// Types
// ============================================================

interface TeamDataResult {
  teamMembers: Profile[];
  teamPdis: Pdi[];
  teamPdiTasks: PdiTask[];
  teamEvaluations: Evaluation[];
  teamKpiResults: KpiResult[];
  pendingTaskReviews: number;
  pendingEvaluations: number;
  loading: boolean;
}

// ============================================================
// Mock data for DEMO_MODE
// ============================================================

const now = new Date().toISOString();
const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

const MOCK_TEAM_MEMBERS: Profile[] = [
  {
    id: 'profile-2',
    user_id: 'user-2',
    email: 'ana@elmisti.com',
    full_name: 'Ana Gomez',
    avatar_url: null,
    sector_id: 's1',
    manager_id: 'demo-profile',
    preferred_language: 'es',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'profile-3',
    user_id: 'user-3',
    email: 'carlos@elmisti.com',
    full_name: 'Carlos Ruiz',
    avatar_url: null,
    sector_id: 's2',
    manager_id: 'demo-profile',
    preferred_language: 'pt',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'profile-4',
    user_id: 'user-4',
    email: 'lucia@elmisti.com',
    full_name: 'Lucia Fernandez',
    avatar_url: null,
    sector_id: 's3',
    manager_id: 'demo-profile',
    preferred_language: 'es',
    created_at: now,
    updated_at: now,
  },
];

const MOCK_TEAM_PDIS: Pdi[] = [
  {
    id: 'team-p1',
    user_id: 'user-2',
    title: 'PDI Ana - Atendimento ao Hóspede',
    description: 'Melhorar habilidades de atendimento',
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-06-30`,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'team-p2',
    user_id: 'user-3',
    title: 'PDI Carlos - Gestao Operacional',
    description: 'Desenvolvimento de lideranca operacional',
    start_date: `${currentYear}-02-01`,
    end_date: `${currentYear}-12-31`,
    created_at: now,
    updated_at: now,
  },
];

const MOCK_TEAM_PDI_TASKS: PdiTask[] = [
  { id: 'tpt1', pdi_id: 'team-p1', title: 'Curso de servico ao cliente', description: null, link: null, completed: false, due_date: `${currentYear}-04-30`, status: 'submitted', reviewer_id: null, review_comment: null, reviewed_at: null, created_at: now, updated_at: now },
  { id: 'tpt2', pdi_id: 'team-p1', title: 'Pratica de idiomas', description: null, link: null, completed: true, due_date: `${currentYear}-03-31`, status: 'approved', reviewer_id: 'demo-profile', review_comment: null, reviewed_at: now, created_at: now, updated_at: now },
  { id: 'tpt3', pdi_id: 'team-p2', title: 'Workshop de lideranca', description: null, link: null, completed: false, due_date: `${currentYear}-05-15`, status: 'pending', reviewer_id: null, review_comment: null, reviewed_at: null, created_at: now, updated_at: now },
];

const MOCK_TEAM_EVALUATIONS: Evaluation[] = [
  { id: 'te1', created_by: 'demo-profile', assigned_to: 'user-2', status: 'pending_self', type: 'cultural', month: currentMonth, year: currentYear, created_at: now, updated_at: now },
  { id: 'te2', created_by: 'demo-profile', assigned_to: 'user-3', status: 'pending_manager', type: 'performance', month: currentMonth, year: currentYear, created_at: now, updated_at: now },
  { id: 'te3', created_by: 'demo-profile', assigned_to: 'user-4', status: 'completed', type: 'cultural', month: currentMonth, year: currentYear, created_at: now, updated_at: now },
];

const MOCK_TEAM_KPI_RESULTS: KpiResult[] = mockKpiResults.slice(0, 10).map((r, i) => ({
  ...r,
  id: `tkr${i + 1}`,
  user_id: i % 2 === 0 ? 'user-2' : 'user-3',
}));

// ============================================================
// Fetcher function
// ============================================================

async function fetchTeamData(managerId: string): Promise<Omit<TeamDataResult, 'loading'>> {
  if (DEMO_MODE) {
    const pendingTaskReviews = MOCK_TEAM_PDI_TASKS.filter(t => t.status === 'submitted').length;
    const pendingEvaluations = MOCK_TEAM_EVALUATIONS.filter(e => e.status === 'pending_manager').length;
    return {
      teamMembers: MOCK_TEAM_MEMBERS,
      teamPdis: MOCK_TEAM_PDIS,
      teamPdiTasks: MOCK_TEAM_PDI_TASKS,
      teamEvaluations: MOCK_TEAM_EVALUATIONS,
      teamKpiResults: MOCK_TEAM_KPI_RESULTS,
      pendingTaskReviews,
      pendingEvaluations,
    };
  }

  // Fetch team members (profiles where manager_id = current user's profile.id)
  const { data: teamMembersData, error: membersError } = await supabase
    .from('profiles')
    .select('*, sector:sectors(*)')
    .eq('manager_id', managerId);
  if (membersError) throw membersError;
  const teamMembers = (teamMembersData ?? []) as Profile[];

  const memberIds = teamMembers.map(m => m.user_id);

  if (memberIds.length === 0) {
    return {
      teamMembers: [],
      teamPdis: [],
      teamPdiTasks: [],
      teamEvaluations: [],
      teamKpiResults: [],
      pendingTaskReviews: 0,
      pendingEvaluations: 0,
    };
  }

  // Fetch team PDIs
  const { data: pdisData, error: pdisError } = await supabase
    .from('pdis')
    .select('*')
    .in('user_id', memberIds)
    .order('created_at', { ascending: false });
  if (pdisError) throw pdisError;
  const teamPdis = (pdisData ?? []) as Pdi[];

  const pdiIds = teamPdis.map(p => p.id);

  // Fetch PDI tasks for team PDIs
  let teamPdiTasks: PdiTask[] = [];
  if (pdiIds.length > 0) {
    const { data: tasksData, error: tasksError } = await supabase
      .from('pdi_tasks')
      .select('*')
      .in('pdi_id', pdiIds);
    if (tasksError) throw tasksError;
    teamPdiTasks = (tasksData ?? []) as PdiTask[];
  }

  // Fetch team evaluations for current month
  const now = new Date();
  const { data: evalsData, error: evalsError } = await supabase
    .from('evaluations')
    .select('*')
    .in('assigned_to', memberIds)
    .eq('month', now.getMonth() + 1)
    .eq('year', now.getFullYear());
  if (evalsError) throw evalsError;
  const teamEvaluations = (evalsData ?? []) as Evaluation[];

  // Fetch team KPI results for current month
  const { data: kpiData, error: kpiError } = await supabase
    .from('kpi_results')
    .select('*')
    .in('user_id', memberIds)
    .eq('month', now.getMonth() + 1)
    .eq('year', now.getFullYear());
  if (kpiError) throw kpiError;
  const teamKpiResults = (kpiData ?? []) as KpiResult[];

  // Derived counts
  const pendingTaskReviews = teamPdiTasks.filter(t => t.status === 'submitted').length;
  const pendingEvaluations = teamEvaluations.filter(e => e.status === 'pending_manager').length;

  return {
    teamMembers,
    teamPdis,
    teamPdiTasks,
    teamEvaluations,
    teamKpiResults,
    pendingTaskReviews,
    pendingEvaluations,
  };
}

// ============================================================
// Hook
// ============================================================

export function useTeamData(): TeamDataResult {
  const { profile } = useAuth();
  const managerId = profile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['team-data', managerId],
    queryFn: () => fetchTeamData(managerId!),
    enabled: !!managerId,
  });

  return {
    teamMembers: data?.teamMembers ?? [],
    teamPdis: data?.teamPdis ?? [],
    teamPdiTasks: data?.teamPdiTasks ?? [],
    teamEvaluations: data?.teamEvaluations ?? [],
    teamKpiResults: data?.teamKpiResults ?? [],
    pendingTaskReviews: data?.pendingTaskReviews ?? 0,
    pendingEvaluations: data?.pendingEvaluations ?? 0,
    loading: isLoading,
  };
}
