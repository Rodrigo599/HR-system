import type { SmartFormField } from '@/types/smartforms';
import type { Language } from '@/i18n/translations';

export type FieldType = SmartFormField['type'];
export type Lang = Language;

export const FIELD_TYPE_BADGE_CLASS: Record<FieldType, string> = {
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
