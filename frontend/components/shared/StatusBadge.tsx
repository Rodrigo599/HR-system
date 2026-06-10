import { Badge } from '@/components/ui/badge';
import {
  EVALUATION_STATUS_LABELS,
  PDI_TASK_STATUS_LABELS,
  PDI_STATUS_LABELS,
  ONE_ON_ONE_STATUS_LABELS,
  SMART_FORM_STATUS_LABELS,
  CONTENT_ASSIGNMENT_STATUS_LABELS,
  type EvaluationStatus,
  type PdiTaskStatus,
  type PdiStatus,
  type OneOnOneStatus,
  type SmartFormStatus,
  type ContentAssignmentStatus,
} from '@/lib/enums';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

// Mapa de status → variant + label por domínio
const DOMAIN_MAP: Record<string, Record<string, { variant: BadgeVariant; label: string; className?: string }>> = {
  evaluation: {
    pending_self:    { variant: 'outline',   label: EVALUATION_STATUS_LABELS.pending_self },
    pending_manager: { variant: 'secondary', label: EVALUATION_STATUS_LABELS.pending_manager },
    completed:       { variant: 'default',   label: EVALUATION_STATUS_LABELS.completed },
    closed:          { variant: 'destructive', label: EVALUATION_STATUS_LABELS.closed },
  } satisfies Record<EvaluationStatus, { variant: BadgeVariant; label: string }>,

  pdi_task: {
    pending:   { variant: 'outline',     label: PDI_TASK_STATUS_LABELS.pending },
    submitted: { variant: 'secondary',   label: PDI_TASK_STATUS_LABELS.submitted },
    approved:  { variant: 'default',     label: PDI_TASK_STATUS_LABELS.approved },
    rejected:  { variant: 'destructive', label: PDI_TASK_STATUS_LABELS.rejected },
  } satisfies Record<PdiTaskStatus, { variant: BadgeVariant; label: string }>,

  pdi: {
    active:    { variant: 'default',     label: PDI_STATUS_LABELS.active },
    completed: { variant: 'secondary',   label: PDI_STATUS_LABELS.completed },
    cancelled: { variant: 'destructive', label: PDI_STATUS_LABELS.cancelled },
  } satisfies Record<PdiStatus, { variant: BadgeVariant; label: string }>,

  one_on_one: {
    scheduled: { variant: 'outline',     label: ONE_ON_ONE_STATUS_LABELS.scheduled },
    completed: { variant: 'default',     label: ONE_ON_ONE_STATUS_LABELS.completed },
    cancelled: { variant: 'destructive', label: ONE_ON_ONE_STATUS_LABELS.cancelled },
  } satisfies Record<OneOnOneStatus, { variant: BadgeVariant; label: string }>,

  smart_form: {
    draft:    { variant: 'secondary', label: SMART_FORM_STATUS_LABELS.draft },
    active:   { variant: 'default',   label: SMART_FORM_STATUS_LABELS.active, className: 'bg-green-600 text-white hover:bg-green-700' },
    archived: { variant: 'outline',   label: SMART_FORM_STATUS_LABELS.archived },
  } satisfies Record<SmartFormStatus, { variant: BadgeVariant; label: string; className?: string }>,

  content: {
    assigned:    { variant: 'outline',   label: CONTENT_ASSIGNMENT_STATUS_LABELS.assigned },
    in_progress: { variant: 'secondary', label: CONTENT_ASSIGNMENT_STATUS_LABELS.in_progress },
    completed:   { variant: 'default',   label: CONTENT_ASSIGNMENT_STATUS_LABELS.completed },
  } satisfies Record<ContentAssignmentStatus, { variant: BadgeVariant; label: string }>,
};

export type StatusDomain = keyof typeof DOMAIN_MAP;

interface StatusBadgeProps {
  status: string;
  domain: StatusDomain;
  className?: string;
}

export function StatusBadge({ status, domain, className }: StatusBadgeProps) {
  const config = DOMAIN_MAP[domain]?.[status];
  const variant = config?.variant ?? 'outline';
  const label = config?.label ?? status;
  const extraClass = config?.className ?? '';

  return (
    <Badge variant={variant} className={`${extraClass} ${className ?? ''}`.trim() || undefined}>
      {label}
    </Badge>
  );
}
