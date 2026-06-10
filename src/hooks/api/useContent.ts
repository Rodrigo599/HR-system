import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { ContentItem, ContentAssignment, ApiList, ApiItem } from '@/types/api';

export function useContentItems() {
  return useQuery({
    queryKey: ['content'],
    queryFn: () => apiClient.get<ApiList<ContentItem>>('/content').then((r) => r.data.data),
  });
}

export function useContentProgress(itemId: string) {
  return useQuery({
    queryKey: ['content', itemId, 'progress'],
    queryFn: () => apiClient.get(`/content/${itemId}/progress`).then((r) => r.data),
    enabled: !!itemId,
  });
}

interface UpdateProgressPayload {
  status: string;
  progress_pct?: number;
}

export function useUpdateContentProgress(assignmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProgressPayload) =>
      apiClient.patch<ApiItem<ContentAssignment>>(`/content/assignments/${assignmentId}/progress`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content'] }),
  });
}
