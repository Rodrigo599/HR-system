import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { PointwiseFeedback, ApiList, ApiItem } from '@/types/api';

export function useFeedback() {
  return useQuery({
    queryKey: ['feedback'],
    queryFn: () => apiClient.get<ApiList<PointwiseFeedback>>('/feedback').then((r) => r.data.data),
  });
}

interface CreateFeedbackPayload {
  to_user_id: string;
  content: string;
  is_anonymous?: boolean;
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
