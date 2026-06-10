import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { SmartForm, SmartFormResponse, ApiList, ApiItem } from '@/types/api';
import type { SmartFormConfig } from '@/types/smartforms';

export function useSmartForms(params?: { category?: string }) {
  return useQuery({
    queryKey: ['smart-forms', params],
    queryFn: () => apiClient.get<ApiList<SmartForm>>('/smart-forms', { params }).then((r) => r.data.data),
  });
}

export function useSmartForm(id: string) {
  return useQuery({
    queryKey: ['smart-forms', id],
    queryFn: () => apiClient.get<ApiItem<SmartForm>>(`/smart-forms/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

interface CreateSmartFormPayload {
  name: string;
  slug: string;
  category: string;
  config: SmartFormConfig;
  sector_id?: string | null;
}

export function useCreateSmartForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSmartFormPayload) =>
      apiClient.post<ApiItem<SmartForm>>('/smart-forms', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-forms'] }),
  });
}

export function useUpdateSmartForm(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateSmartFormPayload> & { status?: string; sector_id?: string | null }) =>
      apiClient.put<ApiItem<SmartForm>>(`/smart-forms/${id}`, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smart-forms'] });
      qc.invalidateQueries({ queryKey: ['smart-forms', id] });
    },
  });
}

export function useDeleteSmartForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/smart-forms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-forms'] }),
  });
}

export function useSubmitSmartFormResponse(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responses: Record<string, unknown>) =>
      apiClient.post<ApiItem<SmartFormResponse>>(`/smart-forms/${formId}/responses`, { responses }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-forms', formId, 'responses'] }),
  });
}

export function useSmartFormResponses(formId: string) {
  return useQuery({
    queryKey: ['smart-forms', formId, 'responses'],
    queryFn: () => apiClient.get<ApiList<SmartFormResponse>>(`/smart-forms/${formId}/responses`).then((r) => r.data.data),
    enabled: !!formId,
  });
}

export function useSmartFormAggregate(formId: string) {
  return useQuery({
    queryKey: ['smart-forms', formId, 'aggregate'],
    queryFn: () => apiClient.get(`/smart-forms/${formId}/aggregate`).then((r) => r.data),
    enabled: !!formId,
  });
}
