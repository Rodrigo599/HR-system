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
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { KpiResult, Kpi } from '@/types/database';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiSummaryChartProps {
  results: KpiResult[];
  kpis: Kpi[];
  month: number;
  year: number;
}

export function KpiSummaryChart({ results, kpis, month, year }: KpiSummaryChartProps) {
  const { t } = useLanguage();

  const getMonthName = (m: number) => {
    const months = [
      t('january'), t('february'), t('march'), t('april'),
      t('may'), t('june'), t('july'), t('august'),
      t('september'), t('october'), t('november'), t('december'),
    ];
    return months[m - 1] || '';
  };

  const currentResults = results.filter(r => r.month === month && r.year === year);

  const chartData = kpis.map(kpi => {
    const result = currentResults.find(r => r.kpi_id === kpi.id);
    const score = result ? result.score : 0;
    const achievement = kpi.target_value > 0 ? (score / kpi.target_value) * 100 : 0;
    return {
      name: kpi.name,
      score,
      target: kpi.target_value,
      achievement: Math.round(achievement),
    };
  });

  const getBarColor = (achievement: number) => {
    if (achievement >= 100) return 'hsl(150 100% 40%)';
    if (achievement >= 70) return 'hsl(45 100% 50%)';
    return 'hsl(0 100% 50%)';
  };

  const getTrendIcon = (achievement: number) => {
    if (achievement >= 100) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (achievement >= 70) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('kpiSummary')}</CardTitle>
        <CardDescription>{t('kpiSummaryDescription')} - {getMonthName(month)} {year}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.achievement)} />
              ))}
            </Bar>
            <ReferenceLine y={0} stroke="#000" />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              {getTrendIcon(item.achievement)}
              <span className="truncate">{item.name}: {item.achievement}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
