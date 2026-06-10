import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { User, Profile, ApiList, ApiItem } from '@/types/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get<ApiList<User>>('/users').then((r) => r.data.data),
  });
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  roles: string[];
  sector_id?: string;
  manager_id?: string;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      apiClient.post<ApiItem<User>>('/users', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get<ApiItem<Profile>>('/profile').then((r) => r.data.data),
  });
}

interface UpdateProfilePayload {
  full_name?: string;
  avatar_url?: string;
  preferred_language?: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiClient.put<ApiItem<Profile>>('/profile', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useTeam() {
  return useQuery({
    queryKey: ['profile', 'team'],
    queryFn: () => apiClient.get<ApiList<Profile>>('/profile/team').then((r) => r.data.data),
  });
}
