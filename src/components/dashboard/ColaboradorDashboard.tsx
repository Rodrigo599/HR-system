import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ClipboardList, BookOpen, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiSummaryChart } from '@/components/dashboard/KpiSummaryChart';
import { EvaluationSummaryChart } from '@/components/dashboard/EvaluationSummaryChart';
import { PdiProgressChart } from '@/components/dashboard/PdiProgressChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { useKpis, useKpiResults, useKpiScope } from '@/services/kpiService';
import { useEvaluations, useEvaluationTopics } from '@/services/evaluationService';
import { useAllPdiTasks, useUserPdis } from '@/services/pdiService';
import { useAlerts } from '@/hooks/useAlerts';
import { DEMO_MODE } from '@/lib/demoMode';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mockResponses } from '@/lib/mockData';
import type { EvaluationResponse } from '@/types/database';

export function ColaboradorDashboard() {
  const { profile, isGestor, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const kpiScope = useKpiScope({
    profile: profile ? { id: profile.id, user_id: profile.user_id, sector_id: profile.sector_id ?? null } : null,
    isAdmin,
    isGestor,
    includeTeam: false,
  });
  const { data: kpis = [], isLoading: kpisLoading } = useKpis(kpiScope);
  const { data: kpiResults = [], isLoading: kpiResultsLoading } = useKpiResults(kpiScope);
  const { data: allEvaluations = [], isLoading: evaluationsLoading } = useEvaluations(
    profile ? { userId: profile.id, isAdmin, isGestor } : null
  );
  const { data: evaluationTopics = [], isLoading: topicsLoading } = useEvaluationTopics();
  const { data: pdiTasks = [], isLoading: pdiLoading } = useAllPdiTasks(profile?.user_id);
  const { data: pdis = [], isLoading: pdisLoading } = useUserPdis(profile?.user_id);

  const { data: evaluationResponses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['evaluation-responses', 'colab-dashboard', profile?.user_id, currentMonth, currentYear],
    queryFn: async () => {
      if (DEMO_MODE) return mockResponses;
      const { data, error } = await supabase
        .from('evaluation_responses')
        .select('*, topic:evaluation_topics(*)')
        .eq('user_id', profile!.user_id);
      if (error) throw error;
      return (data ?? []) as EvaluationResponse[];
    },
    enabled: !!profile,
  });

  const evaluations = allEvaluations.filter(
    e => e.month === currentMonth && e.year === currentYear
  );

  // Computar chartData para o EvaluationSummaryChart (media por topico)
  const evaluationChartData = evaluationTopics.map(topic => {
    const topicResponses = evaluationResponses.filter(r => r.topic_id === topic.id);
    const avgSelf = topicResponses.reduce((acc, r) => acc + (r.self_score || 0), 0) / (topicResponses.length || 1);
    const avgManager = topicResponses.reduce((acc, r) => acc + (r.manager_score || 0), 0) / (topicResponses.length || 1);
    return {
      topic: topic.name,
      autoavaliacao: Math.round(avgSelf * 10) / 10,
      gestor: Math.round(avgManager * 10) / 10,
    };
  });

  const loading = kpisLoading || kpiResultsLoading || evaluationsLoading || topicsLoading || pdiLoading || pdisLoading || responsesLoading;
  const alerts = useAlerts({ kpis, kpiResults, pdiTasks, pdis, month: currentMonth, year: currentYear });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const completedPdiTasks = pdiTasks.filter(t => t.completed).length;
  const pdiPct = pdiTasks.length > 0 ? Math.round((completedPdiTasks / pdiTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('welcomeBack')}, {profile?.full_name?.split(' ')[0]}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeAlerts')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{alerts.length}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KpiSummaryChart results={kpiResults} kpis={kpis} month={currentMonth} year={currentYear} />
        <EvaluationSummaryChart evaluations={evaluations} chartData={evaluationChartData} month={currentMonth} year={currentYear} />
        <PdiProgressChart tasks={pdiTasks} month={currentMonth} year={currentYear} />
      </div>

      {alerts.length > 0 && <AlertsPanel alerts={alerts} />}
    </div>
  );
}
