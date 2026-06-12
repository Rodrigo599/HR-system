import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { KpiResult, Kpi } from '@/types/api';

interface KpiEvolutionChartProps {
  results: KpiResult[];
  kpis: Kpi[];
  months: number;
}

const KPI_COLORS = [
  'hsl(var(--primary))',
  'hsl(210 100% 50%)',
  'hsl(150 100% 40%)',
  'hsl(45 100% 50%)',
  'hsl(280 100% 50%)',
  'hsl(0 100% 50%)',
];

export function KpiEvolutionChart({ results, kpis, months = 6 }: KpiEvolutionChartProps) {
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

    const point: Record<string, string | number | null> = { name: getMonthName(m).slice(0, 3) };

    kpis.forEach(kpi => {
      const monthResult = results.find(r => r.kpi_id === kpi.id && r.month === m && r.year === y);
      point[kpi.name] = monthResult ? Number(monthResult.score) : null;
    });

    chartData.push(point);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('kpiEvolution')}</CardTitle>
        <CardDescription>{t('kpiLast6Months')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 15) + '...' : v}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {kpis.map((kpi, index) => (
              <Line
                key={kpi.id}
                type="monotone"
                dataKey={kpi.name}
                stroke={KPI_COLORS[index % KPI_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
