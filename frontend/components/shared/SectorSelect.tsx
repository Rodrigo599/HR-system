import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSectors } from '@/hooks/api/useSectors';

interface SectorSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Opção "todos" no topo — ex.: { value: 'all', label: 'Todos os setores' } */
  allOption?: { value: string; label: string };
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function SectorSelect({
  value,
  onValueChange,
  placeholder = 'Selecione o setor',
  allOption,
  disabled,
  id,
  className,
}: SectorSelectProps) {
  const { data = [], isLoading } = useSectors();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled ?? isLoading}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={isLoading ? 'Carregando...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allOption && (
          <SelectItem value={allOption.value}>{allOption.label}</SelectItem>
        )}
        {data.map(s => (
          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
