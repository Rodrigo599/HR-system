// Types alinhados com os Resources do Laravel backend
import type { SmartFormConfig } from '@/types/smartforms';

export type AppRole = 'admin' | 'gestor' | 'colaborador' | 'analista';

export interface Sector {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  sector_id: string | null;
  manager_id: string | null;
  sector?: Sector;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: AppRole[];
  profile: Profile | null;
}

export interface Evaluation {
  id: string;
  type: string;
  status: string;
  flow_type: string;
  month: number;
  year: number;
  smart_form_id: string | null;
  created_at: string;
  assignee?: { id: string; name: string; profile?: { full_name: string; avatar_url: string | null } | null };
  creator?: { id: string; name: string };
  responses?: Array<{ id: string; self_score: number | null; manager_score: number | null; final_score: number | null }>;
}

export interface Kpi {
  id: string;
  name: string;
  description: string | null;
  target_value: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface KpiResult {
  id: string;
  kpi_id: string;
  user_id: string;
  score: string;
  month: number;
  year: number;
  notes: string | null;
  kpi?: Kpi;
}

export interface Pdi {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  end_date: string | null;
  created_at: string;
  tasks?: PdiTask[];
}

export interface PdiTask {
  id: string;
  pdi_id: string;
  title: string;
  description: string | null;
  link: string | null;
  completed: boolean;
  due_date: string | null;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
}

export interface OneOnOne {
  id: string;
  manager_id: string;
  report_id: string;
  scheduled_at: string;
  status: string | null;
  notes: string | null;
  manager?: { id: string; name: string };
  report?: { id: string; name: string };
  topics?: OneOnOneTopic[];
}

export interface OneOnOneTopic {
  id: string;
  one_on_one_id: string;
  author_user_id: string;
  content: string;
  addressed: boolean;
}

export interface PointwiseFeedback {
  id: string;
  from_user_id: string | null;
  to_user_id: string;
  type: string;
  content: string;
  visibility: string;
  created_at: string;
}

export interface SmartForm {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  sector_id: string | null;
  config: SmartFormConfig;
  created_at: string;
  updated_at: string;
}

export interface SmartFormResponse {
  id: string;
  smart_form_id: string;
  user_id: string;
  responses: Record<string, unknown>;
  status: string;
  submitted_at: string | null;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface ContentAssignment {
  id: string;
  content_item_id: string;
  user_id: string;
  status: string;
  progress_pct: number;
  assigned_at: string;
  content_item?: ContentItem;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: AppRole[];
  profile: Profile | null;
}

// Wrapper padrão das respostas paginadas/listadas do Laravel
export interface ApiList<T> {
  data: T[];
}

export interface ApiItem<T> {
  data: T;
}
