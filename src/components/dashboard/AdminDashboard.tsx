import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Building2,
  UserX,
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { FirstAccessChecklist } from '../admin/FirstAccessChecklist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Severity color helpers
function severityBadgeVariant(severity: 'critical' | 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'critical':
      return 'destructive' as const;
    case 'high':
      return 'destructive' as const;
    case 'medium':
      return 'secondary' as const;
    case 'low':
      return 'outline' as const;
  }
}

function severityLabel(severity: 'critical' | 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'critical':
      return 'Critico';
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Médio';
    case 'low':
      return 'Baixo';
  }
}

function severityIcon(severity: 'critical' | 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />;
    case 'medium':
      return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    case 'low':
      return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  }
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { stats, health, alerts, managerOverview, loading } = useAdminDashboard();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const evalsPercent =
    health.evalsTotal > 0 ? Math.round((health.evalsCompleted / health.evalsTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <h1 className="text-2xl font-bold">
        {t('welcomeBack')}, {profile?.full_name?.split(' ')[0]}!
      </h1>

      {/* Checklist de primeiro acesso */}
      <FirstAccessChecklist
        sectorsCount={stats.sectors}
        usersCount={stats.activeUsers}
        formsCount={0}
        evaluationsCount={health.evalsTotal}
      />

      {/* Numeros Gerais — 4 cards clicaveis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">usuarios ativos</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gestores</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.gestores}</div>
            <p className="text-xs text-muted-foreground mt-1">gestores cadastrados</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Setores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sectors}</div>
            <p className="text-xs text-muted-foreground mt-1">setores criados</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativos</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inactiveUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">usuarios inativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Saúde da Operação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Saúde da Operação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avaliações */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avaliações concluídas</span>
              <span className="font-medium">
                {health.evalsCompleted}/{health.evalsTotal}{' '}
                <span className="text-muted-foreground">({evalsPercent}%)</span>
              </span>
            </div>
            <Progress value={evalsPercent} className="h-2" />
          </div>

          {/* PDIs ativos */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">PDIs ativos</span>
            <span className="font-medium">{health.pdisActive}</span>
          </div>

          {/* Tasks aguardando aprovação */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tasks aguardando aprovação</span>
            <span
              className={
                health.tasksPending > 5
                  ? 'font-semibold text-red-600'
                  : 'font-medium'
              }
            >
              {health.tasksPending}
              {health.tasksPending > 5 && (
                <span className="ml-1 text-xs text-red-500">(atencao)</span>
              )}
            </span>
          </div>

          {/* KPI médio */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">KPI médio geral</span>
            <span className="font-medium">{health.avgKpi}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Admin */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Alertas</CardTitle>
              <Badge variant="destructive" className="ml-auto text-xs">
                {alerts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  alert.actionUrl
                    ? 'cursor-pointer hover:bg-accent transition-colors'
                    : ''
                }`}
                onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                role={alert.actionUrl ? 'button' : undefined}
                tabIndex={alert.actionUrl ? 0 : undefined}
                onKeyDown={(e) =>
                  e.key === 'Enter' && alert.actionUrl && navigate(alert.actionUrl)
                }
              >
                {severityIcon(alert.severity)}
                <span className="flex-1">{alert.message}</span>
                <Badge
                  variant={severityBadgeVariant(alert.severity)}
                  className="text-xs shrink-0"
                >
                  {severityLabel(alert.severity)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Visao por Gestor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Visao por Gestor</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gestor</TableHead>
                <TableHead className="text-center">Time</TableHead>
                <TableHead className="text-center">PDIs ativos</TableHead>
                <TableHead className="text-center">Tasks pend.</TableHead>
                <TableHead className="text-center">Avaliações</TableHead>
                <TableHead className="text-center">KPI médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerOverview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Nenhum gestor cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                managerOverview.map((item) => {
                  const evalsRatio =
                    item.evalsTotal > 0
                      ? Math.round((item.evalsCompleted / item.evalsTotal) * 100)
                      : null;

                  return (
                    <TableRow key={item.manager.id}>
                      {/* Gestor name — bold, drill-down placeholder */}
                      <TableCell>
                        <span className="font-semibold">{item.manager.full_name}</span>
                        {item.manager.sector && (
                          <span className="block text-xs text-muted-foreground">
                            {(item.manager.sector as { name?: string }).name ?? ''}
                          </span>
                        )}
                      </TableCell>

                      {/* Tamanho do time */}
                      <TableCell className="text-center">{item.teamSize}</TableCell>

                      {/* PDIs ativos */}
                      <TableCell className="text-center">{item.pdisActive}</TableCell>

                      {/* Tasks pendentes — red if > 3 */}
                      <TableCell className="text-center">
                        <span
                          className={
                            item.tasksPendingApproval > 3
                              ? 'font-semibold text-red-600'
                              : ''
                          }
                        >
                          {item.tasksPendingApproval}
                        </span>
                      </TableCell>

                      {/* Avaliações — yellow if ratio < 70% */}
                      <TableCell className="text-center">
                        <span
                          className={
                            evalsRatio !== null && evalsRatio < 70
                              ? 'font-semibold text-yellow-600'
                              : ''
                          }
                        >
                          {item.evalsCompleted}/{item.evalsTotal}
                          {evalsRatio !== null && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({evalsRatio}%)
                            </span>
                          )}
                        </span>
                      </TableCell>

                      {/* KPI médio — green if > 90% */}
                      <TableCell className="text-center">
                        <span
                          className={
                            item.avgKpi > 90
                              ? 'font-semibold text-green-600'
                              : ''
                          }
                        >
                          {item.avgKpi}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* Linha "SEM GESTOR" se houver colaboradores sem gestor */}
              {alerts.some((a) => a.type === 'no_manager') && (
                <TableRow className="bg-muted/40">
                  <TableCell colSpan={6}>
                    <span className="text-sm text-muted-foreground italic">
                      SEM GESTOR — há colaboradores sem gestor atribuído. Ver Alertas acima.
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
