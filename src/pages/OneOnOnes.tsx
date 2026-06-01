import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { DEMO_MODE } from "@/lib/demoMode";
import { GiveFeedback } from "@/components/feedback/GiveFeedback";
import {
  useCollaborators,
  useDirectReportUserIds,
} from "@/services/profileService";
import {
  useMyOneOnOnes,
  useOneOnOneTopics,
  useOneOnOneNotes,
  useCreateOneOnOne,
  useCompleteOneOnOne,
  useCancelOneOnOne,
  useAddTopic,
  useToggleTopic,
  useAddNote,
  type OneOnOne,
  type OneOnOneRecurrence,
  type OneOnOneNoteType,
} from "@/services/oneOnOneService";

// ============================================================
// Helpers
// ============================================================

const RECURRENCE_LABEL: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

// Em DEMO_MODE os IDs ficticios precisam de nome legivel — ja que
// fetchCollaborators traz dados de outra escala, hardcoda Nacho/Regi/Vitor.
const DEMO_NAMES: Record<string, string> = {
  "demo-user": "Voce",
  "user-nacho": "Nacho",
  "user-regi": "Regi",
  "user-vitor": "Vitor",
};

function formatScheduledAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: OneOnOne["status"]) {
  if (status === "scheduled")
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Agendada
      </Badge>
    );
  if (status === "completed")
    return (
      <Badge variant="default">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Concluida
      </Badge>
    );
  return (
    <Badge variant="destructive">
      <XCircle className="h-3 w-3 mr-1" />
      Cancelada
    </Badge>
  );
}

// ============================================================
// Componente: Drawer de detalhes (pauta + notas)
// ============================================================

