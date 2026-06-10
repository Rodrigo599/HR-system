import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Sector, ApiList, ApiItem } from '@/types/api';

export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: () => apiClient.get<ApiList<Sector>>('/sectors').then((r) => r.data.data),
  });
}

interface CreateSectorPayload {
  name: string;
  description?: string;
}

export function useCreateSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSectorPayload) =>
      apiClient.post<ApiItem<Sector>>('/sectors', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }),
  });
}

export function useUpdateSector(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateSectorPayload>) =>
      apiClient.put<ApiItem<Sector>>(`/sectors/${id}`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }),
  });
}

export function useDeleteSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/sectors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }),
  });
}
