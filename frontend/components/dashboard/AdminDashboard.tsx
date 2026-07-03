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
import { useUsers } from '@/hooks/api/useUsers';
import { useSectors } from '@/hooks/api/useSectors';
import { useEvaluations } from '@/hooks/api/useEvaluations';
import { usePdis } from '@/hooks/api/usePdi';
import { useKpiResults } from '@/hooks/api/useKpis';
import { useSmartForms } from '@/hooks/api/useSmartForms';

type Severity = 'critical' | 'high' | 'medium' | 'low';

function severityBadgeVariant(severity: Severity) {
  if (severity === 'critical' || severity === 'high') return 'destructive' as const;
  if (severity === 'medium') return 'secondary' as const;
  return 'outline' as const;
}

function severityLabel(severity: Severity, t: (key: string) => string) {
  const map: Record<Severity, string> = {
    critical: t('severityCritical'),
    high: t('severityHigh'),
    medium: t('severityMedium'),
    low: t('severityLow'),
  };
  return map[severity];
}

function severityIcon(severity: Severity) {
  if (severity === 'critical') return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
  if (severity === 'high') return <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />;
  if (severity === 'medium') return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
  return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: sectors = [], isLoading: sectorsLoading } = useSectors();
  const { data: evaluations = [], isLoading: evalsLoading } = useEvaluations();
  const { data: pdis = [], isLoading: pdisLoading } = usePdis();
  const { data: kpiResults = [], isLoading: kpiLoading } = useKpiResults();
  const { data: smartForms = [], isLoading: formsLoading } = useSmartForms();

  const loading = usersLoading || sectorsLoading || evalsLoading || pdisLoading || kpiLoading || formsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ---- Stats ----
  const activeUsers = users.filter(u => u.roles.length > 0).length;
  const gestores = users.filter(u => u.roles.includes('gestor')).length;
  const admins = users.filter(u => u.roles.includes('admin')).length;

  // ---- Health ----
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const evalsThisMonth = evaluations.filter(
    e => {
      const d = new Date(e.created_at);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    }
  );
  const evalsCompleted = evalsThisMonth.filter(e => e.status === 'completed').length;
  const evalsTotal = evalsThisMonth.length;
  const evalsPercent = evalsTotal > 0 ? Math.round((evalsCompleted / evalsTotal) * 100) : 0;

  const allTasks = pdis.flatMap(p => p.tasks ?? []);
  const tasksPending = allTasks.filter(t => t.status === 'submitted').length;
  // Pdi não tem campo `status`; "ativo" = tem ao menos uma tarefa não concluída.
  const pdisActive = pdis.filter(p => (p.tasks ?? []).some(t => !t.completed)).length;

  const kpiScores = kpiResults
    .filter(r => r.month === currentMonth && r.year === currentYear)
    .map(r => Number(r.score));
  const avgKpi = kpiScores.length > 0
    ? Math.round((kpiScores.reduce((a, b) => a + b, 0) / kpiScores.length) * 10) / 10
    : 0;

  // ---- Alertas gerados localmente a partir dos dados ----
  const alerts: Array<{ type: string; message: string; severity: Severity; actionUrl?: string }> = [];

  const usersWithoutManager = users.filter(
    u => !u.roles.includes('admin') && !u.profile?.manager_id
  );
  if (usersWithoutManager.length > 0) {
    alerts.push({
      type: 'no_manager',
      message: t('alertNoManager', { count: usersWithoutManager.length }),
      severity: 'high',
      actionUrl: '/admin',
    });
  }

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const escalated = allTasks.filter(
    task => task.status === 'submitted' && task.due_date && new Date(task.due_date) < tenDaysAgo
  ).length;
  if (escalated > 0) {
    alerts.push({
      type: 'task_escalated',
      message: t('alertTaskEscalated', { count: escalated }),
      severity: 'critical',
      actionUrl: '/pdi',
    });
  }

  const evalsPending = evalsThisMonth.filter(
    e => e.status === 'pending_self' || e.status === 'pending_manager'
  ).length;
  if (evalsPending > 0) {
    alerts.push({
      type: 'eval_pending',
      message: t('alertEvalPending', { count: evalsPending }),
      severity: 'medium',
      actionUrl: '/evaluations',
    });
  }

  // ---- Visão por gestor ----
  const gestorUsers = users.filter(u => u.roles.includes('gestor'));
  const managerOverview = gestorUsers.map(gestor => {
    const teamSize = users.filter(u => u.profile?.manager_id === gestor.id).length;
    const teamUserIds = users.filter(u => u.profile?.manager_id === gestor.id).map(u => u.id);
    const teamPdis = pdis.filter(p => teamUserIds.includes(p.user_id));
    const teamTasks = teamPdis.flatMap(p => p.tasks ?? []);
    const teamEvals = evaluations.filter(e => e.assignee && teamUserIds.includes(e.assignee.id));
    const teamKpiScores = kpiResults
      .filter(r => teamUserIds.includes(r.user_id) && r.month === currentMonth && r.year === currentYear)
      .map(r => Number(r.score));

    return {
      gestor,
      teamSize,
      pdisActive: teamPdis.filter(p => (p.tasks ?? []).some(t => !t.completed)).length,
      tasksPendingApproval: teamTasks.filter(t => t.status === 'submitted').length,
      evalsCompleted: teamEvals.filter(e => e.status === 'completed').length,
      evalsTotal: teamEvals.length,
      avgKpi: teamKpiScores.length > 0
        ? Math.round((teamKpiScores.reduce((a, b) => a + b, 0) / teamKpiScores.length) * 10) / 10
        : 0,
    };
  });

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('welcomeBack')}, {firstName}!</h1>

      <FirstAccessChecklist
        sectorsCount={sectors.length}
        usersCount={activeUsers}
        formsCount={smartForms.length}
        evaluationsCount={evalsTotal}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/admin')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('statActiveUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('statActiveUsersDesc')}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/admin')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('statManagers')}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gestores}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('statManagersDesc')}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/admin')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('statSectors')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sectors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('statSectorsDesc')}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/admin')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('statAdmins')}</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{admins}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('statAdminsDesc')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('operationHealth')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('evalsCompleted')}</span>
              <span className="font-medium">
                {evalsCompleted}/{evalsTotal}{' '}
                <span className="text-muted-foreground">({evalsPercent}%)</span>
              </span>
            </div>
            <Progress value={evalsPercent} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('activePdis')}</span>
            <span className="font-medium">{pdisActive}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tasksAwaitingApprovalAdmin')}</span>
            <span className={tasksPending > 5 ? 'font-semibold text-red-600' : 'font-medium'}>
              {tasksPending}
              {tasksPending > 5 && <span className="ml-1 text-xs text-red-500">{t('attentionFlag')}</span>}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('avgKpiGeneral')}</span>
            <span className="font-medium">{avgKpi}%</span>
          </div>
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">{t('adminAlerts')}</CardTitle>
              <Badge variant="destructive" className="ml-auto text-xs">{alerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  alert.actionUrl ? 'cursor-pointer hover:bg-accent transition-colors' : ''
                }`}
                onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                role={alert.actionUrl ? 'button' : undefined}
                tabIndex={alert.actionUrl ? 0 : undefined}
                onKeyDown={(e) => e.key === 'Enter' && alert.actionUrl && navigate(alert.actionUrl)}
              >
                {severityIcon(alert.severity)}
                <span className="flex-1">{alert.message}</span>
                <Badge variant={severityBadgeVariant(alert.severity)} className="text-xs shrink-0">
                  {severityLabel(alert.severity, t)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('managerView')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaderManager')}</TableHead>
                <TableHead className="text-center">{t('tableHeaderTeam')}</TableHead>
                <TableHead className="text-center">{t('tableHeaderActivePdis')}</TableHead>
                <TableHead className="text-center">{t('tableHeaderPendingTasks')}</TableHead>
                <TableHead className="text-center">{t('tableHeaderEvaluations')}</TableHead>
                <TableHead className="text-center">{t('tableHeaderAvgKpi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerOverview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    {t('noManagersYet')}
                  </TableCell>
                </TableRow>
              ) : (
                managerOverview.map((item) => {
                  const evalsRatio = item.evalsTotal > 0
                    ? Math.round((item.evalsCompleted / item.evalsTotal) * 100)
                    : null;
                  return (
                    <TableRow key={item.gestor.id}>
                      <TableCell>
                        <span className="font-semibold">{item.gestor.name}</span>
                        {item.gestor.profile?.sector && (
                          <span className="block text-xs text-muted-foreground">
                            {(item.gestor.profile.sector as { name?: string }).name ?? ''}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{item.teamSize}</TableCell>
                      <TableCell className="text-center">{item.pdisActive}</TableCell>
                      <TableCell className="text-center">
                        <span className={item.tasksPendingApproval > 3 ? 'font-semibold text-red-600' : ''}>
                          {item.tasksPendingApproval}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={evalsRatio !== null && evalsRatio < 70 ? 'font-semibold text-yellow-600' : ''}>
                          {item.evalsCompleted}/{item.evalsTotal}
                          {evalsRatio !== null && (
                            <span className="ml-1 text-xs text-muted-foreground">({evalsRatio}%)</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={item.avgKpi > 90 ? 'font-semibold text-green-600' : ''}>
                          {item.avgKpi}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {alerts.some(a => a.type === 'no_manager') && (
                <TableRow className="bg-muted/40">
                  <TableCell colSpan={6}>
                    <span className="text-sm text-muted-foreground italic">
                      {t('noManagerWarning')}
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
