import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMutationHandler } from '@/hooks/useMutation';
import { Loader2, BookOpen, Plus, Users as UsersIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { usePdis, useCreatePdi, useCreatePdiTask, useSubmitPdiTask, useReviewPdiTask } from '@/hooks/api/usePdi';
import type { Pdi, PdiTask } from '@/types/api';

function formatDate(d: string | null | undefined) {
  if (!d) return '-';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

export default function PDI() {
  const { isAdmin, isGestor } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { run } = useMutationHandler();

  const showTeamTab = isAdmin || isGestor;

  const pdisQuery = usePdis();
  const pdis: Pdi[] = pdisQuery.data ?? [];

  const createPdiMutation = useCreatePdi();

  const [selectedPdi, setSelectedPdi] = useState<Pdi | null>(null);
  const [newPdiOpen, setNewPdiOpen] = useState(false);
  const [newPdiTitle, setNewPdiTitle] = useState('');
  const [newPdiDesc, setNewPdiDesc] = useState('');
  const [newPdiDue, setNewPdiDue] = useState('');

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  const createTaskMutation = useCreatePdiTask(selectedPdi?.id ?? '');
  const submitTaskMutation = useSubmitPdiTask(selectedPdi?.id ?? '');
  const reviewTaskMutation = useReviewPdiTask(selectedPdi?.id ?? '');

  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; mode: 'approve' | 'reject'; task: PdiTask | null }>({ open: false, mode: 'approve', task: null });
  const [reviewNotes, setReviewNotes] = useState('');

  const handleCreatePdi = async () => {
    if (!newPdiTitle.trim()) return;
    await run(
      createPdiMutation.mutateAsync({ title: newPdiTitle, description: newPdiDesc || undefined, due_date: newPdiDue || undefined }),
      { successMsg: 'PDI criado', onSuccess: (pdi) => { setSelectedPdi(pdi); setNewPdiOpen(false); setNewPdiTitle(''); setNewPdiDesc(''); setNewPdiDue(''); } },
    );
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !selectedPdi) return;
    await run(
      createTaskMutation.mutateAsync({ title: newTaskTitle, due_date: newTaskDue || undefined }),
      { successMsg: 'Tarefa adicionada', onSuccess: () => { setNewTaskOpen(false); setNewTaskTitle(''); setNewTaskDue(''); pdisQuery.refetch(); } },
    );
  };

  const handleSubmitTask = async (taskId: string) => {
    if (!selectedPdi) return;
    await run(
      submitTaskMutation.mutateAsync(taskId),
      { successMsg: 'Tarefa enviada para revisão', onSuccess: () => pdisQuery.refetch() },
    );
  };

  const handleReview = async () => {
    if (!reviewDialog.task || !selectedPdi) return;
    if (reviewDialog.mode === 'reject' && !reviewNotes.trim()) {
      toast({ title: 'Informe o motivo da rejeição', variant: 'destructive' });
      return;
    }
    await run(
      reviewTaskMutation.mutateAsync({ taskId: reviewDialog.task.id, status: reviewDialog.mode === 'approve' ? 'approved' : 'rejected', review_notes: reviewNotes }),
      { successMsg: reviewDialog.mode === 'approve' ? 'Tarefa aprovada' : 'Tarefa rejeitada', onSuccess: () => { setReviewDialog({ open: false, mode: 'approve', task: null }); setReviewNotes(''); pdisQuery.refetch(); } },
    );
  };

  const activePdi = selectedPdi ?? pdis[0] ?? null;
  const tasks: PdiTask[] = activePdi?.tasks ?? [];
  const completedTasks = tasks.filter(t => t.status === 'approved').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (pdisQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDI</h1>
        <Button size="sm" onClick={() => setNewPdiOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo PDI
        </Button>
      </div>

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my"><BookOpen className="h-4 w-4 mr-2" /> Meus PDIs</TabsTrigger>
          {showTeamTab && <TabsTrigger value="team"><UsersIcon className="h-4 w-4 mr-2" /> Time</TabsTrigger>}
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          {pdis.length === 0 ? (
            <Card><CardContent><EmptyState icon={BookOpen} title="Nenhum PDI" description="Crie seu primeiro Plano de Desenvolvimento Individual." ctaLabel="Novo PDI" onCtaClick={() => setNewPdiOpen(true)} /></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                {pdis.map(pdi => (
                  <Card key={pdi.id} className={`cursor-pointer hover:shadow-md transition-shadow ${activePdi?.id === pdi.id ? 'border-primary' : ''}`} onClick={() => setSelectedPdi(pdi)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{pdi.title}</CardTitle>
                      {pdi.due_date && <CardDescription>Prazo: {formatDate(pdi.due_date)}</CardDescription>}
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {activePdi && (
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{activePdi.title}</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setNewTaskOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Tarefa
                        </Button>
                      </div>
                      {activePdi.description && <CardDescription>{activePdi.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm"><span>Progresso</span><span>{completedTasks}/{tasks.length}</span></div>
                        <Progress value={progress} />
                      </div>
                      <div className="space-y-2">
                        {tasks.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhuma tarefa ainda.</p>
                        ) : tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between rounded-md border p-3">
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              {task.due_date && <p className="text-xs text-muted-foreground">Prazo: {formatDate(task.due_date)}</p>}
                              {task.review_notes && <p className="text-xs text-muted-foreground mt-1">Feedback: {task.review_notes}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={task.status} domain="pdi_task" />
                              {task.status === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => handleSubmitTask(task.id)}>Enviar</Button>
                              )}
                              {showTeamTab && task.status === 'submitted' && (
                                <>
                                  <Button size="sm" variant="default" onClick={() => setReviewDialog({ open: true, mode: 'approve', task })}>Aprovar</Button>
                                  <Button size="sm" variant="destructive" onClick={() => setReviewDialog({ open: true, mode: 'reject', task })}>Rejeitar</Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {showTeamTab && (
          <TabsContent value="team">
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">PDIs do time aparecem aqui conforme configurados na API.</p></CardContent></Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Novo PDI */}
      <Dialog open={newPdiOpen} onOpenChange={setNewPdiOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo PDI</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Título</Label><Input value={newPdiTitle} onChange={e => setNewPdiTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={newPdiDesc} onChange={e => setNewPdiDesc(e.target.value)} rows={2} /></div>
            <div className="space-y-2"><Label>Prazo</Label><Input type="date" value={newPdiDue} onChange={e => setNewPdiDue(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewPdiOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreatePdi} disabled={createPdiMutation.isPending}>
                {createPdiMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nova Tarefa */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Título</Label><Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Prazo</Label><Input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewTaskOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={v => { if (!v) { setReviewDialog({ open: false, mode: 'approve', task: null }); setReviewNotes(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{reviewDialog.mode === 'approve' ? 'Aprovar tarefa' : 'Rejeitar tarefa'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">{reviewDialog.task?.title}</p>
            <div className="space-y-2">
              <Label>{reviewDialog.mode === 'approve' ? 'Comentário (opcional)' : 'Motivo da rejeição'}</Label>
              <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, mode: 'approve', task: null })}>Cancelar</Button>
            <Button variant={reviewDialog.mode === 'approve' ? 'default' : 'destructive'} onClick={handleReview} disabled={reviewTaskMutation.isPending}>
              {reviewTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {reviewDialog.mode === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
