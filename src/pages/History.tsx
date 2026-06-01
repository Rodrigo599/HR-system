import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, History as HistoryIcon, Download } from 'lucide-react';
import { Evaluation } from '@/types/database';
import { useEvaluationsByYear } from '@/services/evaluationService';

export default function History() {
  const { profile, isAdmin, isGestor } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));

  const query = useEvaluationsByYear(parseInt(filterYear), profile?.user_id ?? '', isAdmin, isGestor, !!profile);
  const evaluations = query.data ?? [];
  const loading = query.isLoading;

  const getMonthName = (m: number) => {
    const months = [
      t('january'), t('february'), t('march'), t('april'),
      t('may'), t('june'), t('july'), t('august'),
      t('september'), t('october'), t('november'), t('december'),
    ];
    return months[m - 1] || '';
  };

  const filteredEvaluations = filterType === 'all'
    ? evaluations
    : evaluations.filter(e => e.type === filterType);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending_self: 'outline',
      pending_manager: 'secondary',
      completed: 'default',
      closed: 'destructive',
    };
    const labels: Record<string, string> = {
      pending_self: t('pendingSelf'),
      pending_manager: t('pendingManager'),
      completed: t('completed'),
      closed: t('closed'),
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  const exportCSV = () => {
    if (filteredEvaluations.length === 0) return;
    const headers = [t('type'), t('month'), t('year'), t('status')];
    const rows = filteredEvaluations.map(e => [
      e.type, getMonthName(e.month), e.year, e.status,
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-avaliacoes-${filterYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('evaluationHistory')}</h1>
        <Button variant="outline" onClick={exportCSV} disabled={filteredEvaluations.length === 0} className="flex items-center gap-2">
          <Download className="h-4 w-4" /> {t('export')} CSV
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('year')} />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="cultural">{t('cultural')}</SelectItem>
            <SelectItem value="performance">{t('performance')}</SelectItem>
            <SelectItem value="kpi">{t('kpiType')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredEvaluations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">{t('noHistory')}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvaluations.map(evaluation => (
            <Card
              key={evaluation.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/evaluations')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/evaluations'); }}
            >
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{t(evaluation.type as any)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getMonthName(evaluation.month)} {evaluation.year}</p>
                    {/* A-08: nome do avaliado quando disponivel (via join assignee) */}
                    {(isAdmin || isGestor) && evaluation.assignee?.full_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{evaluation.assignee.full_name}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(evaluation.status)}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
