'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Pencil,
  Check,
  X,
} from 'lucide-react';

import type {
  SmartFormConfig,
  SmartFormStep,
  SmartFormField,
  I18nText,
  SmartFormFieldType,
} from '@/types/smartforms';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============================================================================
// TYPES
// ============================================================================

interface SmartFormBuilderProps {
  config: SmartFormConfig;
  onChange: (config: SmartFormConfig) => void;
}

type FieldType = SmartFormField['type'];
type Lang = 'pt' | 'es';

// ============================================================================
// HELPERS
// ============================================================================

function getI18nPt(text: I18nText | undefined): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text.pt ?? '';
}

function makeI18n(pt: string, es: string): I18nText {
  if (pt === es) return pt;
  return { pt, es };
}

function i18nToLangs(text: I18nText | undefined): { pt: string; es: string } {
  if (!text) return { pt: '', es: '' };
  if (typeof text === 'string') return { pt: text, es: text };
  return { pt: text.pt ?? '', es: text.es ?? '' };
}

function emptyField(): SmartFormField {
  return { type: 'text', name: 'campo', label: { pt: 'Campo', es: 'Campo' } };
}

function emptyStep(): SmartFormStep {
  return {
    title: { pt: 'Nova tela', es: 'Nueva pantalla' },
    subtitle: { pt: '', es: '' },
    fields: [],
  };
}

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Numero' },
  { value: 'email', label: 'E-mail' },
  { value: 'tel', label: 'Telefone' },
  { value: 'date-range', label: 'Intervalo de datas' },
  { value: 'checkbox-grid', label: 'Grade de opcoes' },
  // HR-specific types
  { value: 'scale', label: 'Escala (1-10)' },
  { value: 'radio', label: 'Escolha unica' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'yes-no', label: 'Sim/Nao' },
  { value: 'rating', label: 'Estrelas' },
  { value: 'date', label: 'Data' },
];

// Badge variant mapping — uses data attributes for custom coloring via Tailwind
const FIELD_TYPE_BADGE_CLASS: Record<FieldType, string> = {
  text: 'bg-gray-100 text-gray-600 border-gray-200',
  number: 'bg-blue-50 text-blue-600 border-blue-200',
  email: 'bg-purple-50 text-purple-600 border-purple-200',
  tel: 'bg-green-50 text-green-600 border-green-200',
  'date-range': 'bg-orange-50 text-orange-600 border-orange-200',
  'checkbox-grid': 'bg-cyan-50 text-cyan-600 border-cyan-200',
  scale: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  radio: 'bg-violet-50 text-violet-600 border-violet-200',
  textarea: 'bg-slate-50 text-slate-600 border-slate-200',
  'yes-no': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rating: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  date: 'bg-rose-50 text-rose-600 border-rose-200',
};

// ============================================================================
// I18N INPUT
// ============================================================================

interface I18nInputProps {
  label: string;
  value: I18nText | undefined;
  onChange: (val: I18nText) => void;
  placeholder?: string;
  className?: string;
}

