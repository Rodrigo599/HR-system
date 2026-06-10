import { useSectors } from '@/hooks/api/useSectors';

interface SectorNameProps {
  sectorId: string | null;
  fallback?: string;
}

export function SectorName({ sectorId, fallback = 'Todos os setores' }: SectorNameProps) {
  const { data = [] } = useSectors();
  if (!sectorId) return <>{fallback}</>;
  return <>{data.find(s => s.id === sectorId)?.name ?? '—'}</>;
}
