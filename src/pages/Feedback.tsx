import React, { useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquareHeart, Send, BarChart3, ShieldCheck, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useSmartFormsByCategory } from '@/hooks/useSmartForms';
import {
  useMyFeedbackAssignments,
  useAssignFeedback,
  useSubmitFeedbackResponse,
  useFeedbackAggregate,
} from '@/hooks/useFeedbackCycles';
import { useDirectReportUserIds, useCollaborators } from '@/services/profileService';
import { SmartFormRenderer } from '@/components/smartforms/SmartFormRenderer';

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Feedback() {
  const { profile, isAdmin, isGestor } = useAuth();
  const { viewMode } = useViewMode();
  const { toast } = useToast();

  // Gestor mode is active when the user has admin OR gestor role AND is currently
  // operating in "Visao Gestor". Otherwise the user only sees the colaborador view.
  const gestorMode = (isAdmin || isGestor) && viewMode === 'team';

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <MessageSquareHeart className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Pesquisa de Clima</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Envie e receba feedback do time. Respostas anônimas ficam agregadas — gestor
        nunca vê quem respondeu o que.
      </p>

      {gestorMode ? (
        <Tabs defaultValue="assign">
          <TabsList>
            <TabsTrigger value="assign">Atribuir formulário</TabsTrigger>
            <TabsTrigger value="results">Resultados agregados</TabsTrigger>
            <TabsTrigger value="answer">Minhas respostas</TabsTrigger>
          </TabsList>
          <TabsContent value="assign" className="mt-4">
            <AssignTab profileId={profile?.id} userId={profile?.user_id} />
          </TabsContent>
          <TabsContent value="results" className="mt-4">
            <ResultsTab />
          </TabsContent>
          <TabsContent value="answer" className="mt-4">
            <AnswerTab userId={profile?.user_id} />
          </TabsContent>
        </Tabs>
      ) : (
        <AnswerTab userId={profile?.user_id} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 1: gestor atribui formulario ao time
// ---------------------------------------------------------------------------
function AssignTab({ profileId, userId }: { profileId: string | undefined; userId: string | undefined }) {
  const { toast } = useToast();
  const { forms } = useSmartFormsByCategory('feedback');
  const directReportsQuery = useDirectReportUserIds(profileId, true);
  const collaboratorsQuery = useCollaborators(true);
  const assignMutation = useAssignFeedback();

  const [formId, setFormId] = useState<string>('');
  const [period, setPeriod] = useState<string>(currentPeriod());
  const [anonymous, setAnonymous] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const reportIds = directReportsQuery.data ?? [];
  const collaborators = collaboratorsQuery.data ?? [];
  const reports = useMemo(
    () => collaborators.filter((c) => reportIds.includes(c.user_id)),
    [collaborators, reportIds]
  );

  const toggleId = (uid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const allSelected = reports.length > 0 && reports.every((r) => selectedIds.has(r.user_id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(reports.map((r) => r.user_id)));
  };

  const handleAssign = async () => {
    if (!formId) {
      toast({ title: 'Selecione um formulário', variant: 'destructive' });
      return;
    }
    if (selectedIds.size === 0) {
      toast({ title: 'Selecione pelo menos um colaborador', variant: 'destructive' });
      return;
    }
    if (anonymous && selectedIds.size < 3) {
      toast({
        title: 'Mínimo 3 colaboradores para feedback anônimo',
        description: 'Com menos de 3 respostas não é possível garantir anonimato. Desative o anonimato ou selecione mais pessoas.',
        variant: 'destructive',
      });
      return;
    }
    if (!userId) return;
    try {
      const res = await assignMutation.mutateAsync({
        formId,
        assigneeUserIds: Array.from(selectedIds),
        assignedByUserId: userId,
        period,
        isAnonymous: anonymous,
      });
      toast({ title: `Formulário atribuído a ${res.count} pessoa(s)` });
      setSelectedIds(new Set());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Erro ao atribuir', description: message, variant: 'destructive' });
    }
  };

  if (forms.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={MessageSquareHeart}
            title="Nenhum formulário de feedback disponível"
            description="Crie um formulário com categoria 'feedback' em /smartforms primeiro."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Novo ciclo de feedback</CardTitle>
        <CardDescription>
          Escolha o formulário, o período e quem do seu time deve responder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Formulário</Label>
            <Select value={formId} onValueChange={setFormId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um formulário" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Período (YYYY-MM)</Label>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-05"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/40">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Respostas anônimas</p>
            <p className="text-xs text-muted-foreground">
              Quando ligado, você verá apenas o agregado. Resultados com menos de 3
              respostas são ocultados para evitar reidentificação.
            </p>
          </div>
          <Switch checked={anonymous} onCheckedChange={setAnonymous} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Liderados ({reports.length})</Label>
            {reports.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            )}
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum liderado direto encontrado. Confira o organograma em Admin.
            </p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <label key={r.user_id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/40">
                  <Checkbox
                    checked={selectedIds.has(r.user_id)}
                    onCheckedChange={() => toggleId(r.user_id)}
                  />
                  <span className="text-sm">{r.full_name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAssign} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Atribuir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Aba 2: resultados agregados (gestor)
// ---------------------------------------------------------------------------
function ResultsTab() {
  const { forms } = useSmartFormsByCategory('feedback');
  const [formId, setFormId] = useState<string>('');
  const [period, setPeriod] = useState<string>(currentPeriod());
  const aggregateQuery = useFeedbackAggregate(formId || null, period || null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resultados anônimos</CardTitle>
        <CardDescription>
          Apenas o agregado por pergunta. Linhas com menos de 3 respostas não são
          exibidas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Formulário</Label>
            <Select value={formId} onValueChange={setFormId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Período</Label>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
        </div>

        {aggregateQuery.isFetching ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando agregado...
          </div>
        ) : (aggregateQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Sem dados ainda"
            description="Aguarde 3+ respostas para o agregado aparecer (privacidade)."
          />
        ) : (
          <div className="space-y-2">
            {(aggregateQuery.data ?? []).map((row) => (
              <div key={row.field_name} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{row.field_name}</p>
                  <p className="text-xs text-muted-foreground">{row.response_count} resposta(s)</p>
                </div>
                <Badge variant="secondary" className="text-base">
                  {row.avg_value.toFixed(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Aba 3 / Visao Colaborador: responder formulario atribuido
// ---------------------------------------------------------------------------
function AnswerTab({ userId }: { userId: string | undefined }) {
  const { toast } = useToast();
  const assignmentsQuery = useMyFeedbackAssignments(userId);
  const { forms } = useSmartFormsByCategory('feedback');
  const submitMutation = useSubmitFeedbackResponse();

  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);

  const assignments = assignmentsQuery.data ?? [];
  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId);
  const activeForm = activeAssignment ? forms.find((f) => f.id === activeAssignment.form_id) : null;

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!activeAssignment || !userId) return;
    try {
      await submitMutation.mutateAsync({
        assignmentId: activeAssignment.id,
        formId: activeAssignment.form_id,
        data,
        period: activeAssignment.period,
        isAnonymous: activeAssignment.isAnonymous,
        respondingUserId: userId,
      });
      toast({ title: activeAssignment.isAnonymous ? 'Resposta enviada — anônima' : 'Resposta enviada' });
      setActiveAssignmentId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Erro ao enviar', description: message, variant: 'destructive' });
    }
  };

  if (activeAssignment && activeForm) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setActiveAssignmentId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{activeForm.name}</h2>
            <p className="text-xs text-muted-foreground">
              Período: {activeAssignment.period} · Resposta anônima
            </p>
          </div>
        </div>
        <SmartFormRenderer config={activeForm.config} onSubmit={handleSubmit} />
      </div>
    );
  }

  if (assignmentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={MessageSquareHeart}
            title="Nenhum formulário pendente"
            description="Quando seu gestor atribuir um feedback, ele aparece aqui."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {assignments.map((a) => {
        const form = forms.find((f) => f.id === a.form_id);
        return (
          <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveAssignmentId(a.id)}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{form?.name ?? 'Formulário de feedback'}</CardTitle>
                <CardDescription>Período: {a.period} · Anônimo</CardDescription>
              </div>
              <Badge variant="outline">Pendente</Badge>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