function I18nInput({ label, value, onChange, placeholder, className = '' }: I18nInputProps) {
  const [activeTab, setActiveTab] = useState<Lang>('pt');
  const langs = i18nToLangs(value);

  const handleChange = (lang: Lang, text: string) => {
    const updated = { ...langs, [lang]: text };
    onChange(makeI18n(updated.pt, updated.es));
  };

  const TAB_ACTIVE_CLASS: Record<Lang, string> = {
    pt: 'data-[state=active]:bg-green-600 data-[state=active]:text-white',
    es: 'data-[state=active]:bg-yellow-500 data-[state=active]:text-white',
  };

  return (
    <div className={className}>
      {label && (
        <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      )}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Lang)} className="w-full">
        <TabsList className="h-7 mb-1.5 bg-muted/50 p-0.5 gap-0.5">
          {(['pt', 'es'] as Lang[]).map((lang) => (
            <TabsTrigger
              key={lang}
              value={lang}
              className={`h-6 px-2 text-xs font-medium rounded transition-colors ${TAB_ACTIVE_CLASS[lang]}`}
            >
              {lang.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Input
        type="text"
        value={langs[activeTab]}
        onChange={(e) => handleChange(activeTab, e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}

// ============================================================================
// FIELD EDITOR (inline)
// ============================================================================

interface FieldEditorProps {
  field: SmartFormField;
  onChange: (field: SmartFormField) => void;
}

function FieldEditor({ field, onChange }: FieldEditorProps) {
  const update = useCallback(
    (patch: Partial<SmartFormField>) => onChange({ ...field, ...patch }),
    [field, onChange]
  );

  const isDateRange = field.type === 'date-range';
  const isCheckboxGrid = field.type === 'checkbox-grid';
  const isRadio = field.type === 'radio';
  const isNumber = field.type === 'number';
  const isScale = field.type === 'scale';
  const isRating = field.type === 'rating';
  const isTextLike = field.type === 'text' || field.type === 'email' || field.type === 'tel';

  const namesStr = field.names?.join(', ') ?? '';

  // Types that need options (checkbox-grid and radio behave the same in config)
  const needsOptions = isCheckboxGrid || isRadio;

  // Types with no special config
  const isSimpleType =
    field.type === 'textarea' ||
    field.type === 'yes-no' ||
    field.type === 'date' ||
    field.type === 'email' ||
    field.type === 'tel';

  return (
    <div className="mt-3 pt-3 border-t space-y-3">
      {/* Tipo */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo</Label>
        <Select
          value={field.type}
          onValueChange={(v) => update({ type: v as SmartFormFieldType })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nome(s) */}
      {isDateRange ? (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Nomes (separados por virgula)
          </Label>
          <Input
            type="text"
            value={namesStr}
            onChange={(e) =>
              update({
                names: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="checkin, checkout"
            className="h-8 text-sm font-mono"
          />
        </div>
      ) : (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Nome (kebab-case)</Label>
          <Input
            type="text"
            value={field.name ?? ''}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="nome-do-campo"
            className="h-8 text-sm font-mono"
          />
        </div>
      )}

      {/* Label */}
      {isDateRange ? (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Labels (separadas por virgula, por idioma)
          </Label>
          <div className="space-y-1.5">
            {(['pt', 'es'] as Lang[]).map((lang) => {
              const LANG_COLOR: Record<Lang, string> = {
                pt: 'text-green-600',
                es: 'text-yellow-600',
              };
              const current = field.labels?.[lang]?.join(', ') ?? '';
              return (
                <div key={lang} className="flex items-center gap-2">
                  <span className={`text-xs font-semibold w-6 flex-shrink-0 ${LANG_COLOR[lang]}`}>
                    {lang.toUpperCase()}
                  </span>
                  <Input
                    type="text"
                    value={current}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map((s) => s.trim());
                      update({ labels: { ...(field.labels ?? {}), [lang]: arr } });
                    }}
                    placeholder="Check-in, Check-out"
                    className="h-8 text-sm flex-1"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <I18nInput
          label="Label"
          value={field.label}
          onChange={(val) => update({ label: val })}
          placeholder="Label do campo"
        />
      )}

      {/* Obrigatório toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="field-required"
          checked={!!field.required}
          onCheckedChange={(checked) => update({ required: checked })}
        />
        <Label htmlFor="field-required" className="text-xs text-muted-foreground cursor-pointer">
          Obrigatório
        </Label>
      </div>

      {/* Configs extras: number */}
      {isNumber && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Min</Label>
            <Input
              type="number"
              value={field.min ?? ''}
              onChange={(e) =>
                update({ min: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="1"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Max</Label>
            <Input
              type="number"
              value={field.max ?? ''}
              onChange={(e) =>
                update({ max: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="20"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Valor padrao</Label>
            <Input
              type="number"
              value={field.value ?? ''}
              onChange={(e) =>
                update({ value: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="2"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Configs extras: scale (slider 1-10) */}
      {isScale && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Min</Label>
            <Input
              type="number"
              value={field.min ?? 1}
              onChange={(e) =>
                update({ min: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="1"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Max</Label>
            <Input
              type="number"
              value={field.max ?? 10}
              onChange={(e) =>
                update({ max: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="10"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Configs extras: rating (star count) */}
      {isRating && (
        <div className="w-32">
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Numero de estrelas
          </Label>
          <Input
            type="number"
            value={field.stars ?? 5}
            onChange={(e) =>
              update({ stars: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="5"
            min={1}
            max={10}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Autocomplete: text-like fields */}
      {isTextLike && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Autocomplete</Label>
          <Input
            type="text"
            value={field.autocomplete ?? ''}
            onChange={(e) => update({ autocomplete: e.target.value || undefined })}
            placeholder="name, email, tel..."
            className="h-8 text-sm font-mono"
          />
        </div>
      )}

      {/* Options: checkbox-grid e radio */}
      {needsOptions && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs text-muted-foreground">Opcoes</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-primary"
              onClick={() => {
                const opts = [
                  ...(field.options ?? []),
                  { value: 'opcao', label: { pt: 'Opcao', en: 'Option', es: 'Opcion' } },
                ];
                update({ options: opts });
              }}
            >
              + Adicionar opcao
            </Button>
          </div>
          <div className="space-y-1.5">
            {(field.options ?? []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={opt.value}
                  onChange={(e) => {
                    const opts = [...(field.options ?? [])];
                    opts[i] = { ...opts[i], value: e.target.value };
                    update({ options: opts });
                  }}
                  placeholder="valor"
                  className="w-24 h-7 text-xs font-mono"
                />
                <Input
                  type="text"
                  value={getI18nPt(opt.label)}
                  onChange={(e) => {
                    const opts = [...(field.options ?? [])];
                    const prevLangs = i18nToLangs(opts[i].label);
                    opts[i] = {
                      ...opts[i],
                      label: makeI18n(
                        e.target.value,
                        prevLangs.es || e.target.value
                      ),
                    };
                    update({ options: opts });
                  }}
                  placeholder="label"
                  className="flex-1 h-7 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const opts = (field.options ?? []).filter((_, idx) => idx !== i);
                    update({ options: opts });
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  aria-label="Remover opcao"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tipos simples: textarea, yes-no, date — sem config adicional */}
      {isSimpleType && field.type !== 'email' && field.type !== 'tel' && (
        <p className="text-xs text-muted-foreground italic">
          Nenhuma configuração adicional necessária para este tipo.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// SORTABLE FIELD
// ============================================================================

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

function SortableField({
  field,
  fieldId,
  isEditing,
  onToggleEdit,
  onChange,
  onRemove,
}: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fieldId,
  });

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
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
          tabIndex={-1}
          aria-label="Arrastar campo"
        >
          <GripVertical size={14} />
        </button>

        {/* Badge tipo */}
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${
            FIELD_TYPE_BADGE_CLASS[field.type]
          }`}
        >
          {field.type}
        </span>

        {/* Nome e label */}
        <div className="flex-1 min-w-0">
          {displayName && (
            <span className="text-xs font-mono text-foreground/80 truncate block">{displayName}</span>
          )}
          {displayLabel && (
            <span className="text-xs text-muted-foreground truncate block">{displayLabel}</span>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleEdit}
            className={`p-1 rounded transition-colors ${
              isEditing
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={isEditing ? 'Fechar edição' : 'Editar campo'}
          >
            {isEditing ? <Check size={13} /> : <Pencil size={13} />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Remover campo"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Editor inline */}
      {isEditing && (
        <div className="px-3 pb-3">
          <FieldEditor field={field} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SORTABLE STEP
// ============================================================================

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

function SortableStep({
  step,
  stepId,
  stepIndex,
  totalSteps,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
}: SortableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stepId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const fieldSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
    if (oldIndex !== -1 && newIndex !== -1) {
      const newFields = arrayMove(step.fields, oldIndex, newIndex);
      if (editingFieldIndex !== null) {
        if (editingFieldIndex === oldIndex) setEditingFieldIndex(newIndex);
        else if (oldIndex < editingFieldIndex && newIndex >= editingFieldIndex)
          setEditingFieldIndex(editingFieldIndex - 1);
        else if (oldIndex > editingFieldIndex && newIndex <= editingFieldIndex)
          setEditingFieldIndex(editingFieldIndex + 1);
      }
      onChange({ ...step, fields: newFields });
    }
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
    else if (editingFieldIndex !== null && editingFieldIndex > i)
      setEditingFieldIndex(editingFieldIndex - 1);
  }

  function updateField(i: number, field: SmartFormField) {
    const newFields = [...step.fields];
    newFields[i] = field;
    onChange({ ...step, fields: newFields });
  }

  const titlePt = getI18nPt(step.title) || `Tela ${stepIndex + 1}`;
  const fieldsCount = step.fields.length;

  const activeFieldIndex = activeFieldId ? fieldIds.indexOf(activeFieldId) : -1;
  const activeDragField = activeFieldIndex !== -1 ? step.fields[activeFieldIndex] : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${
        isDragging ? 'border-primary/50 ring-1 ring-primary/20 shadow-xl' : ''
      }`}
    >
      {/* Header do step */}
      <CardHeader className="py-3 px-4 flex-row items-center gap-2 bg-muted/30 rounded-t-lg space-y-0">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
          tabIndex={-1}
          aria-label="Arrastar tela"
        >
          <GripVertical size={16} />
        </button>

        {/* Numero */}
        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 font-semibold">
          {stepIndex + 1}
        </span>

        {/* Título */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{titlePt}</span>
          <span className="text-xs text-muted-foreground">
            {fieldsCount === 0
              ? 'Nenhum campo'
              : fieldsCount === 1
              ? '1 campo'
              : `${fieldsCount} campos`}
          </span>
        </div>

        {/* Botoes */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleExpand}
            title={isExpanded ? 'Colapsar' : 'Expandir'}
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
              title="Remover tela"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Corpo (quando expandido) */}
      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-3 space-y-3">
          {/* Título e subtítulo do step */}
          <div className="grid grid-cols-1 gap-3">
            <I18nInput
              label="Título da tela"
              value={step.title}
              onChange={(val) => onChange({ ...step, title: val })}
              placeholder="Título"
            />
            <I18nInput
              label="Subtítulo"
              value={step.subtitle}
              onChange={(val) => onChange({ ...step, subtitle: val })}
              placeholder="Subtítulo (opcional)"
            />
          </div>

          {/* Separador campos */}
          {fieldsCount > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Campos</p>
            </div>
          )}

          {/* Lista de campos com DnD */}
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
                      onToggleEdit={() =>
                        setEditingFieldIndex(editingFieldIndex === i ? null : i)
                      }
                      onChange={(updated) => updateField(i, updated)}
                      onRemove={() => removeField(i)}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Overlay do campo sendo arrastado */}
              <DragOverlay>
                {activeDragField ? (
                  <div className="bg-card border border-primary/50 rounded-lg px-3 py-2 opacity-90 shadow-2xl cursor-grabbing">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-muted-foreground" />
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${
                          FIELD_TYPE_BADGE_CLASS[activeDragField.type]
                        }`}
                      >
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

          {/* Botao adicionar campo */}
          <button
            type="button"
            onClick={addField}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-border hover:border-primary/50 rounded-lg text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus size={13} />
            Adicionar campo
          </button>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// SETTINGS CARD (textos dos botoes — sem Cloudbeds/redirect)
// ============================================================================

interface SettingsCardProps {
  config: SmartFormConfig;
  onChange: (config: SmartFormConfig) => void;
}

function SettingsCard({ config, onChange }: SettingsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      {/* Header */}
      <CardHeader className="py-3 px-4 flex-row items-center gap-2 bg-muted/30 rounded-t-lg space-y-0">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">Configurações gerais</CardTitle>
          <p className="text-xs text-muted-foreground">Textos dos botões do formulário</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsExpanded((v) => !v)}
          aria-label={isExpanded ? 'Colapsar configurações' : 'Expandir configurações'}
        >
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-3 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
              Textos dos botoes
            </p>
            <div className="space-y-3">
              {/* Submit */}
              <I18nInput
                label="Enviar"
                value={config.submit}
                onChange={(val) => onChange({ ...config, submit: val })}
                placeholder="Enviar"
              />

              {/* Next / Back */}
              <div className="grid grid-cols-2 gap-3">
                <I18nInput
                  label="Proximo"
                  value={config.next}
                  onChange={(val) => onChange({ ...config, next: val })}
                  placeholder="Proximo"
                />
                <I18nInput
                  label="Voltar"
                  value={config.back}
                  onChange={(val) => onChange({ ...config, back: val })}
                  placeholder="Voltar"
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SmartFormBuilder({ config, onChange }: SmartFormBuilderProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    () => new Set(config.steps.length > 0 ? [0] : [])
  );

  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const stepSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const steps = config.steps.length > 0 ? config.steps : [emptyStep()];
  const stepIds = steps.map((_, i) => `step-${i}`);

  function toggleExpand(i: number) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
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

  function updateStep(i: number, step: SmartFormStep) {
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
    if (oldIndex !== -1 && newIndex !== -1) {
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      onChange({ ...config, steps: newSteps });
      // Reindexar expanded steps apos reordenacao
      setExpandedSteps((prev) => {
        const arr = [...Array(steps.length).keys()]
          .map((_, i) => (prev.has(i) ? i : -1))
          .filter((i) => i !== -1);
        const reordered = arrayMove(arr, oldIndex, newIndex);
        return new Set(
          reordered
            .map((_, newIdx) => (arr.includes(newIdx) ? newIdx : -1))
            .filter((i) => i !== -1)
        );
      });
    }
  }

  const activeDragStepIndex = activeStepId ? stepIds.indexOf(activeStepId) : -1;
  const activeDragStep = activeDragStepIndex !== -1 ? steps[activeDragStepIndex] : null;

  return (
    <div className="space-y-3">
      {/* Lista de steps com DnD */}
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

        {/* Overlay do step sendo arrastado */}
        <DragOverlay>
          {activeDragStep ? (
            <Card className="border-primary/50 shadow-2xl cursor-grabbing opacity-90">
              <CardHeader className="py-3 px-4 flex-row items-center gap-2 space-y-0">
                <GripVertical size={16} className="text-muted-foreground" />
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold">
                  {activeDragStepIndex + 1}
                </span>
                <span className="text-sm font-medium">
                  {getI18nPt(activeDragStep.title) || `Tela ${activeDragStepIndex + 1}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {activeDragStep.fields.length} campos
                </span>
              </CardHeader>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Botao adicionar tela */}
      <button
        type="button"
        onClick={addStep}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border hover:border-primary/50 rounded-lg text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <Plus size={15} />
        Adicionar tela
      </button>

      {/* Card de configurações gerais */}
      <SettingsCard config={config} onChange={onChange} />
    </div>
  );
}
