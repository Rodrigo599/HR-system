import React, { useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  BookOpen,
  ListChecks,
  ExternalLink,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import {
  useDirectReportUserIds,
  useCollaborators,
} from "@/services/profileService";
import {
  useContentItemsCreated,
  useContentItemAssignments,
  useMyContentAssignments,
  useCreateContentItem,
  useUpdateAssignmentStatus,
  useDeleteContentItem,
  useContentItemProgress,
  type ContentType,
  type ContentItemRow,
} from "@/services/contentService";

const TYPE_META: Record<
  ContentType,
  { label: string; icon: typeof GraduationCap; color: string }
> = {
  training: { label: "Treinamento", icon: GraduationCap, color: "bg-blue-500" },
  reading: { label: "Leitura", icon: BookOpen, color: "bg-amber-500" },
  process: { label: "Processo", icon: ListChecks, color: "bg-emerald-500" },
};

export default function Content() {
  const { profile, isAdmin, isGestor } = useAuth();
  const { viewMode } = useViewMode();
  const gestorMode = (isAdmin || isGestor) && viewMode === "team";

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Conteúdo</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Treinamentos, leituras e processos atribuídos ao time. Cada pessoa marca
        progresso individualmente.
      </p>

      {gestorMode ? (
        <Tabs defaultValue="track">
          <TabsList>
            <TabsTrigger value="track">Acompanhar</TabsTrigger>
            <TabsTrigger value="upload">Subir</TabsTrigger>
            <TabsTrigger value="mine">Minhas pendências</TabsTrigger>
          </TabsList>
          <TabsContent value="track" className="mt-4">
            <TrackTab />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <UploadTab userId={profile?.user_id} profileId={profile?.id} />
          </TabsContent>
          <TabsContent value="mine" className="mt-4">
            <MyPendingTab userId={profile?.user_id} />
          </TabsContent>
        </Tabs>
      ) : (
        <MyPendingTab userId={profile?.user_id} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UPLOAD (gestor cria item + escolhe audiência)
// ---------------------------------------------------------------------------
function UploadTab({
  userId,
  profileId,
}: {
  userId: string | undefined;
  profileId: string | undefined;
}) {
  const { toast } = useToast();
  const directReportsQuery = useDirectReportUserIds(profileId, true);
  const collaboratorsQuery = useCollaborators(true);
  const createMutation = useCreateContentItem();

  const [type, setType] = useState<ContentType>("training");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [audienceMode, setAudienceMode] = useState<"team" | "individual">(
    "team",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const reportIds = directReportsQuery.data ?? [];
  const collaborators = collaboratorsQuery.data ?? [];
  const reports = useMemo(
    () => collaborators.filter((c) => reportIds.includes(c.user_id)),
    [collaborators, reportIds],
  );

  const handleSubmit = async () => {
    if (!userId) return;
    if (!title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    let audienceUserIds: string[] = [];
    if (audienceMode === "team") {
      audienceUserIds = reports.map((r) => r.user_id);
    } else {
      audienceUserIds = Array.from(selectedIds);
    }
    if (audienceUserIds.length === 0) {
      toast({
        title: "Selecione ao menos 1 colaborador",
        variant: "destructive",
      });
      return;
    }
    try {
      await createMutation.mutateAsync({
        createdByUserId: userId,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        dueDate: dueDate || undefined,
        audienceUserIds,
      });
      toast({
        title: "Conteúdo publicado",
        description: `Atribuído a ${audienceUserIds.length} pessoa(s).`,
      });
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setDueDate("");
      setSelectedIds(new Set());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: "Erro ao publicar",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const toggleId = (uid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Novo conteúdo</CardTitle>
        <CardDescription>
          Escolha o tipo, descreva e atribua ao time todo ou a colaboradores
          específicos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ContentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="training">Treinamento</SelectItem>
                <SelectItem value="reading">Leitura</SelectItem>
                <SelectItem value="process">Processo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Procedimento de check-in noturno"
              maxLength={140}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto, objetivo, o que esperar"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Link (opcional)</Label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          <div className="space-y-2">
            <Label>Prazo (opcional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Audiência</Label>
          <div className="flex gap-2">
            <Button
              variant={audienceMode === "team" ? "default" : "outline"}
              size="sm"
              onClick={() => setAudienceMode("team")}
            >
              Time todo ({reports.length})
            </Button>
            <Button
              variant={audienceMode === "individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setAudienceMode("individual")}
            >
              Individual
            </Button>
          </div>
          {audienceMode === "individual" && (
            <div className="space-y-1 max-h-60 overflow-auto rounded-md border p-2">
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">
                  Você não tem liderados diretos cadastrados.
                </p>
              ) : (
                reports.map((r) => (
                  <label
                    key={r.user_id}
                    className="flex items-center gap-2 rounded p-2 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedIds.has(r.user_id)}
                      onCheckedChange={() => toggleId(r.user_id)}
                    />
                    <span className="text-sm">{r.full_name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Publicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// TRACK (gestor vê seus items + tabela de progresso)
// ---------------------------------------------------------------------------
function TrackTab() {
  const itemsQuery = useContentItemsCreated();
  const items = itemsQuery.data ?? [];
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  if (itemsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={GraduationCap}
            title="Nenhum conteúdo publicado"
            description="Use a aba 'Subir' pra publicar treinamento, leitura ou processo."
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          expanded={openItemId === item.id}
          onToggle={() =>
            setOpenItemId((prev) => (prev === item.id ? null : item.id))
          }
        />
      ))}
    </div>
  );
}

function ItemCard({
  item,
  expanded,
  onToggle,
}: {
  item: ContentItemRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { toast } = useToast();
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const progressQuery = useContentItemProgress(expanded ? item.id : null);
  const assignmentsQuery = useContentItemAssignments(expanded ? item.id : null);
  const deleteMutation = useDeleteContentItem();
  const progress = progressQuery.data;
  const assignments = assignmentsQuery.data ?? [];

  const handleDelete = async () => {
    if (!confirm(`Apagar conteúdo "${item.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(item.id);
      toast({ title: "Conteúdo removido" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: "Erro ao remover",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div className={`${meta.color} text-white rounded-md p-2 shrink-0`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{item.title}</CardTitle>
            <CardDescription className="flex flex-wrap gap-2 items-center text-xs">
              <Badge variant="outline">{meta.label}</Badge>
              {item.due_date && (
                <span className="text-muted-foreground">
                  Prazo: {new Date(item.due_date).toLocaleDateString("pt-BR")}
                </span>
              )}
              {progress && (
                <span className="font-medium">
                  {progress.completion_rate}% concluído (
                  {progress.total_completed}/{progress.total_assigned})
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {item.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {item.description}
            </p>
          )}
          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary inline-flex items-center gap-1"
            >
              Abrir link <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Progresso por colaborador
            </p>
            {assignmentsQuery.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma atribuição.
              </p>
            ) : (
              <div className="rounded-md border divide-y">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span>{a.user?.full_name ?? "—"}</span>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: "not_seen" | "seen" | "in_progress" | "completed";
}) {
  const map = {
    not_seen: { label: "Não visto", className: "bg-muted text-foreground" },
    seen: { label: "Visto", className: "bg-blue-100 text-blue-700" },
    in_progress: {
      label: "Em progresso",
      className: "bg-amber-100 text-amber-700",
    },
    completed: {
      label: "Concluído",
      className: "bg-emerald-100 text-emerald-700",
    },
  } as const;
  const { label, className } = map[status];
  return <Badge className={className}>{label}</Badge>;
}

// ---------------------------------------------------------------------------
// MY PENDING (colaborador vê conteúdo atribuído a ele)
// ---------------------------------------------------------------------------
function MyPendingTab({ userId }: { userId: string | undefined }) {
  const { toast } = useToast();
  const assignmentsQuery = useMyContentAssignments(userId);
  const updateMutation = useUpdateAssignmentStatus();
  const assignments = assignmentsQuery.data ?? [];

  const pending = assignments.filter((a) => a.status !== "completed");
  const done = assignments.filter((a) => a.status === "completed");

  const handleStatus = async (
    assignmentId: string,
    status: "seen" | "in_progress" | "completed",
  ) => {
    try {
      await updateMutation.mutateAsync({ assignmentId, status });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    }
  };

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
            icon={GraduationCap}
            title="Nenhum conteúdo pendente"
            description="Quando seu gestor publicar treinamentos, leituras ou processos, eles aparecem aqui."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">
            Pendentes ({pending.length})
          </h2>
          {pending.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onMarkSeen={() => handleStatus(a.id, "seen")}
              onMarkInProgress={() => handleStatus(a.id, "in_progress")}
              onMarkCompleted={() => handleStatus(a.id, "completed")}
            />
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">
            Concluídos ({done.length})
          </h2>
          {done.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onMarkSeen={() => {}}
              onMarkInProgress={() => {}}
              onMarkCompleted={() => {}}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onMarkSeen,
  onMarkInProgress,
  onMarkCompleted,
  compact,
}: {
  assignment: {
    id: string;
    status: "not_seen" | "seen" | "in_progress" | "completed";
    item?: ContentItemRow | null;
  };
  onMarkSeen: () => void;
  onMarkInProgress: () => void;
  onMarkCompleted: () => void;
  compact?: boolean;
}) {
  const item = assignment.item;
  if (!item) return null;
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const isCompleted = assignment.status === "completed";

  // Auto-mark as seen when the user opens the link.
  const handleOpenLink = () => {
    if (assignment.status === "not_seen") onMarkSeen();
  };

  return (
    <Card className={isCompleted ? "opacity-70" : ""}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={`${meta.color} text-white rounded-md p-2 shrink-0`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{item.title}</CardTitle>
            <CardDescription className="flex flex-wrap gap-2 items-center text-xs">
              <Badge variant="outline">{meta.label}</Badge>
              {item.due_date && (
                <span className="text-muted-foreground">
                  Prazo: {new Date(item.due_date).toLocaleDateString("pt-BR")}
                </span>
              )}
              <StatusBadge status={assignment.status} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {!compact && (
        <CardContent className="space-y-3">
          {item.description && (
            <p className="text-sm whitespace-pre-line">{item.description}</p>
          )}
          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noreferrer"
              onClick={handleOpenLink}
              className="text-sm text-primary inline-flex items-center gap-1"
            >
              Abrir link <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {assignment.status === "not_seen" && (
              <Button variant="outline" size="sm" onClick={onMarkSeen}>
                <Eye className="h-4 w-4 mr-1" /> Marcar como visto
              </Button>
            )}
            {assignment.status === "seen" && (
              <Button variant="outline" size="sm" onClick={onMarkInProgress}>
                Em progresso
              </Button>
            )}
            {!isCompleted && (
              <Button size="sm" onClick={onMarkCompleted}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar como concluído
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
