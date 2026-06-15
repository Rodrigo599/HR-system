import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const MONTH_KEYS: TranslationKey[] = [
  'january', 'february', 'march', 'april',
  'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
];

interface MonthSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Se true, exibe "Janeiro" em vez de "1" */
  showNames?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function MonthSelect({
  value,
  onValueChange,
  showNames = false,
  disabled,
  id,
  className,
}: MonthSelectProps) {
  const { t } = useLanguage();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MONTH_KEYS.map((key, i) => (
          <SelectItem key={i + 1} value={String(i + 1)}>
            {showNames ? t(key) : i + 1}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
