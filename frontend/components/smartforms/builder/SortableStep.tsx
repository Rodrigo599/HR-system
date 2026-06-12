import { useState } from 'react';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SmartFormStep } from '@/types/smartforms';
import { I18nInput } from './I18nInput';
import { SortableField } from './SortableField';
import { getI18nPt, emptyField } from './helpers';
import { FIELD_TYPE_BADGE_CLASS } from './types';

interface SortableStepProps {
  step: SmartFormStep;
  stepId: string;
  stepIndex: number;
  totalSteps: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (step: SmartFormStep) => void;
  onRemove: () => void;
}

export function SortableStep({
  step,
  stepId,
  stepIndex,
  totalSteps,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
}: SortableStepProps) {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stepId });
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const fieldSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fieldIds = step.fields.map((_, i) => `step-${stepIndex}-field-${i}`);

  function handleFieldDragStart(event: DragStartEvent) {
    setActiveFieldId(event.active.id as string);
  }

  function handleFieldDragEnd(event: DragEndEvent) {
    setActiveFieldId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fieldIds.indexOf(active.id as string);
    const newIndex = fieldIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newFields = arrayMove(step.fields, oldIndex, newIndex);
    if (editingFieldIndex !== null) {
      if (editingFieldIndex === oldIndex) setEditingFieldIndex(newIndex);
      else if (oldIndex < editingFieldIndex && newIndex >= editingFieldIndex) setEditingFieldIndex(editingFieldIndex - 1);
      else if (oldIndex > editingFieldIndex && newIndex <= editingFieldIndex) setEditingFieldIndex(editingFieldIndex + 1);
    }
    onChange({ ...step, fields: newFields });
  }

  function addField() {
    const newFields = [...step.fields, emptyField()];
    onChange({ ...step, fields: newFields });
    setEditingFieldIndex(newFields.length - 1);
    if (!isExpanded) onToggleExpand();
  }

  function removeField(i: number) {
    const newFields = step.fields.filter((_, idx) => idx !== i);
    onChange({ ...step, fields: newFields });
    if (editingFieldIndex === i) setEditingFieldIndex(null);
    else if (editingFieldIndex !== null && editingFieldIndex > i) setEditingFieldIndex(editingFieldIndex - 1);
  }

  function updateField(i: number, field: typeof step.fields[0]) {
    const newFields = [...step.fields];
    newFields[i] = field;
    onChange({ ...step, fields: newFields });
  }

  const titlePt = getI18nPt(step.title) || `${t('builderScreen')} ${stepIndex + 1}`;
  const fieldsCount = step.fields.length;
  const activeFieldIndex = activeFieldId ? fieldIds.indexOf(activeFieldId) : -1;
  const activeDragField = activeFieldIndex !== -1 ? step.fields[activeFieldIndex] : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${isDragging ? 'border-primary/50 ring-1 ring-primary/20 shadow-xl' : ''}`}
    >
      <CardHeader className="py-3 px-4 flex-row items-center gap-2 bg-muted/30 rounded-t-lg space-y-0">
        <button
          {...listeners}
          {...attributes}
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
          tabIndex={-1}
          aria-label={t('builderDragScreen')}
        >
          <GripVertical size={16} />
        </button>

        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 font-semibold">
          {stepIndex + 1}
        </span>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{titlePt}</span>
          <span className="text-xs text-muted-foreground">
            {fieldsCount === 0
              ? t('builderNoFields')
              : fieldsCount === 1
              ? t('builderOneField')
              : t('builderNFields', { n: fieldsCount })}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleExpand}
            title={isExpanded ? t('builderCollapse') : t('builderExpand')}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </Button>
          {totalSteps > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              title={t('builderRemoveScreen')}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <I18nInput
              label={t('builderScreenTitle')}
              value={step.title}
              onChange={(val) => onChange({ ...step, title: val })}
              placeholder={t('title')}
            />
            <I18nInput
              label={t('builderScreenSubtitle')}
              value={step.subtitle}
              onChange={(val) => onChange({ ...step, subtitle: val })}
              placeholder={t('builderScreenSubtitlePlaceholder')}
            />
          </div>

          {fieldsCount > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t('builderFields')}</p>
            </div>
          )}

          {fieldsCount > 0 && (
            <DndContext
              sensors={fieldSensors}
              collisionDetection={closestCenter}
              onDragStart={handleFieldDragStart}
              onDragEnd={handleFieldDragEnd}
            >
              <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {step.fields.map((field, i) => (
                    <SortableField
                      key={`${stepIndex}-${i}-${field.type}-${field.name ?? ''}`}
                      field={field}
                      fieldId={fieldIds[i]}
                      stepIndex={stepIndex}
                      fieldIndex={i}
                      isEditing={editingFieldIndex === i}
                      onToggleEdit={() => setEditingFieldIndex(editingFieldIndex === i ? null : i)}
                      onChange={(updated) => updateField(i, updated)}
                      onRemove={() => removeField(i)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeDragField ? (
                  <div className="bg-card border border-primary/50 rounded-lg px-3 py-2 opacity-90 shadow-2xl cursor-grabbing">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-muted-foreground" />
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${FIELD_TYPE_BADGE_CLASS[activeDragField.type]}`}>
                        {activeDragField.type}
                      </span>
                      <span className="text-xs font-mono text-foreground/80 truncate">
                        {activeDragField.names?.join(', ') ?? activeDragField.name ?? ''}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          <button
            type="button"
            onClick={addField}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-border hover:border-primary/50 rounded-lg text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus size={13} />
            {t('builderAddField')}
          </button>
        </CardContent>
      )}
    </Card>
  );
}
