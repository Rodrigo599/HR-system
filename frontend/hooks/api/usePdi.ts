import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Pdi, PdiTask, ApiList, ApiItem } from '@/types/api';

export function usePdis() {
  return useQuery({
    queryKey: ['pdis'],
    queryFn: () => apiClient.get<ApiList<Pdi>>('/pdis').then((r) => r.data.data),
  });
}

interface CreatePdiPayload {
  title: string;
  description?: string;
  due_date?: string;
}

export function useCreatePdi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePdiPayload) =>
      apiClient.post<ApiItem<Pdi>>('/pdis', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pdis'] }),
  });
}

interface CreatePdiTaskPayload {
  title: string;
  description?: string;
  due_date?: string;
}

export function useCreatePdiTask(pdiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePdiTaskPayload) =>
      apiClient.post<ApiItem<PdiTask>>(`/pdis/${pdiId}/tasks`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pdis'] }),
  });
}

export function useSubmitPdiTask(pdiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiClient.post<ApiItem<PdiTask>>(`/pdis/${pdiId}/tasks/${taskId}/submit`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pdis'] }),
  });
}

interface ReviewTaskPayload {
  review_notes: string;
  status: 'approved' | 'rejected';
}

export function useReviewPdiTask(pdiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...payload }: ReviewTaskPayload & { taskId: string }) =>
      apiClient.post<ApiItem<PdiTask>>(`/pdis/${pdiId}/tasks/${taskId}/review`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pdis'] }),
  });
}
