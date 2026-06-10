import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { OneOnOne, ApiList, ApiItem } from '@/types/api';

export function useOneOnOnes() {
  return useQuery({
    queryKey: ['one-on-ones'],
    queryFn: () => apiClient.get<ApiList<OneOnOne>>('/one-on-ones').then((r) => r.data.data),
  });
}

export function useOneOnOne(id: string) {
  return useQuery({
    queryKey: ['one-on-ones', id],
    queryFn: () => apiClient.get<ApiItem<OneOnOne>>(`/one-on-ones/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

interface CreateOneOnOnePayload {
  collaborator_id: string;
  scheduled_at: string;
}

export function useCreateOneOnOne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOneOnOnePayload) =>
      apiClient.post<ApiItem<OneOnOne>>('/one-on-ones', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['one-on-ones'] }),
  });
}

interface UpdateOneOnOnePayload {
  scheduled_at?: string;
  status?: string;
  notes?: string;
}

export function useUpdateOneOnOne(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOneOnOnePayload) =>
      apiClient.put<ApiItem<OneOnOne>>(`/one-on-ones/${id}`, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['one-on-ones'] });
      qc.invalidateQueries({ queryKey: ['one-on-ones', id] });
    },
  });
}

export function useAddTopic(oneOnOneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/one-on-ones/${oneOnOneId}/topics`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['one-on-ones', oneOnOneId] }),
  });
}
