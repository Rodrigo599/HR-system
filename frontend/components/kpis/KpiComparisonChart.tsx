import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { KpiResult, Kpi } from '@/types/api';

interface KpiComparisonChartProps {
  results: KpiResult[];
  kpis: Kpi[];
  currentMonth: number;
  currentYear: number;
}

export function KpiComparisonChart({ results, kpis, currentMonth, currentYear }: KpiComparisonChartProps) {
  const { t } = useLanguage();

  const getMonthName = (month: number) => {
    const months = [
      t('january'), t('february'), t('march'), t('april'),
      t('may'), t('june'), t('july'), t('august'),
      t('september'), t('october'), t('november'), t('december'),
    ];
    return months[month - 1] || '';
  };

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const chartData = kpis.map(kpi => {
    const currentResult = results.find(r => r.kpi_id === kpi.id && r.month === currentMonth && r.year === currentYear);
    const prevResult = results.find(r => r.kpi_id === kpi.id && r.month === prevMonth && r.year === prevYear);
    return {
      name: kpi.name,
      [getMonthName(currentMonth)]: currentResult ? Number(currentResult.score) : 0,
      [getMonthName(prevMonth)]: prevResult ? Number(prevResult.score) : 0,
      target: kpi.target_value,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('kpiComparison')}</CardTitle>
        <CardDescription>Ultimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 15) + '...' : v}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey={getMonthName(prevMonth)} fill="hsl(210 100% 70%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey={getMonthName(currentMonth)} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
