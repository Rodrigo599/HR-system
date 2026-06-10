import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Evaluation } from '@/types/api';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ============================================================
// Props — recebe dados já formatados (mesmo padrão do EvaluationRadarChart)
// A computação topic → média fica no componente pai
// ============================================================

interface EvaluationSummaryChartProps {
  evaluations: Evaluation[];
  chartData: Array<{ topic: string; autoavaliacao: number; gestor: number }>;
  month: number;
  year: number;
}

export function EvaluationSummaryChart({ evaluations, chartData, month, year }: EvaluationSummaryChartProps) {
  const { t } = useLanguage();

  const getMonthName = (m: number) => {
    const months = [
      t('january'), t('february'), t('march'), t('april'),
      t('may'), t('june'), t('july'), t('august'),
      t('september'), t('october'), t('november'), t('december'),
    ];
    return months[m - 1] || '';
  };

  const statusCounts = {
    pending_self: evaluations.filter(e => e.status === 'pending_self').length,
    pending_manager: evaluations.filter(e => e.status === 'pending_manager').length,
    completed: evaluations.filter(e => e.status === 'completed').length,
    closed: evaluations.filter(e => e.status === 'closed').length,
  };

  const hasData = chartData.some(d => d.autoavaliacao > 0 || d.gestor > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('evaluationSummary')}</CardTitle>
        <CardDescription>{t('evaluationSummaryDescription')} - {getMonthName(month)} {year}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {t('pendingSelf')}: {statusCounts.pending_self}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {t('pendingManager')}: {statusCounts.pending_manager}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> {t('completed')}: {statusCounts.completed}
          </Badge>
        </div>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="topic" className="text-xs" />
              <PolarRadiusAxis angle={30} domain={[0, 5]} />
              <Radar name={t('selfScore')} dataKey="autoavaliacao" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              <Radar name={t('managerScore')} dataKey="gestor" stroke="hsl(210 100% 50%)" fill="hsl(210 100% 50%)" fillOpacity={0.2} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">{t('noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
