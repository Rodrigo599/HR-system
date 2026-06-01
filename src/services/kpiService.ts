import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import { mockKpis, mockKpiResults } from '@/lib/mockData';
import type { Kpi, KpiResult } from '@/types/database';

export interface KpiScope {
  isAdmin: boolean;
  // sectorId is the user's own sector. KPIs without sector_id are treated as global.
  sectorId: string | null | undefined;
  // userIds is the set of users whose results are visible.
  // Empty array means "no restriction" — only valid for admin in team mode.
  userIds: string[];
}

export type KpiWithSectors = Kpi & { sector_ids: string[] };

export async function fetchKpis(scope: KpiScope): Promise<KpiWithSectors[]> {
  if (DEMO_MODE) return mockKpis.map(k => ({ ...k, sector_ids: [] }));
  const { data, error } = await supabase
    .from('kpis')
    .select('*, kpi_sectors(sector_id)')
    .order('name');
  if (error) throw error;

  const kpis: KpiWithSectors[] = (data ?? []).map((k: any) => ({
    ...k,
    sector_ids: (k.kpi_sectors ?? []).map((ks: any) => ks.sector_id as string),
  }));

  if (scope.isAdmin) return kpis;

  return kpis.filter(k => {
    if (k.sector_ids.length === 0) return true; // universal
    if (!scope.sectorId) return false;
    return k.sector_ids.includes(scope.sectorId);
  });
}

export async function fetchKpiResults(scope: KpiScope): Promise<KpiResult[]> {
  if (DEMO_MODE) return mockKpiResults;
  let query = supabase.from('kpi_results').select('*');
  const ids = scope.userIds.filter(Boolean);
  if (ids.length > 0) {
    // Always honor userIds when present — admin in personal mode must
    // also be filtered to own results, not see everyone.
    query = query.in('user_id', ids);
  } else if (!scope.isAdmin) {
    // Non-admin with empty userIds = nothing to show.
    return [];
  }
  // Empty userIds + isAdmin = team mode for admin: no filter, see all.
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as KpiResult[];
}

interface UpsertKpiResultParams {
  kpiId: string;
  userId: string;
  score: number;
  month: number;
  year: number;
  existingId?: string;
}

export async function upsertKpiResult({ kpiId, userId, score, month, year, existingId }: UpsertKpiResultParams): Promise<void> {
  if (DEMO_MODE) return;
  if (existingId) {
    const { error } = await supabase.from('kpi_results').update({ score }).eq('id', existingId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('kpi_results').insert({
      kpi_id: kpiId,
      user_id: userId,
      score,
      month,
      year,
    });
    if (error) throw error;
  }
}

export function useKpis(scope: KpiScope | null) {
  return useQuery<KpiWithSectors[]>({
    queryKey: ['kpis', scope?.isAdmin, scope?.sectorId ?? null],
    queryFn: () => fetchKpis(scope!),
    enabled: !!scope,
  });
}

export function useKpiResults(scope: KpiScope | null) {
  return useQuery({
    queryKey: ['kpi-results', scope?.isAdmin, scope?.userIds.join(',')],
    queryFn: () => fetchKpiResults(scope!),
    enabled: !!scope,
  });
}

/**
 * Builds the KpiScope for the currently logged-in user.
 *
 * - admin: sees all KPIs and all results.
 * - gestor (in team mode): sees own + direct reports' results, and KPIs of own sector.
 * - colaborador / personal mode: sees own results only.
 */
export function useKpiScope(params: {
  profile: { id: string; user_id: string; sector_id: string | null } | null;
  isAdmin: boolean;
  isGestor: boolean;
  includeTeam: boolean;
}): KpiScope | null {
  const { profile, isAdmin, isGestor, includeTeam } = params;

  const teamQuery = useQuery({
    queryKey: ['kpi-scope-team', profile?.id, includeTeam],
    queryFn: async (): Promise<string[]> => {
      if (!profile) return [];
      if (DEMO_MODE) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('manager_id', profile.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.user_id as string).filter(Boolean);
    },
    enabled: !!profile && includeTeam && isGestor && !isAdmin,
    staleTime: 60 * 1000,
  });

  if (!profile) return null;

  const ownUserId = profile.user_id;
  const reportIds = teamQuery.data ?? [];
  // userIds=[] is the "see all" sentinel and only applies to admin in team mode.
  // In personal mode (includeTeam=false), even admin is scoped to own results
  // so the viewMode toggle does not get bypassed.
  const userIds = isAdmin && includeTeam
    ? []
    : isGestor && includeTeam
      ? [ownUserId, ...reportIds]
      : [ownUserId];

  return {
    isAdmin,
    sectorId: profile.sector_id,
    userIds,
  };
}

export function useUpsertKpiResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertKpiResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-results'] });
    },
  });
}
