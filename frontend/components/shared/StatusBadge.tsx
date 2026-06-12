import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getEvaluationStatusLabels,
  getPdiTaskStatusLabels,
  getPdiStatusLabels,
  getOneOnOneStatusLabels,
  getSmartFormStatusLabels,
  type EvaluationStatus,
  type PdiTaskStatus,
  type PdiStatus,
  type OneOnOneStatus,
  type SmartFormStatus,
  type ContentAssignmentStatus,
} from '@/lib/enums';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';
type DomainEntry = { variant: BadgeVariant; label: string; className?: string };

export type StatusDomain = 'evaluation' | 'pdi_task' | 'pdi' | 'one_on_one' | 'smart_form' | 'content';

interface StatusBadgeProps {
  status: string;
  domain: StatusDomain;
  className?: string;
}

export function StatusBadge({ status, domain, className }: StatusBadgeProps) {
  const { t } = useLanguage();

  const evalLabels = getEvaluationStatusLabels(t);
  const pdiTaskLabels = getPdiTaskStatusLabels(t);
  const pdiLabels = getPdiStatusLabels(t);
  const oneOnOneLabels = getOneOnOneStatusLabels(t);
  const smartFormLabels = getSmartFormStatusLabels(t);

  const DOMAIN_MAP: Record<StatusDomain, Record<string, DomainEntry>> = {
    evaluation: {
      pending_self:    { variant: 'outline',     label: evalLabels.pending_self },
      pending_manager: { variant: 'secondary',   label: evalLabels.pending_manager },
      completed:       { variant: 'default',     label: evalLabels.completed },
      closed:          { variant: 'destructive', label: evalLabels.closed },
    } satisfies Record<EvaluationStatus, DomainEntry>,

    pdi_task: {
      pending:   { variant: 'outline',     label: pdiTaskLabels.pending },
      submitted: { variant: 'secondary',   label: pdiTaskLabels.submitted },
      approved:  { variant: 'default',     label: pdiTaskLabels.approved },
      rejected:  { variant: 'destructive', label: pdiTaskLabels.rejected },
    } satisfies Record<PdiTaskStatus, DomainEntry>,

    pdi: {
      active:    { variant: 'default',     label: pdiLabels.active },
      completed: { variant: 'secondary',   label: pdiLabels.completed },
      cancelled: { variant: 'destructive', label: pdiLabels.cancelled },
    } satisfies Record<PdiStatus, DomainEntry>,

    one_on_one: {
      scheduled: { variant: 'outline',     label: oneOnOneLabels.scheduled },
      completed: { variant: 'default',     label: oneOnOneLabels.completed },
      cancelled: { variant: 'destructive', label: oneOnOneLabels.cancelled },
    } satisfies Record<OneOnOneStatus, DomainEntry>,

    smart_form: {
      draft:    { variant: 'secondary', label: smartFormLabels.draft },
      active:   { variant: 'default',   label: smartFormLabels.active, className: 'bg-green-600 text-white hover:bg-green-700' },
      archived: { variant: 'outline',   label: smartFormLabels.archived },
    } satisfies Record<SmartFormStatus, DomainEntry>,

    content: {
      assigned:    { variant: 'outline',   label: t('contentAssignedStatus') },
      in_progress: { variant: 'secondary', label: t('contentInProgressStatus') },
      completed:   { variant: 'default',   label: t('completed') },
    } satisfies Record<ContentAssignmentStatus, DomainEntry>,
  };

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
