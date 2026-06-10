import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Kpi, KpiResult, ApiList, ApiItem } from '@/types/api';

export function useKpis() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: () => apiClient.get<ApiList<Kpi>>('/kpis').then((r) => r.data.data),
  });
}

interface CreateKpiPayload {
  name: string;
  description?: string;
  target_value: number;
  unit: string;
  sector_ids: string[];
}

export function useCreateKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKpiPayload) =>
      apiClient.post<ApiItem<Kpi>>('/kpis', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpis'] }),
  });
}

export function useUpdateKpi(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateKpiPayload>) =>
      apiClient.put<ApiItem<Kpi>>(`/kpis/${id}`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpis'] }),
  });
}

export function useDeleteKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/kpis/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpis'] }),
  });
}

export function useKpiResults(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['kpi-results', params],
    queryFn: () => apiClient.get<ApiList<KpiResult>>('/kpi-results', { params }).then((r) => r.data.data),
  });
}

interface UpsertKpiResultPayload {
  kpi_id: string;
  score: number;
  month: number;
  year: number;
  notes?: string;
}

export function useUpsertKpiResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertKpiResultPayload) =>
      apiClient.post<ApiItem<KpiResult>>('/kpi-results', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpi-results'] }),
  });
}
