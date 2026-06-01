import type { Database } from '@/integrations/supabase/types';

// ============================================================
// Enum types (derived from Supabase-generated types)
// ============================================================

export type AppRole = Database['public']['Enums']['app_role'];
export type EvaluationStatus = Database['public']['Enums']['evaluation_status'];
export type EvaluationType = Database['public']['Enums']['evaluation_type'];
export type PdiTaskStatus = Database['public']['Enums']['pdi_task_status'];

// ============================================================
// Row types (base Supabase rows)
// ============================================================

type Tables = Database['public']['Tables'];

export type SectorRow = Tables['sectors']['Row'];
export type ProfileRow = Tables['profiles']['Row'];
export type UserRoleRow = Tables['user_roles']['Row'];
export type EvaluationTopicRow = Tables['evaluation_topics']['Row'];
export type EvaluationRow = Tables['evaluations']['Row'];
export type EvaluationResponseRow = Tables['evaluation_responses']['Row'];
export type KpiRow = Tables['kpis']['Row'];
export type KpiResultRow = Tables['kpi_results']['Row'];
export type PdiRow = Tables['pdis']['Row'];
export type PdiTaskRow = Tables['pdi_tasks']['Row'];
export type DependentRow = Tables['dependents']['Row'];

// ============================================================
// Extended types (with joined relations for UI use)
// ============================================================

export interface Sector extends SectorRow {}

export interface Profile extends ProfileRow {
  sector?: Sector;
  manager?: Profile;
  roles?: AppRole[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export interface UserRole extends UserRoleRow {}

export interface EvaluationTopic extends EvaluationTopicRow {}

export interface Evaluation extends EvaluationRow {
  creator?: Profile;
  assignee?: Profile;
  form_id?: string;  // NOVO: referencia ao SmartForm template (nao existe em EvaluationRow)
}

export interface EvaluationResponse extends EvaluationResponseRow {
  topic?: EvaluationTopic;
  evaluation?: Evaluation;
}

export interface Kpi extends KpiRow {}

export interface KpiResult extends KpiResultRow {
  kpi?: Kpi;
}

export interface Pdi extends PdiRow {
  tasks?: PdiTask[];
}

export interface PdiTask extends PdiTaskRow {}

export interface Dependent extends DependentRow {}
