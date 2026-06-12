import React, { useState } from "react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMutationHandler } from "@/hooks/useMutation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useOneOnOnes, useOneOnOne, useCreateOneOnOne, useUpdateOneOnOne, useAddTopic } from "@/hooks/api/useOneOnOnes";
import { UserSelect } from "@/components/shared/UserSelect";
import type { OneOnOne } from "@/types/api";

export default function OneOnOnes() {
  const { user, isAdmin, isGestor } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { run } = useMutationHandler();

  const oneOnOnesQuery = useOneOnOnes();
  const createMutation = useCreateOneOnOne();

  const oneOnOnes: OneOnOne[] = oneOnOnesQuery.data ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [collaboratorId, setCollaboratorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState('');
  const { data: selected } = useOneOnOne(selectedId ?? '');
  const addTopicMutation = useAddTopic(selectedId ?? '');
  const updateMutation = useUpdateOneOnOne(selectedId ?? '');

  const handleCreate = async () => {
    if (!collaboratorId || !scheduledAt) {
      toast({ title: t('fillAllFields'), variant: 'destructive' });
      return;
    }
    await run(
      createMutation.mutateAsync({ report_id: collaboratorId, scheduled_at: scheduledAt }),
      { successMsg: t('oneOnOneScheduled'), errorMsg: t('errorCreate'), onSuccess: () => { setCreateOpen(false); setCollaboratorId(''); setScheduledAt(''); } },
    );
  };

  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;
    await run(
      addTopicMutation.mutateAsync(newTopic),
      { successMsg: '', errorMsg: t('errorAddTopic'), onSuccess: () => setNewTopic('') },
    );
  };

  const handleComplete = async () => {
    if (!selectedId) return;
    await run(
      updateMutation.mutateAsync({ status: 'completed' }),
      { successMsg: t('oneOnOneCompleted'), onSuccess: () => setSelectedId(null) },
    );
  };

  if (oneOnOnesQuery.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('oneOnOnes')}</h1>
        {(isAdmin || isGestor) && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> {t('scheduleOneOnOne')}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{t('scheduleOneOnOne')}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>{t('collaborator')}</Label>
                  <UserSelect
                    value={collaboratorId}
                    onValueChange={setCollaboratorId}
                    placeholder={t('selectOne')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('date')}</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {t('scheduleOneOnOne')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {oneOnOnes.length === 0 ? (
        <Card><CardContent><EmptyState icon={Users} title={t('noneOneOnOne')} description={t('noneOneOnOneDesc')} /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {oneOnOnes.map(o => {
            const otherName = o.manager_id === user?.id ? o.report?.name : o.manager?.name;
            return (
              <Card key={o.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(o.id)}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{otherName ?? t('colleague')}</CardTitle>
                    <CardDescription>{new Date(o.scheduled_at).toLocaleString('pt-BR')}</CardDescription>
                  </div>
                  <StatusBadge status={o.status} domain="one_on_one" />
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedId} onOpenChange={v => { if (!v) setSelectedId(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && selectedId && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>1:1 — {new Date(selected.scheduled_at).toLocaleString('pt-BR')}</SheetTitle>
              </SheetHeader>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">{t('topics')}</h3>
                {(selected.topics ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t('noTasksYet')}</p>}
                {(selected.topics ?? []).map(tp => (
                  <div key={tp.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={tp.addressed} disabled />
                    <span className={tp.addressed ? 'line-through text-muted-foreground' : ''}>{tp.content}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input placeholder={t('addTopicPlaceholder')} value={newTopic} onChange={e => setNewTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTopic()} />
                  <Button size="sm" onClick={handleAddTopic} disabled={addTopicMutation.isPending}>{t('addTopic')}</Button>
                </div>
              </div>
              {selected.status === 'scheduled' && (
                <Button onClick={handleComplete} disabled={updateMutation.isPending} className="w-full">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> {t('markCompleted')}
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
