import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ClipboardList, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiSummaryChart } from '@/components/dashboard/KpiSummaryChart';
import { PdiProgressChart } from '@/components/dashboard/PdiProgressChart';
import { useKpis, useKpiResults } from '@/hooks/api/useKpis';
import { useEvaluations } from '@/hooks/api/useEvaluations';
import { usePdis } from '@/hooks/api/usePdi';

export function ColaboradorDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: kpis = [], isLoading: kpisLoading } = useKpis();
  const { data: kpiResults = [], isLoading: kpiResultsLoading } = useKpiResults({ month: currentMonth, year: currentYear });
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();
  const { data: pdis = [], isLoading: pdisLoading } = usePdis();

  const pdiTasks = pdis.flatMap(p => p.tasks ?? []);
  const completedTasks = pdiTasks.filter(t => t.status === 'approved').length;
  const pdiPct = pdiTasks.length > 0 ? Math.round((completedTasks / pdiTasks.length) * 100) : 0;

  const loading = kpisLoading || kpiResultsLoading || evaluationsLoading || pdisLoading;

  const firstName = user?.name?.split(' ')[0] ?? '';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('welcomeBack')}, {firstName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/kpis')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalKpis')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.length}</div></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/evaluations')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalEvaluations')}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{evaluations.length}</div></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/pdi')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('pdiCompletion')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pdiPct}%</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KpiSummaryChart results={kpiResults} kpis={kpis} month={currentMonth} year={currentYear} />
        <PdiProgressChart tasks={pdiTasks} month={currentMonth} year={currentYear} />
      </div>
    </div>
  );
}
