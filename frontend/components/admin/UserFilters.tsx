import React from 'react';
import { Search, List, Network } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SectorSelect } from '@/components/shared/SectorSelect';
import { RoleSelect } from '@/components/shared/RoleSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sectorFilter: string;
  onSectorFilterChange: (sectorId: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  viewMode: 'list' | 'hierarchy';
  onViewModeChange: (mode: 'list' | 'hierarchy') => void;
}

export function UserFilters({
  searchQuery,
  onSearchChange,
  sectorFilter,
  onSectorFilterChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-8 w-full"
        />
      </div>

      {/* Setor */}
      <SectorSelect
        value={sectorFilter}
        onValueChange={onSectorFilterChange}
        allOption={{ value: 'all', label: 'Todos os setores' }}
        className="w-full sm:w-[180px]"
      />

      {/* Role */}
      <RoleSelect
        value={roleFilter}
        onValueChange={onRoleFilterChange}
        allOption={{ value: 'all', label: 'Todos' }}
        className="w-full sm:w-[160px]"
      />

      {/* Status */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Ativo</SelectItem>
          <SelectItem value="inactive">Inativo</SelectItem>
        </SelectContent>
      </Select>

      {/* View mode toggle */}
      <div className="flex rounded-md border overflow-hidden w-full sm:w-auto">
        <Button
          type="button"
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1 sm:flex-none rounded-none border-0 gap-1.5"
          onClick={() => onViewModeChange('list')}
          aria-pressed={viewMode === 'list'}
        >
          <List className="h-4 w-4" />
          Lista
        </Button>
        <div className="w-px bg-border" />
        <Button
          type="button"
          variant={viewMode === 'hierarchy' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1 sm:flex-none rounded-none border-0 gap-1.5"
          onClick={() => onViewModeChange('hierarchy')}
          aria-pressed={viewMode === 'hierarchy'}
        >
          <Network className="h-4 w-4" />
          Por Gestor
        </Button>
      </div>
    </div>
  );
}
