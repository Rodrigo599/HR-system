// Enumerações centralizadas — fonte única de verdade para valores fixos do domínio.
// O backend (Laravel) usa as mesmas strings; ao mudar aqui, mudar também nas migrations/models PHP.

// Papéis de usuário
export const APP_ROLES = ['admin', 'gestor', 'colaborador', 'analista'] as const;
export type AppRole = typeof APP_ROLES[number];

// Status de avaliação
export const EVALUATION_STATUS = [
  'pending_self',
  'pending_manager',
  'completed',
  'closed',
] as const;
export type EvaluationStatus = typeof EVALUATION_STATUS[number];

// Tipos de avaliação
export const EVALUATION_TYPES = ['cultural', 'performance', 'kpi'] as const;
export type EvaluationType = typeof EVALUATION_TYPES[number];

// Tipos de fluxo de avaliação
export const EVALUATION_FLOW_TYPES = ['sequential', 'blind'] as const;
export type EvaluationFlowType = typeof EVALUATION_FLOW_TYPES[number];

// Status de tarefa PDI
export const PDI_TASK_STATUS = ['pending', 'submitted', 'approved', 'rejected'] as const;
export type PdiTaskStatus = typeof PDI_TASK_STATUS[number];

// Status de PDI
export const PDI_STATUS = ['active', 'completed', 'cancelled'] as const;
export type PdiStatus = typeof PDI_STATUS[number];

// Status de reunião 1:1
export const ONE_ON_ONE_STATUS = ['scheduled', 'completed', 'cancelled'] as const;
export type OneOnOneStatus = typeof ONE_ON_ONE_STATUS[number];

// Tipo de feedback pontual
export const FEEDBACK_TYPES = ['kudos', 'adjustment', 'observation'] as const;
export type PointwiseFeedbackType = typeof FEEDBACK_TYPES[number];

// Visibilidade de feedback
export const FEEDBACK_VISIBILITY = ['private', 'with_manager'] as const;
export type FeedbackVisibility = typeof FEEDBACK_VISIBILITY[number];

// Status de formulário inteligente
export const SMART_FORM_STATUS = ['draft', 'active', 'archived'] as const;
export type SmartFormStatus = typeof SMART_FORM_STATUS[number];

// Categorias de formulário inteligente
export const SMART_FORM_CATEGORIES = [
  'evaluation',
  'onboarding',
  'survey',
  'feedback',
  'custom',
] as const;
export type SmartFormCategory = typeof SMART_FORM_CATEGORIES[number];

// Status de resposta de formulário
export const SMART_FORM_RESPONSE_STATUS = ['draft', 'submitted'] as const;
export type SmartFormResponseStatus = typeof SMART_FORM_RESPONSE_STATUS[number];

// Tipo de item de conteúdo
export const CONTENT_TYPES = ['video', 'article', 'document', 'course'] as const;
export type ContentType = typeof CONTENT_TYPES[number];

// Status de atribuição de conteúdo
export const CONTENT_ASSIGNMENT_STATUS = ['assigned', 'in_progress', 'completed'] as const;
export type ContentAssignmentStatus = typeof CONTENT_ASSIGNMENT_STATUS[number];

// Labels pt-BR para uso em UI
export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  pending_self: 'Aguardando autoavaliação',
  pending_manager: 'Aguardando gestor',
  completed: 'Concluída',
  closed: 'Encerrada',
};

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  cultural: 'Cultural',
  performance: 'Performance',
  kpi: 'KPI',
};

export const PDI_TASK_STATUS_LABELS: Record<PdiTaskStatus, string> = {
  pending: 'Pendente',
  submitted: 'Enviada',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

export const PDI_STATUS_LABELS: Record<PdiStatus, string> = {
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const ONE_ON_ONE_STATUS_LABELS: Record<OneOnOneStatus, string> = {
  scheduled: 'Agendado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
};

export const FEEDBACK_TYPE_LABELS: Record<PointwiseFeedbackType, string> = {
  kudos: 'Reconhecimento',
  adjustment: 'Ajuste',
  observation: 'Observação',
};

export const FEEDBACK_VISIBILITY_LABELS: Record<FeedbackVisibility, string> = {
  private: 'Apenas eu e o destinatário',
  with_manager: 'Eu + gestor do destinatário',
};

export const SMART_FORM_STATUS_LABELS: Record<SmartFormStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};

export const SMART_FORM_CATEGORY_LABELS: Record<SmartFormCategory, string> = {
  evaluation: 'Avaliação',
  onboarding: 'Onboarding',
  survey: 'Pesquisa',
  feedback: 'Feedback',
  custom: 'Personalizado',
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: 'Vídeo',
  article: 'Artigo',
  document: 'Documento',
  course: 'Curso',
};

export const CONTENT_ASSIGNMENT_STATUS_LABELS: Record<ContentAssignmentStatus, string> = {
  assigned: 'Atribuído',
  in_progress: 'Em andamento',
  completed: 'Concluído',
};

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
  analista: 'Analista',
};
