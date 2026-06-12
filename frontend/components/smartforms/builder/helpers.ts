import type { SmartFormField, SmartFormStep, I18nText } from '@/types/smartforms';
import type { Lang } from './types';

export function getI18nPt(text: I18nText | undefined): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text.pt ?? '';
}

export function makeI18n(pt: string, es: string): I18nText {
  if (pt === es) return pt;
  return { pt, es };
}

export function i18nToLangs(text: I18nText | undefined): { pt: string; es: string } {
  if (!text) return { pt: '', es: '' };
  if (typeof text === 'string') return { pt: text, es: text };
  return { pt: text.pt ?? '', es: text.es ?? '' };
}

export function emptyField(): SmartFormField {
  return { type: 'text', name: 'campo', label: { pt: 'Campo', es: 'Campo' } };
}

export function emptyStep(): SmartFormStep {
  return {
    title: { pt: 'Nova tela', es: 'Nueva pantalla' },
    subtitle: { pt: '', es: '' },
    fields: [],
  };
}

export const LANG_COLORS: Record<Lang, string> = {
  pt: 'text-green-600',
  es: 'text-yellow-600',
};
