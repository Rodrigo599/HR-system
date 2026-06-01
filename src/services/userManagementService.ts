import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import type { AppRole } from '@/types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
  sectorId: string | null;
  managerId: string | null;
  role: AppRole;
  preferredLanguage: 'pt' | 'es';
}

export async function createUser(params: CreateUserParams): Promise<{ userId: string }> {
  if (DEMO_MODE) return { userId: 'demo-new-user' };

  // Use non-persisting client so admin stays logged in
  const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await tempClient.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { full_name: params.fullName } },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Failed to create user');

  const userId = data.user.id;

  // Wait for the DB trigger to create the profile row
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      sector_id: params.sectorId,
      manager_id: params.managerId,
      preferred_language: params.preferredLanguage,
    })
    .eq('user_id', userId);

  if (profileError) console.error('Profile update error:', profileError);

  // Trigger already creates 'colaborador' role — upsert only if a different role is needed
  if (params.role !== 'colaborador') {
    await supabase.from('user_roles').upsert({
      user_id: userId,
      role: params.role,
    });
  }

  return { userId };
}

export async function deactivateUser(userId: string): Promise<void> {
  if (DEMO_MODE) return;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profiles) throw new Error('Profile not found');

  await supabase.from('profiles').update({ active: false }).eq('id', profiles.id);
}

export async function reactivateUser(userId: string): Promise<void> {
  if (DEMO_MODE) return;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profiles) throw new Error('Profile not found');

  await supabase.from('profiles').update({ active: true }).eq('id', profiles.id);
}

// Fetch all profiles with their roles for the admin user list
export async function fetchProfilesWithRoles(): Promise<
  Array<{
    profile: any;
    roles: AppRole[];
    teamSize: number;
  }>
> {
  if (DEMO_MODE) {
    return [
      {
        profile: {
          id: 'p1',
          user_id: 'u1',
          full_name: 'Admin Demo',
          email: 'admin@elmisti.com',
          sector_id: null,
          manager_id: null,
          active: true,
          preferred_language: 'pt',
          created_at: '',
          updated_at: '',
        },
        roles: ['admin'],
        teamSize: 0,
      },
      {
        profile: {
          id: 'p2',
          user_id: 'u2',
          full_name: 'Gestor Demo',
          email: 'gestor@elmisti.com',
          sector_id: 's1',
          manager_id: null,
          active: true,
          preferred_language: 'pt',
          created_at: '',
          updated_at: '',
        },
        roles: ['gestor'],
        teamSize: 3,
      },
      {
        profile: {
          id: 'p3',
          user_id: 'u3',
          full_name: 'Colab Demo',
          email: 'colab@elmisti.com',
          sector_id: 's1',
          manager_id: 'p2',
          active: true,
          preferred_language: 'pt',
          created_at: '',
          updated_at: '',
        },
        roles: ['colaborador'],
        teamSize: 0,
      },
    ];
  }

  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from('profiles').select('*, sector:sectors(*)').order('full_name'),
    supabase.from('user_roles').select('*'),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const profiles = profilesRes.data ?? [];
  const allRoles = rolesRes.data ?? [];

  return profiles.map(profile => ({
    profile,
    roles: allRoles
      .filter(r => r.user_id === profile.user_id)
      .map(r => r.role) as AppRole[],
    teamSize: profiles.filter(p => p.manager_id === profile.id).length,
  }));
}
