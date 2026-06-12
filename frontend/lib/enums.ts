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

// Funções de label i18n — recebem t() do LanguageContext
type TFn = (key: string) => string;

export const getEvaluationStatusLabels = (t: TFn): Record<EvaluationStatus, string> => ({
  pending_self: t('evalStatusPendingSelf'),
  pending_manager: t('evalStatusPendingManager'),
  completed: t('evalStatusCompleted'),
  closed: t('evalStatusClosed'),
});

export const getEvaluationTypeLabels = (t: TFn): Record<EvaluationType, string> => ({
  cultural: t('evalTypeCultural'),
  performance: t('evalTypePerformance'),
  kpi: t('evalTypeKpi'),
});

export const getPdiTaskStatusLabels = (t: TFn): Record<PdiTaskStatus, string> => ({
  pending: t('pdiTaskPending'),
  submitted: t('pdiTaskSubmitted'),
  approved: t('pdiTaskApproved'),
  rejected: t('pdiTaskRejected'),
});

export const getPdiStatusLabels = (t: TFn): Record<PdiStatus, string> => ({
  active: t('pdiStatusActive'),
  completed: t('pdiStatusCompleted'),
  cancelled: t('pdiStatusCancelled'),
});

export const getOneOnOneStatusLabels = (t: TFn): Record<OneOnOneStatus, string> => ({
  scheduled: t('oneOnOneStatusScheduled'),
  completed: t('oneOnOneStatusCompleted'),
  cancelled: t('oneOnOneStatusCancelled'),
});

export const getFeedbackTypeLabels = (t: TFn): Record<PointwiseFeedbackType, string> => ({
  kudos: t('feedbackTypeKudos'),
  adjustment: t('feedbackTypeAdjustment'),
  observation: t('feedbackTypeObservation'),
});

export const getFeedbackVisibilityLabels = (t: TFn): Record<FeedbackVisibility, string> => ({
  private: t('feedbackVisibilityPrivateLabel'),
  with_manager: t('feedbackVisibilityWithManagerLabel'),
});

export const getSmartFormStatusLabels = (t: TFn): Record<SmartFormStatus, string> => ({
  draft: t('smartFormDraft'),
  active: t('smartFormActive'),
  archived: t('smartFormArchived'),
});

export const getSmartFormCategoryLabels = (t: TFn): Record<SmartFormCategory, string> => ({
  evaluation: t('smartFormCatEvaluation'),
  onboarding: t('smartFormCatOnboarding'),
  survey: t('smartFormCatSurvey'),
  feedback: t('smartFormCatFeedback'),
  custom: t('smartFormCatCustom'),
});

export const getContentTypeLabels = (t: TFn): Record<string, string> => ({
  video: t('contentTypeVideo'),
  article: t('contentTypeArticle'),
  document: t('contentTypeDocument'),
  course: t('contentTypeCourse'),
  training: t('contentTypeTraining'),
  reading: t('contentTypeReading'),
  process: t('contentTypeProcess'),
});

export const getAppRoleLabels = (t: TFn): Record<AppRole, string> => ({
  admin: t('adminRole'),
  gestor: t('gestorRole'),
  colaborador: t('colaboradorRole'),
  analista: t('analistaRole'),
});

// Aliases estáticos mantidos para retrocompatibilidade (PT-BR fixo)
export const EVALUATION_STATUS_LABELS = getEvaluationStatusLabels((k) => k);
export const PDI_TASK_STATUS_LABELS = getPdiTaskStatusLabels((k) => k);
export const PDI_STATUS_LABELS = getPdiStatusLabels((k) => k);
export const ONE_ON_ONE_STATUS_LABELS = getOneOnOneStatusLabels((k) => k);
export const SMART_FORM_STATUS_LABELS = getSmartFormStatusLabels((k) => k);
export const SMART_FORM_CATEGORY_LABELS = getSmartFormCategoryLabels((k) => k);
export const FEEDBACK_TYPE_LABELS = getFeedbackTypeLabels((k) => k);
export const FEEDBACK_VISIBILITY_LABELS = getFeedbackVisibilityLabels((k) => k);
export const EVALUATION_TYPE_LABELS = getEvaluationTypeLabels((k) => k);
export const APP_ROLE_LABELS = getAppRoleLabels((k) => k);
