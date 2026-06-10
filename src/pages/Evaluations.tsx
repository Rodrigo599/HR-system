import React, { useState } from "react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Users as UsersIcon, Plus, ClipboardList, Clock } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { EvaluationSmartForm } from "@/components/evaluations/EvaluationSmartForm";
import { useEvaluations, useCreateEvaluation } from "@/hooks/api/useEvaluations";
import { useSmartForms } from "@/hooks/api/useSmartForms";
import { useTeam } from "@/hooks/api/useUsers";
import type { Evaluation } from "@/types/api";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function Evaluations() {
  const { user, isAdmin, isGestor } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const showTeamTab = isAdmin || isGestor;

  const evaluationsQuery = useEvaluations();
  const teamQuery = useTeam();
  const formsQuery = useSmartForms({ category: 'evaluation' });
  const createMutation = useCreateEvaluation();

  const evaluations: Evaluation[] = evaluationsQuery.data ?? [];
  const team = teamQuery.data ?? [];
  const evalTemplates = formsQuery.data ?? [];

  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newFormId, setNewFormId] = useState('');
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  const myEvaluations = evaluations.filter(e => e.assigned_to === user?.id);
  const teamEvaluations = evaluations.filter(e => e.assigned_to !== user?.id);

  const handleCreate = async () => {
    if (!newAssignedTo || !newFormId) {
      toast({ title: t('error'), description: 'Selecione colaborador e formulário', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({ type: 'cultural', period: `${newYear}-${newMonth}`, assigned_to: newAssignedTo, smart_form_id: newFormId });
      toast({ title: t('evaluationCreated') });
      setCreateOpen(false);
      setNewAssignedTo('');
      setNewFormId('');
    } catch {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline', completed: 'default', closed: 'destructive',
    };
    const labels: Record<string, string> = {
      pending: t('pendingSelf'), completed: t('completed'), closed: t('closed'),
    };
    return <Badge variant={variants[status] ?? 'default'}>{labels[status] ?? status}</Badge>;
  };

  if (evaluationsQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('evaluations')}</h1>
        {showTeamTab && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> {t('newEvaluation')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{t('createEvaluation')}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>{t('selectCollaborator')}</Label>
                  <Select value={newAssignedTo} onValueChange={setNewAssignedTo}>
                    <SelectTrigger><SelectValue placeholder={t('selectCollaborator')} /></SelectTrigger>
                    <SelectContent>
                      {team.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formulário</Label>
                  <Select value={newFormId} onValueChange={setNewFormId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o formulário" /></SelectTrigger>
                    <SelectContent>
                      {evalTemplates.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('month')}</Label>
                    <Select value={String(newMonth)} onValueChange={v => setNewMonth(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('year')}</Label>
                    <Input type="number" value={newYear} onChange={e => setNewYear(Number(e.target.value))} min={2020} max={2030} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t('save')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="my" onValueChange={() => setSelectedEvaluation(null)}>
        <TabsList>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <User className="h-4 w-4" /> {t('myEvaluations')}
            {myEvaluations.length > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 h-5">{myEvaluations.length}</Badge>}
          </TabsTrigger>
          {showTeamTab && (
            <TabsTrigger value="team" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" /> {t('teamEvaluations')}
              {teamEvaluations.length > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 h-5">{teamEvaluations.length}</Badge>}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          {myEvaluations.length === 0 ? (
            <Card><CardContent><EmptyState icon={ClipboardList} title="Nenhuma avaliação pendente" description="Quando seu líder iniciar uma avaliação, ela aparece aqui." /></CardContent></Card>
          ) : myEvaluations.map(evaluation => (
            <Card key={evaluation.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-400" onClick={() => setSelectedEvaluation(evaluation)}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <CardTitle className="text-base">{evaluation.type} · {evaluation.period}</CardTitle>
                </div>
                {getStatusBadge(evaluation.status)}
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        {showTeamTab && (
          <TabsContent value="team" className="space-y-4">
            {teamEvaluations.length === 0 ? (
              <Card><CardContent><EmptyState icon={ClipboardList} title="Nenhuma avaliação criada" description="Crie a primeira avaliação para um liderado." ctaLabel="Nova avaliação" onCtaClick={() => setCreateOpen(true)} /></CardContent></Card>
            ) : teamEvaluations.map(evaluation => {
              const member = team.find(m => m.id === evaluation.assigned_to);
              return (
                <Card key={evaluation.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedEvaluation(evaluation)}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{member?.name ?? 'Colaborador'}</CardTitle>
                      <CardDescription>{evaluation.type} · {evaluation.period}</CardDescription>
                    </div>
                    {getStatusBadge(evaluation.status)}
                  </CardHeader>
                </Card>
              );
            })}
          </TabsContent>
        )}
      </Tabs>

      {selectedEvaluation && (
        <EvaluationSmartForm
          evaluation={selectedEvaluation}
          onSaved={() => evaluationsQuery.refetch()}
          onBack={() => setSelectedEvaluation(null)}
        />
      )}
    </div>
  );
}
