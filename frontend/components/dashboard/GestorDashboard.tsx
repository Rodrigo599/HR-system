import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PendingActions } from '@/components/dashboard/PendingActions';
import { BirthdayAlerts } from '@/components/dashboard/BirthdayAlerts';
import { QuickActions } from './QuickActions';
import { KpiSummaryChart } from '@/components/dashboard/KpiSummaryChart';
import { PdiProgressChart } from '@/components/dashboard/PdiProgressChart';
import { useKpis, useKpiResults } from '@/hooks/api/useKpis';
import { useTeam } from '@/hooks/api/useUsers';
import { usePdis } from '@/hooks/api/usePdi';
import { useEvaluations } from '@/hooks/api/useEvaluations';

export function GestorDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: teamMembers = [], isLoading: teamLoading } = useTeam();
  const { data: pdis = [], isLoading: pdisLoading } = usePdis();
  const { data: evaluations = [], isLoading: evalsLoading } = useEvaluations();
  const { data: kpis = [], isLoading: kpisLoading } = useKpis();
  const { data: kpiResults = [] } = useKpiResults();

  const teamPdiTasks = pdis.flatMap(p => p.tasks ?? []);
  const teamEvaluations = evaluations;
  const pendingTaskReviews = teamPdiTasks.filter(t => t.status === 'submitted').length;
  const pendingEvaluations = teamEvaluations.filter(e => e.status === 'pending_manager').length;
  const loading = teamLoading || pdisLoading || evalsLoading || kpisLoading;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const firstName = user?.name?.split(' ')[0] ?? '';

  const pendingTasksCount = teamPdiTasks.filter((t) => t.status === 'pending').length;
  const completedEvalsCount = teamEvaluations.filter((e) => e.status === 'completed').length;
  const overdueTasksCount = teamPdiTasks.filter((task) => {
    if (task.status === 'approved' || !task.due_date) return false;
    return new Date(task.due_date) < new Date();
  }).length;
  const collaboratorsWithoutEval = teamMembers.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <h1 className="text-2xl font-bold">
        {t('welcomeBack')}, {firstName}!
      </h1>

      <BirthdayAlerts />

      {/* Acoes Rapidas */}
      <QuickActions
        pendingReviews={pendingTaskReviews}
        pendingEvaluations={pendingEvaluations}
      />

      {/* Ações Pendentes */}
      <PendingActions
        pendingTaskReviews={pendingTaskReviews}
        pendingEvaluations={pendingEvaluations}
        collaboratorsWithoutEval={collaboratorsWithoutEval}
        overdueTasksCount={overdueTasksCount}
      />

      {/* Resumo do Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
            {t('teamOverview')}
          </CardTitle>
          <CardDescription>{t('overview')}</CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noTeamMembers')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div
                className="cursor-pointer rounded-md p-3 hover:bg-accent transition-colors"
                onClick={() => navigate('/admin')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/admin')}
              >
                <div className="text-3xl font-bold">{teamMembers.length}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('teamMembers')}</p>
              </div>
              <div
                className="cursor-pointer rounded-md p-3 hover:bg-accent transition-colors"
                onClick={() => navigate('/pdi')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/pdi')}
              >
                <div className="text-3xl font-bold">{pendingTasksCount}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('pendingTasksCount')}</p>
              </div>
              <div
                className="cursor-pointer rounded-md p-3 hover:bg-accent transition-colors"
                onClick={() => navigate('/evaluations')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/evaluations')}
              >
                <div className="text-3xl font-bold">{completedEvalsCount}</div>
                <p className="text-sm text-muted-foreground mt-1">{t('evalsCompletedMonth')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      {teamMembers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KpiSummaryChart
            results={kpiResults}
            kpis={kpis}
            month={currentMonth}
            year={currentYear}
          />
          <PdiProgressChart
            tasks={teamPdiTasks}
            month={currentMonth}
            year={currentYear}
          />
        </div>
      )}
    </div>
  );
}
