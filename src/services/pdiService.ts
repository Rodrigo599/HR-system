import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import { mockPdis, mockPdiTasks } from '@/lib/mockData';
import type { Pdi, PdiTask, PdiTaskStatus } from '@/types/database';

export async function fetchUserPdis(userId: string): Promise<Pdi[]> {
  if (DEMO_MODE) {
    return mockPdis.map(p => ({ ...p, user_id: userId }));
  }
  const { data, error } = await supabase.from('pdis').select('*').eq('user_id', userId);
  if (error) throw error;
  // Bug #7 fix: NEVER fall back to mock data (with fake IDs like "p1") in real mode.
  // Returning an empty array is correct — the user simply has no PDIs yet.
  return (data ?? []) as Pdi[];
}

export async function fetchTeamPdis(managerProfileId: string): Promise<Pdi[]> {
  if (DEMO_MODE) {
    return [
      { ...mockPdis[0], id: 'team-p1', user_id: 'user-ana', title: 'PDI Ana - Atendimento ao Hóspede' },
      { ...mockPdis[0], id: 'team-p2', user_id: 'user-carlos', title: 'PDI Carlos - Gestao Operacional' },
    ];
  }
  // Direct reports: profiles whose manager_id == managerProfileId.
  const { data: reports, error: errReports } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('manager_id', managerProfileId);
  if (errReports) throw errReports;
  const reportUserIds = (reports ?? []).map((r) => r.user_id).filter(Boolean) as string[];
  if (reportUserIds.length === 0) return [];

  const { data, error } = await supabase
    .from('pdis')
    .select('*')
    .in('user_id', reportUserIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pdi[];
}

export async function fetchPdiTasks(pdiId: string): Promise<PdiTask[]> {
  if (DEMO_MODE) {
    return mockPdiTasks.filter(mt => mt.pdi_id === pdiId);
  }
  const { data, error } = await supabase.from('pdi_tasks').select('*').eq('pdi_id', pdiId).order('due_date');
  if (error) throw error;
  return (data ?? []) as PdiTask[];
}

export async function fetchAllPdiTasks(userId: string): Promise<PdiTask[]> {
  if (DEMO_MODE) return mockPdiTasks;
  // Tasks belonging to PDIs owned by the current user.
  const { data: ownPdis, error: errPdis } = await supabase
    .from('pdis')
    .select('id')
    .eq('user_id', userId);
  if (errPdis) throw errPdis;
  const pdiIds = (ownPdis ?? []).map((p) => p.id);
  if (pdiIds.length === 0) return [];

  const { data, error } = await supabase
    .from('pdi_tasks')
    .select('*')
    .in('pdi_id', pdiIds);
  if (error) throw error;
  return (data ?? []) as PdiTask[];
}

export interface TeamPdiTask extends PdiTask {
  user_id: string;
  user_name: string | null;
}

export async function fetchTeamPdiTasks(managerProfileId: string): Promise<TeamPdiTask[]> {
  if (DEMO_MODE) {
    return mockPdiTasks.map((t) => ({ ...t, user_id: 'demo-user', user_name: 'Demo User' }));
  }
  const { data: reports, error: errReports } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .eq('manager_id', managerProfileId);
  if (errReports) throw errReports;
  const reportRows = reports ?? [];
  if (reportRows.length === 0) return [];

  const nameByUserId = new Map<string, string | null>(
    reportRows.map((r) => [r.user_id as string, (r.full_name as string | null) ?? null])
  );

  const { data: pdis, error: errPdis } = await supabase
    .from('pdis')
    .select('id, user_id')
    .in('user_id', Array.from(nameByUserId.keys()));
  if (errPdis) throw errPdis;
  const pdiOwners = new Map<string, string>();
  (pdis ?? []).forEach((p) => pdiOwners.set(p.id as string, p.user_id as string));
  const pdiIds = Array.from(pdiOwners.keys());
  if (pdiIds.length === 0) return [];

  const { data, error } = await supabase
    .from('pdi_tasks')
    .select('*')
    .in('pdi_id', pdiIds);
  if (error) throw error;

  return ((data ?? []) as PdiTask[]).map((task) => {
    const ownerUserId = pdiOwners.get(task.pdi_id) ?? '';
    return {
      ...task,
      user_id: ownerUserId,
      user_name: nameByUserId.get(ownerUserId) ?? null,
    };
  });
}

interface CreatePdiParams {
  user_id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
}

export async function createPdi(params: CreatePdiParams): Promise<Pdi | null> {
  if (DEMO_MODE) return null;
  const { data, error } = await supabase.from('pdis').insert(params).select().single();
  if (error) throw error;
  return data as Pdi;
}

interface CreatePdiTaskParams {
  pdi_id: string;
  title: string;
  description: string | null;
  link: string | null;
  due_date: string | null;
}

export async function createPdiTask(params: CreatePdiTaskParams): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('pdi_tasks').insert({
    ...params,
    completed: false,
    status: 'pending' as PdiTaskStatus,
    reviewer_id: null,
    review_comment: null,
    reviewed_at: null,
  });
  if (error) throw error;
}

export async function toggleTaskCompleted(taskId: string, completed: boolean): Promise<void> {
  const { error } = await supabase.from('pdi_tasks').update({ completed: !completed }).eq('id', taskId);
  if (error) throw error;
}

export async function submitTaskForReview(taskId: string): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('pdi_tasks').update({
    status: 'submitted' as PdiTaskStatus,
  }).eq('id', taskId);
  if (error) throw error;
}

interface ReviewTaskParams {
  taskId: string;
  mode: 'approve' | 'reject';
  reviewerId: string;
  comment: string;
}

export async function reviewTask({ taskId, mode, reviewerId, comment }: ReviewTaskParams): Promise<void> {
  if (DEMO_MODE) return;
  const now = new Date().toISOString();
  const { error } = await supabase.from('pdi_tasks').update({
    status: (mode === 'approve' ? 'approved' : 'rejected') as PdiTaskStatus,
    reviewer_id: reviewerId,
    review_comment: comment || null,
    reviewed_at: now,
    ...(mode === 'approve' ? { completed: true } : {}),
  }).eq('id', taskId);
  if (error) throw error;
}

export function useUserPdis(userId: string | undefined) {
  return useQuery({
    queryKey: ['pdis', userId],
    queryFn: () => fetchUserPdis(userId!),
    enabled: !!userId,
  });
}

export function useTeamPdis(managerProfileId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['pdis', 'team', managerProfileId],
    queryFn: () => fetchTeamPdis(managerProfileId!),
    enabled: enabled && !!managerProfileId,
  });
}

export function usePdiTasks(pdiId: string | undefined) {
  return useQuery({
    queryKey: ['pdi-tasks', pdiId],
    queryFn: () => fetchPdiTasks(pdiId!),
    enabled: !!pdiId,
  });
}

export function useAllPdiTasks(userId: string | undefined) {
  return useQuery({
    queryKey: ['pdi-tasks', 'own', userId],
    queryFn: () => fetchAllPdiTasks(userId!),
    enabled: !!userId,
  });
}

export function useTeamPdiTasks(managerProfileId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['pdi-tasks', 'team', managerProfileId],
    queryFn: () => fetchTeamPdiTasks(managerProfileId!),
    enabled: enabled && !!managerProfileId,
  });
}

export function useCreatePdi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPdi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdis'] });
    },
  });
}

export function useCreatePdiTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPdiTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdi-tasks'] });
    },
  });
}
