import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { PointwiseFeedback, ApiList, ApiItem } from '@/types/api';

export function useFeedbackReceived() {
  return useQuery({
    queryKey: ['feedback', 'received'],
    queryFn: () => apiClient.get<ApiList<PointwiseFeedback>>('/feedback/received').then((r) => r.data.data),
  });
}

export function useFeedbackSent() {
  return useQuery({
    queryKey: ['feedback', 'sent'],
    queryFn: () => apiClient.get<ApiList<PointwiseFeedback>>('/feedback/sent').then((r) => r.data.data),
  });
}

export function useFeedbackTeam() {
  return useQuery({
    queryKey: ['feedback', 'team'],
    queryFn: () => apiClient.get<ApiList<PointwiseFeedback>>('/feedback/team').then((r) => r.data.data),
  });
}

interface CreateFeedbackPayload {
  to_user_id: string;
  type: 'kudos' | 'adjustment' | 'observation';
  content: string;
  visibility?: 'private' | 'with_manager';
}

export function useCreateFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) =>
      apiClient.post<ApiItem<PointwiseFeedback>>('/feedback', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feedback'] }),
  });
}

export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/feedback/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feedback'] }),
  });
}
