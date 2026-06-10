import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PdiTask } from '@/types/api';
import { CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PdiProgressChartProps {
  tasks: PdiTask[];
  month: number;
  year: number;
}

export function PdiProgressChart({ tasks, month, year }: PdiProgressChartProps) {
  const { t } = useLanguage();

  const getMonthName = (m: number) => {
    const months = [
      t('january'), t('february'), t('march'), t('april'),
      t('may'), t('june'), t('july'), t('august'),
      t('september'), t('october'), t('november'), t('december'),
    ];
    return months[m - 1] || '';
  };

  const completedTasks = tasks.filter(task => task.status === 'approved').length;
  const pendingTasks = tasks.filter(task => task.status !== 'approved').length;

  const now = new Date();
  const overdueTasks = tasks.filter(task => {
    if (task.status === 'approved' || !task.due_date) return false;
    return new Date(task.due_date) < now;
  }).length;

  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const COLORS = ['hsl(150 100% 40%)', 'hsl(45 100% 50%)', 'hsl(0 100% 50%)'];
  const pieData = [
    { name: t('completedTasks'), value: completedTasks },
    { name: t('pendingTasks'), value: Math.max(0, pendingTasks - overdueTasks) },
    { name: t('overdueTasks'), value: overdueTasks },
  ].filter(d => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pdiProgress')}</CardTitle>
        <CardDescription>{t('pdiProgressDescription')} - {getMonthName(month)} {year}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Progress value={progressPercentage} className="flex-1" />
          <span className="text-sm font-medium">{progressPercentage}%</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-lg font-bold">{completedTasks}</span>
            <span className="text-xs text-muted-foreground">{t('completedTasks')}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Circle className="h-5 w-5 text-yellow-500" />
            <span className="text-lg font-bold">{pendingTasks - overdueTasks}</span>
            <span className="text-xs text-muted-foreground">{t('pendingTasks')}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-lg font-bold">{overdueTasks}</span>
            <span className="text-xs text-muted-foreground">{t('overdueTasks')}</span>
          </div>
        </div>
        {pieData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
