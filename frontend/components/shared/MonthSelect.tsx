import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const MONTH_LABELS: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
  5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
  9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
};

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
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MONTHS.map(m => (
          <SelectItem key={m} value={String(m)}>
            {showNames ? MONTH_LABELS[m] : m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
