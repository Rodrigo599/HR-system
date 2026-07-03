import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Dependent, ApiList, ApiItem } from '@/types/api';

export interface Birthday {
  name: string;
  date: string;
  days_until: number;
  type: 'colaborador' | 'dependente';
  relationship: string | null;
  of: string | null;
}

export function useDependents() {
  return useQuery({
    queryKey: ['dependents'],
    queryFn: () => apiClient.get<ApiList<Dependent>>('/dependents').then((r) => r.data.data),
  });
}

interface DependentPayload {
  profile_id?: string;
  name: string;
  birth_date: string;
  relationship: string;
}

export function useCreateDependent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DependentPayload) =>
      apiClient.post<ApiItem<Dependent>>('/dependents', payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dependents'] });
      qc.invalidateQueries({ queryKey: ['birthdays'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useDeleteDependent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/dependents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dependents'] });
      qc.invalidateQueries({ queryKey: ['birthdays'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useBirthdays() {
  return useQuery({
    queryKey: ['birthdays'],
    queryFn: () => apiClient.get<{ data: Birthday[] }>('/birthdays').then((r) => r.data.data),
  });
}
