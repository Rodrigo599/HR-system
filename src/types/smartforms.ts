// SmartForms types - ported from El Misti analytics-dashboard
// Extended with HR-specific field types

export type I18nText = string | { pt?: string; en?: string; es?: string };

export type SmartFormFieldType =
  // Original types (from analytics SmartForms)
  | 'text'
  | 'number'
  | 'email'
  | 'tel'
  | 'date-range'
  | 'checkbox-grid'
  // HR-specific types
  | 'scale'        // Slider 1-10 (replaces old evaluation topics)
  | 'radio'        // Single choice
  | 'textarea'     // Long text (feedback, comments)
  | 'yes-no'       // Boolean toggle
  | 'rating'       // Star rating 1-5
  | 'date';        // Single date picker

export interface SmartFormField {
  type: SmartFormFieldType;
  name?: string;
  names?: string[];              // For date-range: ['checkin', 'checkout']
  label?: I18nText;
  labels?: Record<string, string[]>; // For date-range per language
  required?: boolean;
  min?: number;                  // For number, scale
  max?: number;                  // For number, scale
  value?: number;                // Default value
  autocomplete?: string;
  placeholder?: I18nText;
  options?: Array<{
    value: string;
    label: I18nText;
  }>;                            // For checkbox-grid, radio
  stars?: number;                // For rating: max stars (default 5)
}

export interface SmartFormStep {
  title: I18nText;
  subtitle?: I18nText;
  fields: SmartFormField[];
}

export interface SmartFormConfig {
  steps: SmartFormStep[];
  cta?: I18nText;
  submit: I18nText;
  sending?: I18nText;
  next?: I18nText;
  back?: I18nText;
  errors?: Record<string, I18nText>;
}

export interface SmartForm {
  id: string;
  name: string;
  slug: string;
  config: SmartFormConfig;
  status: 'active' | 'draft' | 'archived';
  category: 'evaluation' | 'onboarding' | 'survey' | 'feedback' | 'custom';
  sector_id?: string | null;
  created_at: string;
  updated_at: string;
}

/** @deprecated smartform_submissions foi dropada. Usar SmartFormResponse. */
export interface SmartFormSubmission {
  id: string;
  form_id: string;
  form_slug: string;
  user_id: string;
  assigned_to?: string;
  assigned_by?: string;
  responses: Record<string, unknown>;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/** Resposta persistida em smart_form_responses (novo schema unificado). */
export interface SmartFormResponse {
  id: string;
  form_id: string;
  user_id: string;
  data: Record<string, unknown>;
  submitted_at: string;
  // Campos de avaliação (opcionais — presentes quando vinculado a uma evaluation)
  phase?: 'self' | 'manager';
  evaluation_id?: string;
  assigned_to?: string;
  assigned_by?: string;
}
