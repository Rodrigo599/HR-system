import { useCallback } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SmartFormField, SmartFormFieldType } from '@/types/smartforms';
import { I18nInput } from './I18nInput';
import { getI18nPt, i18nToLangs, makeI18n } from './helpers';
import type { FieldType, Lang } from './types';

interface FieldEditorProps {
  field: SmartFormField;
  onChange: (field: SmartFormField) => void;
}

const LANG_COLOR: Record<Lang, string> = {
  pt: 'text-green-600',
  es: 'text-yellow-600',
};

export function FieldEditor({ field, onChange }: FieldEditorProps) {
  const { t } = useLanguage();
  const update = useCallback(
    (patch: Partial<SmartFormField>) => onChange({ ...field, ...patch }),
    [field, onChange],
  );

  const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'email', label: 'E-mail' },
    { value: 'tel', label: 'Telefone' },
    { value: 'date-range', label: 'Intervalo de datas' },
    { value: 'checkbox-grid', label: 'Grade de opções' },
    { value: 'scale', label: 'Escala (1-10)' },
    { value: 'radio', label: 'Escolha única' },
    { value: 'textarea', label: 'Texto longo' },
    { value: 'yes-no', label: 'Sim/Não' },
    { value: 'rating', label: 'Estrelas' },
    { value: 'date', label: t('date') },
  ];

  const isDateRange = field.type === 'date-range';
  const isCheckboxGrid = field.type === 'checkbox-grid';
  const isRadio = field.type === 'radio';
  const isNumber = field.type === 'number';
  const isScale = field.type === 'scale';
  const isRating = field.type === 'rating';
  const isTextLike = field.type === 'text' || field.type === 'email' || field.type === 'tel';
  const needsOptions = isCheckboxGrid || isRadio;
  const isSimpleType =
    field.type === 'textarea' ||
    field.type === 'yes-no' ||
    field.type === 'date' ||
    field.type === 'email' ||
    field.type === 'tel';

  const namesStr = field.names?.join(', ') ?? '';

  return (
    <div className="mt-3 pt-3 border-t space-y-3">
      {/* Tipo */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">{t('builderFieldType')}</Label>
        <Select value={field.type} onValueChange={(v) => update({ type: v as SmartFormFieldType })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FIELD_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nome(s) */}
      {isDateRange ? (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('builderFieldNames')}</Label>
          <Input
            type="text"
            value={namesStr}
            onChange={(e) => update({ names: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            placeholder="checkin, checkout"
            className="h-8 text-sm font-mono"
          />
        </div>
      ) : (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('builderFieldName')}</Label>
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
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('builderFieldLabels')}</Label>
          <div className="space-y-1.5">
            {(['pt', 'es'] as Lang[]).map((lang) => {
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
          placeholder={t('builderFieldLabel')}
        />
      )}

      {/* Obrigatório */}
      <div className="flex items-center gap-2">
        <Switch
          id="field-required"
          checked={!!field.required}
          onCheckedChange={(checked) => update({ required: checked })}
        />
        <Label htmlFor="field-required" className="text-xs text-muted-foreground cursor-pointer">
          {t('builderRequired')}
        </Label>
      </div>

      {/* Configs extras: number */}
      {isNumber && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Min</Label>
            <Input type="number" value={field.min ?? ''} onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })} placeholder="1" className="h-8 text-sm" />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Max</Label>
            <Input type="number" value={field.max ?? ''} onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })} placeholder="20" className="h-8 text-sm" />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">{t('builderDefaultValue')}</Label>
            <Input type="number" value={field.value ?? ''} onChange={(e) => update({ value: e.target.value ? Number(e.target.value) : undefined })} placeholder="2" className="h-8 text-sm" />
          </div>
        </div>
      )}

      {/* Configs extras: scale */}
      {isScale && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Min</Label>
            <Input type="number" value={field.min ?? 1} onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })} placeholder="1" className="h-8 text-sm" />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Max</Label>
            <Input type="number" value={field.max ?? 10} onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })} placeholder="10" className="h-8 text-sm" />
          </div>
        </div>
      )}

      {/* Configs extras: rating */}
      {isRating && (
        <div className="w-32">
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('builderStars')}</Label>
          <Input type="number" value={field.stars ?? 5} onChange={(e) => update({ stars: e.target.value ? Number(e.target.value) : undefined })} placeholder="5" min={1} max={10} className="h-8 text-sm" />
        </div>
      )}

      {/* Autocomplete */}
      {isTextLike && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('builderAutocomplete')}</Label>
          <Input type="text" value={field.autocomplete ?? ''} onChange={(e) => update({ autocomplete: e.target.value || undefined })} placeholder="name, email, tel..." className="h-8 text-sm font-mono" />
        </div>
      )}

      {/* Opções: checkbox-grid e radio */}
      {needsOptions && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs text-muted-foreground">{t('builderOptions')}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-primary"
              onClick={() => {
                const opts = [...(field.options ?? []), { value: 'opcao', label: { pt: 'Opção', en: 'Option', es: 'Opción' } }];
                update({ options: opts });
              }}
            >
              {t('builderAddOption')}
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
                    opts[i] = { ...opts[i], label: makeI18n(e.target.value, prevLangs.es || e.target.value) };
                    update({ options: opts });
                  }}
                  placeholder="label"
                  className="flex-1 h-7 text-xs"
                />
                <button
                  type="button"
                  onClick={() => update({ options: (field.options ?? []).filter((_, idx) => idx !== i) })}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  aria-label={t('builderRemoveField')}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tipos simples sem config extra */}
      {isSimpleType && field.type !== 'email' && field.type !== 'tel' && (
        <p className="text-xs text-muted-foreground italic">{t('builderNoExtraConfig')}</p>
      )}
    </div>
  );
}
