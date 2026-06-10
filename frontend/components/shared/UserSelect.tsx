import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/hooks/api/useUsers';
import type { AppRole } from '@/lib/enums';

interface UserSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Filtrar apenas usuários com ao menos um desses roles. Omitido = todos. */
  roles?: AppRole[];
  /** Opção extra no topo — ex.: { value: '__none__', label: 'Sem gestor' } */
  noneOption?: { value: string; label: string };
  disabled?: boolean;
  id?: string;
  /** Excluir um user_id da lista (ex.: o próprio usuário logado) */
  excludeId?: string;
}

export function UserSelect({
  value,
  onValueChange,
  placeholder = 'Selecione',
  roles,
  noneOption,
  disabled,
  id,
  excludeId,
}: UserSelectProps) {
  const { data = [], isLoading } = useUsers();

  const options = data
    .filter(u => u.id !== excludeId)
    .filter(u => !roles || roles.some(r => u.roles.includes(r)));

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled ?? isLoading}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={isLoading ? 'Carregando...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {noneOption && (
          <SelectItem value={noneOption.value}>{noneOption.label}</SelectItem>
        )}
        {options.map(u => (
          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
