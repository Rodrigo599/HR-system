'use client';

import { useState } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical, Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SmartFormConfig } from '@/types/smartforms';
import { SortableStep } from './builder/SortableStep';
import { SettingsCard } from './builder/SettingsCard';
import { getI18nPt, emptyStep } from './builder/helpers';

interface SmartFormBuilderProps {
  config: SmartFormConfig;
  onChange: (config: SmartFormConfig) => void;
}

export default function SmartFormBuilder({ config, onChange }: SmartFormBuilderProps) {
  const { t } = useLanguage();
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    () => new Set(config.steps.length > 0 ? [0] : []),
  );
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const stepSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const steps = config.steps.length > 0 ? config.steps : [emptyStep()];
  const stepIds = steps.map((_, i) => `step-${i}`);

  function toggleExpand(i: number) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function addStep() {
    const newSteps = [...steps, emptyStep()];
    onChange({ ...config, steps: newSteps });
    setExpandedSteps((prev) => new Set([...prev, newSteps.length - 1]));
  }

  function removeStep(i: number) {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, idx) => idx !== i);
    onChange({ ...config, steps: newSteps });
    setExpandedSteps((prev) => {
      const next = new Set<number>();
      prev.forEach((idx) => {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
      });
      return next;
    });
  }

  function updateStep(i: number, step: typeof steps[0]) {
    const newSteps = [...steps];
    newSteps[i] = step;
    onChange({ ...config, steps: newSteps });
  }

  function handleStepDragStart(event: DragStartEvent) {
    setActiveStepId(event.active.id as string);
  }

  function handleStepDragEnd(event: DragEndEvent) {
    setActiveStepId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stepIds.indexOf(active.id as string);
    const newIndex = stepIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newSteps = arrayMove(steps, oldIndex, newIndex);
    onChange({ ...config, steps: newSteps });
    setExpandedSteps((prev) => {
      const arr = [...Array(steps.length).keys()].map((_, i) => (prev.has(i) ? i : -1)).filter((i) => i !== -1);
      const reordered = arrayMove(arr, oldIndex, newIndex);
      return new Set(reordered.map((_, newIdx) => (arr.includes(newIdx) ? newIdx : -1)).filter((i) => i !== -1));
    });
  }

  const activeDragStepIndex = activeStepId ? stepIds.indexOf(activeStepId) : -1;
  const activeDragStep = activeDragStepIndex !== -1 ? steps[activeDragStepIndex] : null;

  return (
    <div className="space-y-3">
      <DndContext
        sensors={stepSensors}
        collisionDetection={closestCenter}
        onDragStart={handleStepDragStart}
        onDragEnd={handleStepDragEnd}
      >
        <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <SortableStep
                key={`step-${i}`}
                step={step}
                stepId={stepIds[i]}
                stepIndex={i}
                totalSteps={steps.length}
                isExpanded={expandedSteps.has(i)}
                onToggleExpand={() => toggleExpand(i)}
                onChange={(updated) => updateStep(i, updated)}
                onRemove={() => removeStep(i)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeDragStep ? (
            <Card className="border-primary/50 shadow-2xl cursor-grabbing opacity-90">
              <CardHeader className="py-3 px-4 flex-row items-center gap-2 space-y-0">
                <GripVertical size={16} className="text-muted-foreground" />
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold">
                  {activeDragStepIndex + 1}
                </span>
                <span className="text-sm font-medium">
                  {getI18nPt(activeDragStep.title) || `${t('builderScreen')} ${activeDragStepIndex + 1}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {activeDragStep.fields.length === 1
                    ? t('builderOneField')
                    : t('builderNFields', { n: activeDragStep.fields.length })}
                </span>
              </CardHeader>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        type="button"
        onClick={addStep}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border hover:border-primary/50 rounded-lg text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <Plus size={15} />
        {t('builderAddScreen')}
      </button>

      <SettingsCard config={config} onChange={onChange} />
    </div>
  );
}
