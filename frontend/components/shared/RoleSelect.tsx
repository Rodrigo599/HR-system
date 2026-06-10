import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APP_ROLES, APP_ROLE_LABELS } from '@/lib/enums';

interface RoleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Opção "todos" no topo — ex.: { value: 'all', label: 'Todos' } */
  allOption?: { value: string; label: string };
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function RoleSelect({
  value,
  onValueChange,
  placeholder = 'Selecione o perfil',
  allOption,
  disabled,
  id,
  className,
}: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allOption && (
          <SelectItem value={allOption.value}>{allOption.label}</SelectItem>
        )}
        {APP_ROLES.map(role => (
          <SelectItem key={role} value={role}>{APP_ROLE_LABELS[role]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
