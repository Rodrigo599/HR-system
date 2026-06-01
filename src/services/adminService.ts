import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import { mockSectors, mockTopics, mockKpis } from '@/lib/mockData';
import type { Sector, EvaluationTopic, Kpi, EvaluationType, Pdi } from '@/types/database';

// ============================================================
// Sectors
// ============================================================

export async function fetchSectors(): Promise<Sector[]> {
  if (DEMO_MODE) return mockSectors;
  const { data, error } = await supabase.from('sectors').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Sector[];
}

interface SaveSectorParams {
  id?: string;
  name: string;
  description: string | null;
}

export async function saveSector({ id, name, description }: SaveSectorParams): Promise<void> {
  if (DEMO_MODE) return;
  if (id) {
    const { error } = await supabase.from('sectors').update({ name, description }).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('sectors').insert({ name, description });
    if (error) throw error;
  }
}

export async function deleteSector(id: string): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('sectors').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Evaluation Topics
// ============================================================

export async function fetchAdminTopics(): Promise<EvaluationTopic[]> {
  if (DEMO_MODE) return mockTopics;
  const { data, error } = await supabase.from('evaluation_topics').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as EvaluationTopic[];
}

interface SaveTopicParams {
  id?: string;
  name: string;
  description: string | null;
  type: EvaluationType;
  sector_id: string | null;
}

export async function saveTopic({ id, ...params }: SaveTopicParams): Promise<void> {
  if (DEMO_MODE) return;
  if (id) {
    const { error } = await supabase.from('evaluation_topics').update(params).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('evaluation_topics').insert(params);
    if (error) throw error;
  }
}

export async function deleteTopic(id: string): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('evaluation_topics').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// KPIs (Admin CRUD)
// ============================================================

export type AdminKpi = Kpi & { sector_ids: string[] };

export async function fetchAdminKpis(): Promise<AdminKpi[]> {
  if (DEMO_MODE) return mockKpis.map(k => ({ ...k, sector_ids: [] }));
  const { data, error } = await supabase
    .from('kpis')
    .select('*, kpi_sectors(sector_id)')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((k: any) => ({
    ...k,
    sector_ids: (k.kpi_sectors ?? []).map((ks: any) => ks.sector_id as string),
  }));
}

interface SaveKpiParams {
  id?: string;
  name: string;
  description: string | null;
  target_value: number;
  unit: string | null;
  sector_ids: string[];
}

export async function saveKpi({ id, sector_ids, ...params }: SaveKpiParams): Promise<void> {
  if (DEMO_MODE) return;
  let kpiId = id;
  if (id) {
    const { error } = await supabase.from('kpis').update({
      name: params.name,
      description: params.description,
      target_value: params.target_value,
      unit: params.unit,
    }).eq('id', id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from('kpis').insert({
      name: params.name,
      description: params.description,
      target_value: params.target_value,
      unit: params.unit,
    }).select('id').single();
    if (error) throw error;
    kpiId = data.id;
  }
  // Sync kpi_sectors: delete all then re-insert
  await supabase.from('kpi_sectors').delete().eq('kpi_id', kpiId!);
  if (sector_ids.length > 0) {
    const { error } = await supabase.from('kpi_sectors').insert(
      sector_ids.map(sector_id => ({ kpi_id: kpiId!, sector_id }))
    );
    if (error) throw error;
  }
}

export async function deleteKpi(id: string): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('kpis').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Hooks
// ============================================================

export function useSectors() {
  return useQuery({ queryKey: ['sectors'], queryFn: fetchSectors });
}

export function useAdminTopics() {
  return useQuery({ queryKey: ['admin-topics'], queryFn: fetchAdminTopics });
}

export function useAdminKpis() {
  return useQuery({ queryKey: ['admin-kpis'], queryFn: fetchAdminKpis });
}

export function useSaveSector() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: saveSector, onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }) });
}

export function useDeleteSector() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteSector, onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }) });
}

export function useSaveTopic() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: saveTopic, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-topics'] }) });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteTopic, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-topics'] }) });
}

export function useSaveKpi() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: saveKpi, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-kpis'] }) });
}

export function useDeleteKpi() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteKpi, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-kpis'] }) });
}

// ============================================================
// PDIs (Admin CRUD)
// ============================================================

export async function fetchAllPdis(): Promise<Pdi[]> {
  if (DEMO_MODE) return [];
  const { data, error } = await supabase.from('pdis').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pdi[];
}

interface SaveAdminPdiParams {
  id?: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
}

export async function saveAdminPdi({ id, ...params }: SaveAdminPdiParams): Promise<void> {
  if (DEMO_MODE) return;
  if (id) {
    const { title, description, start_date, end_date } = params;
    const { error } = await supabase.from('pdis').update({ title, description, start_date, end_date }).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('pdis').insert(params);
    if (error) throw error;
  }
}

export async function deleteAdminPdi(id: string): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('pdis').delete().eq('id', id);
  if (error) throw error;
}

export function useAllPdis() {
  return useQuery({ queryKey: ['admin-pdis'], queryFn: fetchAllPdis });
}

export function useSaveAdminPdi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveAdminPdi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pdis'] }),
  });
}

export function useDeleteAdminPdi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminPdi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pdis'] }),
  });
}
