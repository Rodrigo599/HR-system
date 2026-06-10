import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSmartForms } from '@/hooks/api/useSmartForms';

interface SmartFormSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  category?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function SmartFormSelect({
  value,
  onValueChange,
  placeholder = 'Selecione o formulário',
  category,
  disabled,
  id,
  className,
}: SmartFormSelectProps) {
  const { data = [], isLoading } = useSmartForms(category ? { category } : undefined);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled ?? isLoading}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={isLoading ? 'Carregando...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {data.map(f => (
          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
