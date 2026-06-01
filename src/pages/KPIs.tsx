import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { Kpi, KpiResult } from '@/types/database';
import { KpiEvolutionChart } from '@/components/kpis/KpiEvolutionChart';
import { KpiComparisonChart } from '@/components/kpis/KpiComparisonChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { useAlerts } from '@/hooks/useAlerts';
import { DEMO_MODE } from '@/lib/demoMode';
import { useKpis, useKpiResults, useUpsertKpiResult, useKpiScope } from '@/services/kpiService';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useCollaborators, useDirectReportUserIds } from '@/services/profileService';
import { useSectors } from '@/services/adminService';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function KPIs() {
  const { profile, isAdmin, isGestor } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const { viewMode } = useViewMode();
  const scope = useKpiScope({
    profile: profile ? { id: profile.id, user_id: profile.user_id, sector_id: profile.sector_id ?? null } : null,
    isAdmin,
    isGestor,
    includeTeam: viewMode === 'team',
  });
  const kpisQuery = useKpis(scope);
  const resultsQuery = useKpiResults(scope);
  const upsertMutation = useUpsertKpiResult();

  const kpis: Kpi[] = kpisQuery.data ?? [];
  const hookResults: KpiResult[] = resultsQuery.data ?? [];
  const loading = kpisQuery.isLoading || resultsQuery.isLoading;

  // In DEMO_MODE the queryClient won't receive real-time updates after local mutations,
  // so we keep a local results override that starts from the hook data.
  const [localResults, setLocalResults] = useState<KpiResult[]>([]);

  useEffect(() => {
    if (DEMO_MODE && hookResults.length > 0 && localResults.length === 0) {
      setLocalResults(hookResults);
    }
  }, [hookResults]);

  const results: KpiResult[] = DEMO_MODE ? localResults : hookResults;

  // Register result dialog state
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);
  const [registerScore, setRegisterScore] = useState('');
  const [registerScoreError, setRegisterScoreError] = useState('');
  const [registerMonth, setRegisterMonth] = useState(new Date().getMonth() + 1);
  const [registerYear, setRegisterYear] = useState(new Date().getFullYear());
  // Onda 2 / Fix 10: gestor/admin pode registrar "em nome de" um liderado.
  // 'self' = o proprio profile; demais valores = user_id do liderado.
  const [registerAssignee, setRegisterAssignee] = useState<string>('self');

  // Liderados (dropdown "Em nome de") + setores (filtro por setor) — so quando relevante.
  const canActOnBehalf = isAdmin || isGestor;
  const directReportsQuery = useDirectReportUserIds(profile?.id, canActOnBehalf);
  const collaboratorsQuery = useCollaborators(canActOnBehalf);
  const sectorsQuery = useSectors();
  const directReportIds = directReportsQuery.data ?? [];
  const allCollaborators = collaboratorsQuery.data ?? [];
  const sectors = sectorsQuery.data ?? [];
  // Admin ve todos; gestor ve seus liderados (alem de "self" que continua sendo opcao)
  const onBehalfCandidates = isAdmin
    ? allCollaborators.filter((c) => c.user_id !== profile?.user_id)
    : allCollaborators.filter((c) => directReportIds.includes(c.user_id));

  // Onda 2 / Fix 11: filtros visuais por setor e por pessoa na listagem.
  const [filterSectorId, setFilterSectorId] = useState<string>('all');
  const [filterUserId, setFilterUserId] = useState<string>('all');

  // Retorna [min, max] aceitaveis para o KPI selecionado
  const getScoreRange = (kpi: Kpi | null): { min: number; max: number } => {
    if (!kpi) return { min: 0, max: 100000 };
    const name = (kpi.name ?? '').toUpperCase();
    if (name.includes('NPS')) return { min: -100, max: 100 };
    if (kpi.unit === '%') return { min: 0, max: 100 };
    return { min: 0, max: 100000 };
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const alerts = useAlerts({ kpis, kpiResults: results, pdiTasks: [], month: currentMonth, year: currentYear });

  const getAchievement = (kpiId: string) => {
    const kpi = kpis.find(k => k.id === kpiId);
    const result = results.find(r => r.kpi_id === kpiId && r.month === currentMonth && r.year === currentYear);
    if (!kpi || !result || !kpi.target_value) return null;
    return Math.round((result.score / kpi.target_value) * 100);
  };

  const openRegisterDialog = (kpi: Kpi) => {
    setSelectedKpi(kpi);
    setRegisterScore('');
    setRegisterScoreError('');
    setRegisterMonth(currentMonth);
    setRegisterYear(currentYear);
    setRegisterAssignee('self');
    setRegisterOpen(true);
  };

  const handleRegisterResult = async () => {
    if (!profile || !selectedKpi) return;
    const scoreNum = Number(registerScore);
    const { min, max } = getScoreRange(selectedKpi);

    if (registerScore === '') {
      setRegisterScoreError('Informe o valor do resultado');
      return;
    }
    if (isNaN(scoreNum)) {
      setRegisterScoreError('O valor deve ser um numero valido');
      return;
    }
    if (scoreNum < min || scoreNum > max) {
      setRegisterScoreError(`O valor deve estar entre ${min} e ${max}`);
      return;
    }

    // Bug #4 fix: validate that month is selected
    if (!registerMonth) {
      toast({ title: t('error'), description: t('month') || 'Selecione o mes', variant: 'destructive' });
      return;
    }

    // Onda 2 / Fix 10: resolve "em nome de quem" registrar o resultado.
    const targetUserId =
      registerAssignee !== 'self' && onBehalfCandidates.some((c) => c.user_id === registerAssignee)
        ? registerAssignee
        : profile.user_id;

    try {
      if (DEMO_MODE) {
        const newResult: KpiResult = {
          id: `kr-${Date.now()}`,
          kpi_id: selectedKpi.id,
          user_id: targetUserId,
          score: scoreNum,
          month: registerMonth,
          year: registerYear,
          created_at: new Date().toISOString(),
        };
        // Replace existing result for same kpi/month/year/user or add new
        setLocalResults(prev => {
          const filtered = prev.filter(r => !(r.kpi_id === selectedKpi.id && r.month === registerMonth && r.year === registerYear && r.user_id === targetUserId));
          return [...filtered, newResult];
        });
        toast({ title: t('kpiDemoResultRegistered') });
        setRegisterOpen(false);
        return;
      }

      const existing = results.find(
        r => r.kpi_id === selectedKpi.id && r.month === registerMonth && r.year === registerYear && r.user_id === targetUserId
      );

      await upsertMutation.mutateAsync({
        kpiId: selectedKpi.id,
        userId: targetUserId,
        score: scoreNum,
        month: registerMonth,
        year: registerYear,
        existingId: existing?.id,
      });

      toast({ title: t('resultRegistered') });
      setRegisterOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t('error'), description: message, variant: 'destructive' });
    }
  };

  const registering = upsertMutation.isPending;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Onda 2 / Fix 11: KPIs visiveis apos aplicar filtro de setor.
  const visibleKpis = filterSectorId === 'all'
    ? kpis
    : kpis.filter((k) => (k as any).sector_ids?.includes(filterSectorId));
  // Resultados visiveis apos filtro de pessoa (afeta cards e charts).
  const visibleResults = filterUserId === 'all'
    ? results
    : results.filter((r) => r.user_id === filterUserId);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('kpis')}</h1>
        {(isAdmin || isGestor) && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Setor</Label>
              <Select value={filterSectorId} onValueChange={setFilterSectorId}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {onBehalfCandidates.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Pessoa</Label>
                <Select value={filterUserId} onValueChange={setFilterUserId}>
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue placeholder="Todas as pessoas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as pessoas</SelectItem>
                    {profile && (
                      <SelectItem value={profile.user_id}>{profile.full_name ?? 'Eu'}</SelectItem>
                    )}
                    {onBehalfCandidates.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleKpis.map(kpi => {
          const achievement = getAchievement(kpi.id);
          const currentResult = visibleResults.find(r => r.kpi_id === kpi.id && r.month === currentMonth && r.year === currentYear);
          return (
            <Card key={kpi.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {(isAdmin || isGestor) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={t('registerResult')}
                      onClick={() => openRegisterDialog(kpi)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-1">Ultimo registro</div>
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
        <KpiEvolutionChart results={visibleResults} kpis={visibleKpis} months={6} />
        <KpiComparisonChart results={visibleResults} kpis={visibleKpis} currentMonth={currentMonth} currentYear={currentYear} />
      </div>

      {alerts.length > 0 && <AlertsPanel alerts={alerts} />}

      {/* Register Result Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('registerKpiResult')} — {selectedKpi?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {canActOnBehalf && onBehalfCandidates.length > 0 && (
              <div className="space-y-2">
                <Label>Em nome de</Label>
                <Select value={registerAssignee} onValueChange={setRegisterAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Eu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Eu ({profile?.full_name ?? 'meu registro'})</SelectItem>
                    {onBehalfCandidates.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('scoreValue')}</Label>
              {selectedKpi && (() => {
                const { min, max } = getScoreRange(selectedKpi);
                return (
                  <p className="text-xs text-muted-foreground">
                    Intervalo aceito: {min} a {max}
                    {selectedKpi.unit ? ` ${selectedKpi.unit}` : ''}
                  </p>
                );
              })()}
              <Input
                type="number"
                value={registerScore}
                onChange={(e) => {
                  setRegisterScore(e.target.value);
                  setRegisterScoreError('');
                }}
                placeholder="0"
                min={selectedKpi ? getScoreRange(selectedKpi).min : 0}
                max={selectedKpi ? getScoreRange(selectedKpi).max : 100000}
              />
              {registerScoreError && (
                <p className="text-xs text-destructive">{registerScoreError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('month')}</Label>
                <Select value={String(registerMonth)} onValueChange={(v) => setRegisterMonth(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m} value={String(m)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('year')}</Label>
                <Input
                  type="number"
                  value={registerYear}
                  onChange={(e) => setRegisterYear(Number(e.target.value))}
                  min={2020}
                  max={2030}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRegisterOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleRegisterResult} disabled={registering}>
                {registering && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
