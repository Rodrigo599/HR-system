import React from 'react';
import { Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProfileEntry {
  profile: any;
  roles: string[];
  teamSize: number;
}

interface HierarchyViewProps {
  profiles: ProfileEntry[];
  onEditUser: (profile: any) => void;
}

function roleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (role === 'admin') return 'destructive';
  if (role === 'gestor') return 'default';
  return 'secondary';
}

function primaryRole(roles: string[]): string {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('gestor')) return 'gestor';
  return 'colaborador';
}

function roleLabel(role: string): string {
  if (role === 'admin') return 'Admin';
  if (role === 'gestor') return 'Gestor';
  return 'Colaborador';
}

interface UserRowProps {
  entry: ProfileEntry;
  onEdit: (profile: any) => void;
  indent?: boolean;
}

function UserRow({ entry, onEdit, indent = false }: UserRowProps) {
  const role = primaryRole(entry.roles);

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors ${
        indent ? 'ml-6 border-l-2 border-muted pl-4' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-none truncate">
            {entry.profile.full_name}
          </p>
          {entry.profile.email && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {entry.profile.email}
            </p>
          )}
        </div>
        <Badge variant={roleBadgeVariant(role)} className="shrink-0">
          {roleLabel(role)}
        </Badge>
        {!entry.profile.active && (
          <Badge variant="outline" className="shrink-0 text-muted-foreground">
            Inativo
          </Badge>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 ml-2"
        onClick={() => onEdit(entry.profile)}
        aria-label={`Editar ${entry.profile.full_name}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function HierarchyView({ profiles, onEditUser }: HierarchyViewProps) {
  // Separate gestores (by role) and colaboradores
  const gestorEntries = profiles.filter(e =>
    e.roles.includes('gestor') || e.roles.includes('admin')
  );

  // Build a map: gestor profile.id -> their direct reports
  const reportsByManagerId: Record<string, ProfileEntry[]> = {};

  profiles.forEach(entry => {
    const managerId = entry.profile.manager_id;
    if (managerId) {
      if (!reportsByManagerId[managerId]) {
        reportsByManagerId[managerId] = [];
      }
      reportsByManagerId[managerId].push(entry);
    }
  });

  // Group gestores by sector
  const sectorMap: Record<string, { sectorName: string; gestores: ProfileEntry[] }> = {};

  gestorEntries.forEach(entry => {
    const sectorId = entry.profile.sector_id ?? '__no_sector__';
    const sectorName =
      entry.profile.sector?.name ?? (sectorId === '__no_sector__' ? 'Sem setor' : sectorId);

    if (!sectorMap[sectorId]) {
      sectorMap[sectorId] = { sectorName, gestores: [] };
    }
    sectorMap[sectorId].gestores.push(entry);
  });

  // Users without any manager_id and not a gestor/admin themselves
  const withoutManager = profiles.filter(entry => {
    const isManagerRole =
      entry.roles.includes('gestor') || entry.roles.includes('admin');
    return !entry.profile.manager_id && !isManagerRole;
  });

  const sortedSectorIds = Object.keys(sectorMap).sort((a, b) => {
    const nameA = sectorMap[a].sectorName;
    const nameB = sectorMap[b].sectorName;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-4">
      {sortedSectorIds.map(sectorId => {
        const { sectorName, gestores } = sectorMap[sectorId];

        return (
          <Card key={sectorId}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {sectorName}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {gestores.map(gestorEntry => {
                const reports = reportsByManagerId[gestorEntry.profile.id] ?? [];

                return (
                  <div key={gestorEntry.profile.id}>
                    {/* Gestor row */}
                    <UserRow entry={gestorEntry} onEdit={onEditUser} />

                    {/* Direct reports */}
                    {reports.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {reports.map(report => (
                          <UserRow
                            key={report.profile.id}
                            entry={report}
                            onEdit={onEditUser}
                            indent
                          />
                        ))}
                      </div>
                    )}

                    {reports.length === 0 && (
                      <p className="ml-6 mt-1 text-xs text-muted-foreground italic">
                        Nenhum colaborador atribuido
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Users without a manager */}
      {withoutManager.length > 0 && (
        <Card className="border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">
              Sem Gestor Atribuido
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-0.5">
            {withoutManager.map(entry => (
              <UserRow key={entry.profile.id} entry={entry} onEdit={onEditUser} />
            ))}
          </CardContent>
        </Card>
      )}

      {profiles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum usuario encontrado.
        </p>
      )}
    </div>
  );
}
