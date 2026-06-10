import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, History as HistoryIcon, Download } from 'lucide-react';
import { useEvaluations } from '@/hooks/api/useEvaluations';
import type { Evaluation } from '@/types/api';

export default function History() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  const query = useEvaluations();
  const evaluations: Evaluation[] = query.data ?? [];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  const filtered = evaluations.filter(e => {
    const matchType = filterType === 'all' || e.type === filterType;
    const matchYear = e.period?.startsWith(filterYear);
    return matchType && matchYear;
  });


  const exportCSV = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map(e => [e.type, e.period, e.status].join(','));
    const csv = ['tipo,periodo,status', ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-avaliacoes-${filterYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (query.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('evaluationHistory')}</h1>
        <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0} className="flex items-center gap-2">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('year')} /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t('type')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="cultural">{t('cultural')}</SelectItem>
            <SelectItem value="performance">{t('performance')}</SelectItem>
            <SelectItem value="kpi">KPI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{t('noHistory')}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <Card key={e.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/evaluations')}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{e.type}</CardTitle>
                    <p className="text-sm text-muted-foreground">{e.period}</p>
                  </div>
                </div>
                <StatusBadge status={e.status} domain="evaluation" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
