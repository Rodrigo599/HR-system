import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { KpiEvolutionChart } from '@/components/kpis/KpiEvolutionChart';
import { KpiComparisonChart } from '@/components/kpis/KpiComparisonChart';
import { useKpis, useKpiResults, useUpsertKpiResult } from '@/hooks/api/useKpis';
import { MonthSelect } from '@/components/shared/MonthSelect';
import type { Kpi, KpiResult } from '@/types/api';

export default function KPIs() {
  const { isAdmin, isGestor } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const kpisQuery = useKpis();
  const resultsQuery = useKpiResults({ month: currentMonth, year: currentYear });
  const upsertMutation = useUpsertKpiResult();

  const kpis: Kpi[] = kpisQuery.data ?? [];
  const results: KpiResult[] = resultsQuery.data ?? [];
  const loading = kpisQuery.isLoading || resultsQuery.isLoading;

  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);
  const [registerScore, setRegisterScore] = useState('');
  const [registerScoreError, setRegisterScoreError] = useState('');
  const [registerMonth, setRegisterMonth] = useState(currentMonth);
  const [registerYear, setRegisterYear] = useState(currentYear);

  const getAchievement = (kpiId: string) => {
    const kpi = kpis.find(k => k.id === kpiId);
    const result = results.find(r => r.kpi_id === kpiId);
    if (!kpi || !result) return null;
    return Math.round((Number(result.score) / kpi.target_value) * 100);
  };

  const openRegisterDialog = (kpi: Kpi) => {
    setSelectedKpi(kpi);
    setRegisterScore('');
    setRegisterScoreError('');
    setRegisterMonth(currentMonth);
    setRegisterYear(currentYear);
    setRegisterOpen(true);
  };

  const handleRegisterResult = async () => {
    if (!selectedKpi) return;
    const scoreNum = Number(registerScore);
    if (registerScore === '' || isNaN(scoreNum)) {
      setRegisterScoreError('Informe um valor numérico válido');
      return;
    }
    try {
      await upsertMutation.mutateAsync({ kpi_id: selectedKpi.id, score: scoreNum, month: registerMonth, year: registerYear });
      toast({ title: t('resultRegistered') });
      setRegisterOpen(false);
    } catch {
      toast({ title: t('error'), variant: 'destructive' });
    }
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
        <h1 className="text-2xl font-bold">{t('kpis')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => {
          const achievement = getAchievement(kpi.id);
          const currentResult = results.find(r => r.kpi_id === kpi.id);
          return (
            <Card key={kpi.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                {(isAdmin || isGestor) && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openRegisterDialog(kpi)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-1">Último registro</div>
                <div className="text-2xl font-bold">{currentResult?.score ?? '-'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{t('target')}: {kpi.target_value}{kpi.unit ? ` ${kpi.unit}` : ''}</span>
                  {achievement !== null && (
                    <Badge variant={achievement >= 100 ? 'default' : achievement >= 70 ? 'secondary' : 'destructive'} className="text-xs">
                      {achievement >= 100 && <TrendingUp className="h-3 w-3 mr-1" />}
                      {achievement >= 70 && achievement < 100 && <Minus className="h-3 w-3 mr-1" />}
                      {achievement < 70 && <TrendingDown className="h-3 w-3 mr-1" />}
                      {achievement}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KpiEvolutionChart results={results} kpis={kpis} months={6} />
        <KpiComparisonChart results={results} kpis={kpis} currentMonth={currentMonth} currentYear={currentYear} />
      </div>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('registerKpiResult')} — {selectedKpi?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('scoreValue')}</Label>
              <Input
                type="number"
                value={registerScore}
                onChange={(e) => { setRegisterScore(e.target.value); setRegisterScoreError(''); }}
                placeholder="0"
              />
              {registerScoreError && <p className="text-xs text-destructive">{registerScoreError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('month')}</Label>
                <MonthSelect value={String(registerMonth)} onValueChange={v => setRegisterMonth(Number(v))} />
              </div>
              <div className="space-y-2">
                <Label>{t('year')}</Label>
                <Input type="number" value={registerYear} onChange={(e) => setRegisterYear(Number(e.target.value))} min={2020} max={2030} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRegisterOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleRegisterResult} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
