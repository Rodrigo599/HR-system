import React, { useState } from "react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useOneOnOnes, useCreateOneOnOne, useUpdateOneOnOne, useAddTopic } from "@/hooks/api/useOneOnOnes";
import { useTeam } from "@/hooks/api/useUsers";
import type { OneOnOne } from "@/types/api";

const STATUS_BADGE: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }> = {
  scheduled: { label: 'Agendado', variant: 'outline' },
  completed: { label: 'Concluído', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export default function OneOnOnes() {
  const { user, isAdmin, isGestor } = useAuth();
  const { toast } = useToast();

  const oneOnOnesQuery = useOneOnOnes();
  const teamQuery = useTeam();
  const createMutation = useCreateOneOnOne();

  const oneOnOnes: OneOnOne[] = oneOnOnesQuery.data ?? [];
  const team = teamQuery.data ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [collaboratorId, setCollaboratorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const [selected, setSelected] = useState<OneOnOne | null>(null);
  const [newTopic, setNewTopic] = useState('');
  const addTopicMutation = useAddTopic(selected?.id ?? '');
  const updateMutation = useUpdateOneOnOne(selected?.id ?? '');

  const handleCreate = async () => {
    if (!collaboratorId || !scheduledAt) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({ collaborator_id: collaboratorId, scheduled_at: scheduledAt });
      toast({ title: '1:1 agendado' });
      setCreateOpen(false);
      setCollaboratorId('');
      setScheduledAt('');
    } catch {
      toast({ title: 'Erro ao criar', variant: 'destructive' });
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;
    try {
      await addTopicMutation.mutateAsync(newTopic);
      setNewTopic('');
      oneOnOnesQuery.refetch();
    } catch {
      toast({ title: 'Erro ao adicionar tópico', variant: 'destructive' });
    }
  };

  const handleComplete = async () => {
    if (!selected) return;
    try {
      await updateMutation.mutateAsync({ status: 'completed' });
      toast({ title: '1:1 concluído' });
      oneOnOnesQuery.refetch();
      setSelected(null);
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  if (oneOnOnesQuery.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">1:1s</h1>
        {(isAdmin || isGestor) && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Agendar 1:1</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Agendar 1:1</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select value={collaboratorId} onValueChange={setCollaboratorId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{team.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data e hora</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Agendar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {oneOnOnes.length === 0 ? (
        <Card><CardContent><EmptyState icon={Users} title="Nenhum 1:1 agendado" description="Seus encontros individuais aparecem aqui." /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {oneOnOnes.map(o => {
            const otherId = o.manager_id === user?.id ? o.collaborator_id : o.manager_id;
            const member = team.find(m => m.id === otherId);
            const { label, variant } = STATUS_BADGE[o.status] ?? STATUS_BADGE.scheduled;
            return (
              <Card key={o.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(o)}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{member?.name ?? 'Colega'}</CardTitle>
                    <CardDescription>{new Date(o.scheduled_at).toLocaleString('pt-BR')}</CardDescription>
                  </div>
                  <Badge variant={variant}>{label}</Badge>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>1:1 — {new Date(selected.scheduled_at).toLocaleString('pt-BR')}</SheetTitle>
              </SheetHeader>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Tópicos</h3>
                {(selected.topics ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum tópico ainda.</p>}
                {(selected.topics ?? []).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={t.addressed} disabled />
                    <span className={t.addressed ? 'line-through text-muted-foreground' : ''}>{t.content}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input placeholder="Adicionar tópico..." value={newTopic} onChange={e => setNewTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTopic()} />
                  <Button size="sm" onClick={handleAddTopic} disabled={addTopicMutation.isPending}>Adicionar</Button>
                </div>
              </div>
              {selected.status === 'scheduled' && (
                <Button onClick={handleComplete} disabled={updateMutation.isPending} className="w-full">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como concluído
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
