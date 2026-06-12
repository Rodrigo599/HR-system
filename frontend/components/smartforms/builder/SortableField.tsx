import { GripVertical, Trash2, Pencil, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SmartFormField } from '@/types/smartforms';
import { FieldEditor } from './FieldEditor';
import { getI18nPt } from './helpers';
import { FIELD_TYPE_BADGE_CLASS } from './types';

interface SortableFieldProps {
  field: SmartFormField;
  fieldId: string;
  stepIndex: number;
  fieldIndex: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onChange: (field: SmartFormField) => void;
  onRemove: () => void;
}

export function SortableField({
  field,
  fieldId,
  isEditing,
  onToggleEdit,
  onChange,
  onRemove,
}: SortableFieldProps) {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const displayName = field.names?.join(', ') ?? field.name ?? '';
  const displayLabel = getI18nPt(field.label) || (field.labels?.['pt']?.join(', ') ?? '');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-card transition-colors ${
        isDragging
          ? 'border-primary/50 ring-1 ring-primary/20'
          : isEditing
          ? 'border-border'
          : 'border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          {...listeners}
          {...attributes}
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
          tabIndex={-1}
          aria-label={t('builderDragField')}
        >
          <GripVertical size={14} />
        </button>

        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${FIELD_TYPE_BADGE_CLASS[field.type]}`}>
          {field.type}
        </span>

        <div className="flex-1 min-w-0">
          {displayName && <span className="text-xs font-mono text-foreground/80 truncate block">{displayName}</span>}
          {displayLabel && <span className="text-xs text-muted-foreground truncate block">{displayLabel}</span>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleEdit}
            className={`p-1 rounded transition-colors ${isEditing ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
            title={isEditing ? t('builderCloseEdit') : t('builderEditField')}
          >
            {isEditing ? <Check size={13} /> : <Pencil size={13} />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
            title={t('builderRemoveField')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="px-3 pb-3">
          <FieldEditor field={field} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
