import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import { mockDependents } from '@/lib/mockData';
import type { Dependent } from '@/types/database';

export async function fetchDependents(): Promise<Dependent[]> {
  if (DEMO_MODE) return mockDependents;
  const { data, error } = await supabase.from('dependents').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Dependent[];
}

interface CreateDependentParams {
  profile_id: string;
  name: string;
  birth_date: string;
  relationship: string;
  consent: boolean;
}

export async function createDependent(params: CreateDependentParams): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('dependents').insert(params);
  if (error) throw error;
}

interface UpdateDependentParams {
  id: string;
  name: string;
  birth_date: string;
  relationship: string;
  consent: boolean;
}

export async function updateDependent({ id, ...params }: UpdateDependentParams): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('dependents').update(params).eq('id', id);
  if (error) throw error;
}

export async function deleteDependent(id: string): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from('dependents').delete().eq('id', id);
  if (error) throw error;
}

export function useDependents() {
  return useQuery({
    queryKey: ['dependents'],
    queryFn: fetchDependents,
  });
}

export function useCreateDependent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDependent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
    },
  });
}

export function useUpdateDependent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDependent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
    },
  });
}

export function useDeleteDependent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDependent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependents'] });
    },
  });
}