function OneOnOneDetailSheet({
  oneOnOne,
  open,
  onOpenChange,
  currentUserId,
  isManager,
  nameOf,
}: {
  oneOnOne: OneOnOne | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  isManager: boolean;
  nameOf: (userId: string) => string;
}) {
  const { toast } = useToast();
  const topicsQuery = useOneOnOneTopics(oneOnOne?.id);
  const notesQuery = useOneOnOneNotes(oneOnOne?.id);
  const addTopic = useAddTopic();
  const toggleTopic = useToggleTopic();
  const addNote = useAddNote();
  const complete = useCompleteOneOnOne();
  const cancel = useCancelOneOnOne();

  const [newTopic, setNewTopic] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] =
    useState<OneOnOneNoteType>("observation");
  const [completionNotes, setCompletionNotes] = useState("");

  if (!oneOnOne) return null;

  const isScheduled = oneOnOne.status === "scheduled";

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    addTopic.mutate(
      {
        one_on_one_id: oneOnOne.id,
        author_user_id: currentUserId,
        content: newTopic.trim(),
      },
      {
        onSuccess: () => {
          setNewTopic("");
          toast({ title: "Topico adicionado" });
        },
        onError: (e) =>
          toast({
            title: "Erro",
            description: String(e),
            variant: "destructive",
          }),
      },
    );
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote.mutate(
      {
        one_on_one_id: oneOnOne.id,
        author_user_id: currentUserId,
        content: newNote.trim(),
        type: newNoteType,
      },
      {
        onSuccess: () => {
          setNewNote("");
          toast({ title: "Nota registrada" });
        },
        onError: (e) =>
          toast({
            title: "Erro",
            description: String(e),
            variant: "destructive",
          }),
      },
    );
  };

  const handleComplete = () => {
    complete.mutate(
      { id: oneOnOne.id, notes: completionNotes.trim() || null },
      {
        onSuccess: () => {
          toast({ title: "1:1 concluida" });
          setCompletionNotes("");
          onOpenChange(false);
        },
      },
    );
  };

  const handleCancel = () => {
    cancel.mutate(oneOnOne.id, {
      onSuccess: () => {
        toast({ title: "1:1 cancelada" });
        onOpenChange(false);
      },
    });
  };

  const partnerId = isManager ? oneOnOne.report_id : oneOnOne.manager_id;
  const partnerLabel = isManager ? "Liderado" : "Gestor";

  const notesByType = (type: OneOnOneNoteType) =>
    (notesQuery.data ?? []).filter((n) => n.type === type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              1:1 com {nameOf(partnerId)}
            </SheetTitle>
            {statusBadge(oneOnOne.status)}
          </div>
          <SheetDescription>
            {partnerLabel}: {nameOf(partnerId)}
            {" | "}
            {formatScheduledAt(oneOnOne.scheduled_at)}
            {oneOnOne.recurrence_rule
              ? ` | ${RECURRENCE_LABEL[oneOnOne.recurrence_rule]}`
              : " | Avulsa"}
          </SheetDescription>
          <div className="mt-3">
            <GiveFeedback
              toUserId={partnerId}
              toUserName={nameOf(partnerId)}
            />
          </div>
        </SheetHeader>

        {/* Pauta */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Pauta</h3>
          <div className="space-y-2">
            {(topicsQuery.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum topico ainda. Adicione abaixo.
              </p>
            )}
            {(topicsQuery.data ?? []).map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-2 p-2 rounded border bg-card"
              >
                <Checkbox
                  checked={t.addressed}
                  onCheckedChange={() =>
                    toggleTopic.mutate({ id: t.id, addressed: t.addressed })
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <p
                    className={
                      t.addressed
                        ? "text-sm line-through text-muted-foreground"
                        : "text-sm"
                    }
                  >
                    {t.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por {nameOf(t.author_user_id)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {isScheduled && (
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Novo topico..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
              />
              <Button onClick={handleAddTopic} disabled={!newTopic.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Notas (decisao / acao / observacao) */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Notas</h3>
          {(["decision", "action", "observation"] as const).map((type) => {
            const items = notesByType(type);
            if (items.length === 0) return null;
            const label =
              type === "decision"
                ? "Decisoes"
                : type === "action"
                  ? "Acoes"
                  : "Observacoes";
            return (
              <div key={type} className="mb-4">
                <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  {label}
                </h4>
                <div className="space-y-2">
                  {items.map((n) => (
                    <div key={n.id} className="p-2 rounded border bg-card">
                      <p className="text-sm">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Por {nameOf(n.author_user_id)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="space-y-2 mt-3">
            <div className="flex gap-2">
              <Select
                value={newNoteType}
                onValueChange={(v) => setNewNoteType(v as OneOnOneNoteType)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="observation">Observacao</SelectItem>
                  <SelectItem value="decision">Decisao</SelectItem>
                  <SelectItem value="action">Acao</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Nova nota..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Resumo de fechamento + acoes do gestor */}
        {isScheduled && isManager && (
          <section className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3">Encerrar 1:1</h3>
            <Textarea
              placeholder="Resumo final (opcional)"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={handleComplete} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Concluir
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                <XCircle className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            </div>
          </section>
        )}

        {!isScheduled && oneOnOne.notes && (
          <section className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-2">Resumo de fechamento</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {oneOnOne.notes}
            </p>
          </section>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Pagina principal
// ============================================================

export default function OneOnOnes() {
  const { profile, user, isAdmin, isGestor } = useAuth();
  const { viewMode } = useViewMode();
  const { toast } = useToast();

  // Em modo team, usuario opera como gestor; em modo personal, como liderado.
  const asManager = viewMode === "team" && (isAdmin || isGestor);
  const userId = user?.id ?? profile?.user_id ?? "";

  const oneOnOnesQuery = useMyOneOnOnes(userId, asManager);
  const collaboratorsQuery = useCollaborators(asManager);
  const directReportsQuery = useDirectReportUserIds(profile?.id, asManager);

  const create = useCreateOneOnOne();

  // Lookup de nome — combina mocks de demo + collaborators reais
  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    if (DEMO_MODE) {
      Object.entries(DEMO_NAMES).forEach(([id, n]) => m.set(id, n));
    }
    (collaboratorsQuery.data ?? []).forEach((c) => {
      if (c.full_name) m.set(c.user_id, c.full_name);
    });
    return m;
  }, [collaboratorsQuery.data]);

  const nameOf = (uid: string): string =>
    nameMap.get(uid) ?? (DEMO_MODE ? (DEMO_NAMES[uid] ?? uid) : uid);

  // Filtro: liderados disponiveis pra criar 1:1 (so users que reportam pra mim)
  const availableReports = useMemo(() => {
    if (DEMO_MODE) {
      return ["user-nacho", "user-regi", "user-vitor"];
    }
    if (isAdmin) {
      return (collaboratorsQuery.data ?? [])
        .map((c) => c.user_id)
        .filter((id) => id !== userId);
    }
    return directReportsQuery.data ?? [];
  }, [collaboratorsQuery.data, directReportsQuery.data, isAdmin, userId]);

  // ---- Dialog "Nova 1:1" ----
  const [createOpen, setCreateOpen] = useState(false);
  const [newReportId, setNewReportId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newRecurrence, setNewRecurrence] = useState<
    "adhoc" | "weekly" | "biweekly" | "monthly"
  >("adhoc");

  const handleCreate = () => {
    if (!newReportId || !newDate || !userId) {
      toast({ title: "Preencha liderado e data", variant: "destructive" });
      return;
    }
    const recurrence: OneOnOneRecurrence =
      newRecurrence === "adhoc" ? null : newRecurrence;
    create.mutate(
      {
        manager_id: userId,
        report_id: newReportId,
        scheduled_at: new Date(newDate).toISOString(),
        recurrence_rule: recurrence,
      },
      {
        onSuccess: () => {
          toast({ title: "1:1 criada" });
          setCreateOpen(false);
          setNewReportId("");
          setNewDate("");
          setNewRecurrence("adhoc");
        },
        onError: (e) =>
          toast({
            title: "Erro",
            description: String(e),
            variant: "destructive",
          }),
      },
    );
  };

  // ---- Drawer de detalhes ----
  const [selected, setSelected] = useState<OneOnOne | null>(null);

  const list = oneOnOnesQuery.data ?? [];
  const upcoming = list
    .filter((o) => o.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    );
  const history = list
    .filter((o) => o.status !== "scheduled")
    .sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
    );

  // Aba "Por liderado" (so pra gestor): agrupa scheduled por report_id
  const byReport = useMemo(() => {
    const grouped = new Map<string, OneOnOne[]>();
    upcoming.forEach((o) => {
      const arr = grouped.get(o.report_id) ?? [];
      arr.push(o);
      grouped.set(o.report_id, arr);
    });
    return grouped;
  }, [upcoming]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            {asManager ? "1:1s do time" : "Minhas 1:1s"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {asManager
              ? "Acompanhe as conversas individuais com seus liderados."
              : "Conversas individuais com seu gestor."}
          </p>
        </div>
        {asManager && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Nova 1:1
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar 1:1</DialogTitle>
                <DialogDescription>
                  Escolha o liderado, data e recorrencia.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Liderado</Label>
                  <Select value={newReportId} onValueChange={setNewReportId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableReports.length === 0 && (
                        <SelectItem value="__none" disabled>
                          Nenhum liderado disponivel
                        </SelectItem>
                      )}
                      {availableReports.map((id) => (
                        <SelectItem key={id} value={id}>
                          {nameOf(id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data e hora</Label>
                  <Input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Recorrencia</Label>
                  <Select
                    value={newRecurrence}
                    onValueChange={(v) =>
                      setNewRecurrence(v as typeof newRecurrence)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adhoc">Avulsa</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={create.isPending}>
                  Agendar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Proximas ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Historico ({history.length})
          </TabsTrigger>
          {asManager && (
            <TabsTrigger value="byreport">Por liderado</TabsTrigger>
          )}
        </TabsList>

        {/* Proximas */}
        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="Nenhuma 1:1 agendada"
              description={
                asManager
                  ? "Clique em Nova 1:1 para comecar."
                  : "Quando seu gestor agendar, aparecera aqui."
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map((o) => (
                <OneOnOneCard
                  key={o.id}
                  oneOnOne={o}
                  asManager={asManager}
                  nameOf={nameOf}
                  onClick={() => setSelected(o)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Historico */}
        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Sem historico"
              description="1:1s concluidas ou canceladas aparecerao aqui."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((o) => (
                <OneOnOneCard
                  key={o.id}
                  oneOnOne={o}
                  asManager={asManager}
                  nameOf={nameOf}
                  onClick={() => setSelected(o)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Por liderado (so gestor) */}
        {asManager && (
          <TabsContent value="byreport" className="mt-4">
            {byReport.size === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhuma 1:1 agendada"
                description="Agende a primeira para ver agrupado por liderado."
              />
            ) : (
              <div className="space-y-6">
                {Array.from(byReport.entries()).map(([reportId, items]) => (
                  <div key={reportId}>
                    <h3 className="text-sm font-semibold mb-2">
                      {nameOf(reportId)} ({items.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((o) => (
                        <OneOnOneCard
                          key={o.id}
                          oneOnOne={o}
                          asManager={asManager}
                          nameOf={nameOf}
                          onClick={() => setSelected(o)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <OneOnOneDetailSheet
        oneOnOne={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        currentUserId={userId}
        isManager={asManager}
        nameOf={nameOf}
      />
    </div>
  );
}

// ============================================================
// Card individual
// ============================================================

function OneOnOneCard({
  oneOnOne,
  asManager,
  nameOf,
  onClick,
}: {
  oneOnOne: OneOnOne;
  asManager: boolean;
  nameOf: (uid: string) => string;
  onClick: () => void;
}) {
  const partner = asManager ? oneOnOne.report_id : oneOnOne.manager_id;
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{nameOf(partner)}</CardTitle>
            <CardDescription>
              {formatScheduledAt(oneOnOne.scheduled_at)}
            </CardDescription>
          </div>
          {statusBadge(oneOnOne.status)}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {oneOnOne.recurrence_rule
            ? `Recorrencia: ${RECURRENCE_LABEL[oneOnOne.recurrence_rule]}`
            : "Avulsa"}
        </p>
      </CardContent>
    </Card>
  );
}
