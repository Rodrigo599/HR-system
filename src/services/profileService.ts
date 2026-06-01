import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import type { Profile } from '@/types/database';

const mockProfiles: Profile[] = [
  { id: 'demo-profile', user_id: 'demo-user', email: 'demo@elmisti.com', full_name: 'Demo User', avatar_url: null, sector_id: 's1', manager_id: null, preferred_language: 'es', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'profile-2', user_id: 'user-2', email: 'ana@elmisti.com', full_name: 'Ana Gomez', avatar_url: null, sector_id: 's2', manager_id: 'demo-profile', preferred_language: 'es', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'profile-3', user_id: 'user-3', email: 'carlos@elmisti.com', full_name: 'Carlos Ruiz', avatar_url: null, sector_id: 's3', manager_id: 'demo-profile', preferred_language: 'pt', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function fetchProfiles(): Promise<Profile[]> {
  if (DEMO_MODE) return mockProfiles;
  const { data, error } = await supabase
    .from('profiles')
    .select('*, sector:sectors(*)')
    .order('full_name');
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchCollaborators(): Promise<
  { user_id: string; full_name: string; sector_id: string | null }[]
> {
  if (DEMO_MODE) {
    return [
      { user_id: 'user-2', full_name: 'Ana Garcia', sector_id: 's2' },
      { user_id: 'user-3', full_name: 'Carlos Rodriguez', sector_id: 's3' },
      { user_id: 'user-4', full_name: 'Maria Lopez', sector_id: null },
    ];
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, sector_id');
  if (error) throw error;
  return (data ?? []).map((p) => ({
    user_id: p.user_id as string,
    full_name: p.full_name as string,
    sector_id: (p.sector_id as string | null) ?? null,
  }));
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });
}

export function useCollaborators(enabled: boolean) {
  return useQuery({
    queryKey: ['collaborators'],
    queryFn: fetchCollaborators,
    enabled,
  });
}

/**
 * Returns the user_ids of the direct reports of the given manager profile.
 * Empty list when the profile has no team or when DEMO_MODE.
 */
export async function fetchDirectReportUserIds(managerProfileId: string): Promise<string[]> {
  if (DEMO_MODE) {
    // In demo mode, the demo profile is the manager of two fixtures.
    return mockProfiles
      .filter((p) => p.manager_id === managerProfileId)
      .map((p) => p.user_id);
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('manager_id', managerProfileId);
  if (error) throw error;
  return (data ?? []).map((r) => r.user_id as string).filter(Boolean);
}

export function useDirectReportUserIds(managerProfileId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['direct-reports', managerProfileId],
    queryFn: () => fetchDirectReportUserIds(managerProfileId!),
    enabled: enabled && !!managerProfileId,
    staleTime: 60 * 1000,
  });
}
