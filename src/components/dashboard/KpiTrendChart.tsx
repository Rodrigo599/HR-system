import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { KpiResult, Kpi } from '@/types/database';

interface KpiTrendChartProps {
  results: KpiResult[];
  kpis: Kpi[];
  months: number;
}

export function KpiTrendChart({ results, kpis, months = 6 }: KpiTrendChartProps) {
  const { t } = useLanguage();

  const getMonthName = (m: number) => {
    const monthNames = [
      t('january'), t('february'), t('march'), t('april'),
      t('may'), t('june'), t('july'), t('august'),
      t('september'), t('october'), t('november'), t('december'),
    ];
    return monthNames[m - 1] || '';
  };

  const now = new Date();
  const chartData = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const monthResults = results.filter(r => r.month === m && r.year === y);
    const avgScore = monthResults.length > 0
      ? monthResults.reduce((acc, r) => acc + r.score, 0) / monthResults.length
      : 0;

    chartData.push({
      name: getMonthName(m).slice(0, 3),
      media: Math.round(avgScore * 10) / 10,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('kpiTrend')}</CardTitle>
        <CardDescription>{t('kpiTrendDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="media"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
