import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SmartFormConfig, SmartFormField, I18nText } from '@/types/smartforms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartFormRendererProps {
  config: SmartFormConfig;
  onSubmit: (responses: Record<string, unknown>) => void;
  readOnly?: boolean;
  initialValues?: Record<string, unknown>;
}

function resolveI18n(text: I18nText | undefined, language: string): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return (text as Record<string, string>)[language] || text.pt || text.es || '';
}

interface FieldProps {
  field: SmartFormField;
  value: unknown;
  onChange: (val: unknown) => void;
  error?: string;
  disabled: boolean;
  language: string;
}

function StarRating({ value, max, onChange, disabled }: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered !== null ? hovered : value;
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => !disabled && setHovered(null)}
          className={cn(
            'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          )}
          aria-label={`${star} estrela${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'h-6 w-6',
              star <= display ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function FieldRenderer({ field, value, onChange, error, disabled, language }: FieldProps) {
  const label = resolveI18n(field.label, language);
  const placeholder = resolveI18n(field.placeholder, language);

  const fieldClass = cn(
    error ? 'border-destructive ring-1 ring-destructive' : ''
  );

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      return (
        <Input
          type={field.type}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={field.autocomplete}
          disabled={disabled}
          className={fieldClass}
          aria-invalid={!!error}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={field.min}
          max={field.max}
          disabled={disabled}
          className={fieldClass}
          aria-invalid={!!error}
        />
      );

    case 'textarea':
      return (
        <Textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('min-h-[80px]', fieldClass)}
          aria-invalid={!!error}
        />
      );

    case 'scale': {
      const min = field.min ?? 1;
      const max = field.max ?? 10;
      const current = (value as number) ?? min;
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min}</span>
            <span className="font-semibold text-foreground text-sm">{current}</span>
            <span>{max}</span>
          </div>
          <Slider
            min={min}
            max={max}
            step={1}
            value={[current]}
            onValueChange={([v]) => onChange(v)}
            disabled={disabled}
            className={fieldClass}
            aria-label={label}
          />
        </div>
      );
    }

    case 'radio': {
      const options = field.options ?? [];
      return (
        <RadioGroup
          value={(value as string) ?? ''}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
          className="space-y-2"
          aria-invalid={!!error}
        >
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} />
              <Label htmlFor={`${field.name}-${opt.value}`} className="font-normal cursor-pointer">
                {resolveI18n(opt.label, language)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    case 'checkbox-grid': {
      const options = field.options ?? [];
      const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (v: string) => {
        if (selected.includes(v)) {
          onChange(selected.filter((s) => s !== v));
        } else {
          onChange([...selected, v]);
        }
      };
      return (
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`${field.name}-${opt.value}`}
                checked={selected.includes(opt.value)}
                onCheckedChange={() => !disabled && toggle(opt.value)}
                disabled={disabled}
              />
              <Label htmlFor={`${field.name}-${opt.value}`} className="font-normal cursor-pointer">
                {resolveI18n(opt.label, language)}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    case 'yes-no': {
      const checked = value === true || value === 'true';
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={checked}
            onCheckedChange={(v) => onChange(v)}
            disabled={disabled}
            aria-label={label}
          />
          <span className="text-sm text-muted-foreground">{checked ? 'Sim / Sí' : 'Não / No'}</span>
        </div>
      );
    }

    case 'rating': {
      const stars = field.stars ?? 5;
      return (
        <StarRating
          value={(value as number) ?? 0}
          max={stars}
          onChange={(v) => onChange(v)}
          disabled={disabled}
        />
      );
    }

    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={fieldClass}
          aria-invalid={!!error}
        />
      );

    case 'date-range': {
      const [startName, endName] = field.names ?? ['start', 'end'];
      const rangeVal = (value as Record<string, string>) ?? {};
      return (
        <div className="flex gap-3 items-center">
          <Input
            type="date"
            value={rangeVal[startName] ?? ''}
            onChange={(e) => onChange({ ...rangeVal, [startName]: e.target.value })}
            disabled={disabled}
            className={cn('flex-1', fieldClass)}
          />
          <span className="text-muted-foreground text-sm">ate</span>
          <Input
            type="date"
            value={rangeVal[endName] ?? ''}
            onChange={(e) => onChange({ ...rangeVal, [endName]: e.target.value })}
            disabled={disabled}
            className={cn('flex-1', fieldClass)}
          />
        </div>
      );
    }

    default:
      return null;
  }
}

export function SmartFormRenderer({ config, onSubmit, readOnly = false, initialValues = {} }: SmartFormRendererProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = config.steps.length;
  const currentStep = config.steps[step];
  const progressPercent = ((step + 1) / totalSteps) * 100;

  const resolveLabel = (text: I18nText | undefined) => resolveI18n(text, language);

  const setValue = (name: string, val: unknown) => {
    setValues((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const validateStep = (): boolean => {
    const stepErrors: Record<string, string> = {};
    for (const field of currentStep.fields) {
      if (!field.required) continue;
      const name = field.name ?? '';
      const val = values[name];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) {
        stepErrors[name] = 'Campo obrigatório / Campo obligatorio';
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    onSubmit(values);
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Step indicator */}
      {totalSteps > 1 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {`Passo ${step + 1} de ${totalSteps}`}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{resolveLabel(currentStep.title)}</CardTitle>
          {currentStep.subtitle && (
            <CardDescription>{resolveLabel(currentStep.subtitle)}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep.fields.map((field) => {
            const name = field.name ?? '';
            const label = resolveLabel(field.label);
            const error = errors[name];
            return (
              <div key={name} className="space-y-2">
                {label && (
                  <Label htmlFor={name} className={cn(field.required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
                    {label}
                  </Label>
                )}
                <FieldRenderer
                  field={field}
                  value={values[name]}
                  onChange={(val) => setValue(name, val)}
                  error={error}
                  disabled={!!readOnly}
                  language={language}
                />
                {error && (
                  <p className="text-xs text-destructive" role="alert">{error}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      {!readOnly && (
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            {resolveLabel(config.back) || 'Voltar'}
          </Button>
          {isLastStep ? (
            <Button onClick={handleSubmit}>
              {resolveLabel(config.submit) || 'Enviar'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {resolveLabel(config.next) || 'Proximo'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default SmartFormRenderer;
