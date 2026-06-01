import React, { useState } from "react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  User,
  Users as UsersIcon,
  Plus,
  Download,
  ClipboardList,
  Clock,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Evaluation } from "@/types/database";
import { EvaluationRadarChart } from "@/components/evaluations/EvaluationRadarChart";
import { EvaluationSmartForm } from "@/components/evaluations/EvaluationSmartForm";
import { DEMO_MODE } from "@/lib/demoMode";
import { generateEvaluationPdf } from "@/lib/generatePdf";
import {
  useEvaluations,
  useCreateEvaluation,
} from "@/services/evaluationService";
import {
  useCollaborators,
  useDirectReportUserIds,
} from "@/services/profileService";
import { useSmartFormsByCategory } from "@/hooks/useSmartForms";
import { useEvaluationForms } from "@/hooks/useEvaluationForms";
import { useViewMode } from "@/contexts/ViewModeContext";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type EvaluationKind = "cultural" | "performance" | "kpi";

// Deriva o tipo da avaliacao a partir do template selecionado. Como o SmartForm
// nao guarda subcategoria, inferimos pelo slug/nome (avaliacao-desempenho ->
// performance, kpi* -> kpi, default cultural). Evita gravar tudo como cultural.
function deriveEvaluationType(form: {
  slug?: string;
  name?: string;
} | undefined): EvaluationKind {
  if (!form) return "cultural";
  const probe = `${form.slug ?? ""} ${form.name ?? ""}`.toLowerCase();
  if (probe.includes("desempenho") || probe.includes("performance")) return "performance";
  if (probe.includes("kpi")) return "kpi";
  return "cultural";
}

export default function Evaluations() {
  const { profile, isAdmin, isGestor } = useAuth();
  const { viewMode } = useViewMode();
  const { t } = useLanguage();
  const { toast } = useToast();

  // The team tab is visible only when the user has a leadership role AND is currently
  // operating in "Visao Gestor". A pure colaborador (or a gestor in colaborador mode)
  // does not see it.
  const showTeamTab = isAdmin || (isGestor && viewMode === "team");

  // Direct reports' user_ids — used to filter the team tab to real subordinates only.
  const directReportsQuery = useDirectReportUserIds(
    profile?.id,
    isGestor && !isAdmin && showTeamTab,
  );
  const teamUserIds = isAdmin ? null : new Set(directReportsQuery.data ?? []);
  const isInTeam = (assignedTo: string | null | undefined): boolean => {
    if (!assignedTo) return false;
    if (assignedTo === profile?.user_id) return false;
    if (isAdmin) return true;
    return teamUserIds?.has(assignedTo) ?? false;
  };

  const [selectedEvaluation, setSelectedEvaluation] =
    useState<Evaluation | null>(null);
  // Local override list used only for demo-mode optimistic additions
  const [demoEvaluations, setDemoEvaluations] = useState<Evaluation[]>([]);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newCollaboratorId, setNewCollaboratorId] = useState("");
  const [newFormId, setNewFormId] = useState("");
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newBlindMode, setNewBlindMode] = useState(true);

  const currentYear = new Date().getFullYear();

  // Queries
  const evaluationsQuery = useEvaluations(
    profile ? { userId: profile.user_id, isAdmin, isGestor } : null,
  );
  const collaboratorsQuery = useCollaborators(showTeamTab);
  const createMutation = useCreateEvaluation();

  // Setor do colaborador selecionado no dialog "Nova Avaliacao".
  // Quando preenchido, filtra os SmartForms a forms universais (sector_id=NULL)
  // ou do mesmo setor — evita oferecer "Feedback Mensal Recepcao" pra alguem de Growth, p.ex.
  const newCollaboratorSectorId =
    collaboratorsQuery.data?.find((c) => c.user_id === newCollaboratorId)?.sector_id ?? null;

  // SmartForms de categoria "evaluation" para o select do dialog (filtrados por setor)
  const { forms: evalTemplates } = useSmartFormsByCategory(
    "evaluation",
    newCollaboratorId ? newCollaboratorSectorId : undefined,
  );

  // Dados do formulário da avaliação selecionada
  const evalFormData = useEvaluationForms(selectedEvaluation);

  // Ordenacao por urgencia: pending_self primeiro, pending_manager, completed, closed.
  const STATUS_PRIORITY: Record<string, number> = {
    pending_self: 4,
    pending_manager: 3,
    completed: 2,
    closed: 1,
  };
  const sortedEvaluations = [
    ...(evaluationsQuery.data ?? []),
    ...demoEvaluations,
  ].sort(
    (a, b) =>
      (STATUS_PRIORITY[b.status] ?? 0) - (STATUS_PRIORITY[a.status] ?? 0),
  );
  const evaluations: Evaluation[] = sortedEvaluations;
  const collaborators = collaboratorsQuery.data ?? [];

  const loading = evaluationsQuery.isLoading;

  const handleSelectEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
  };

  const handleCreateEvaluation = async () => {
    if (!profile) return;

    if (!newCollaboratorId) {
      toast({
        title: t("error"),
        description: t("selectCollaborator"),
        variant: "destructive",
      });
      return;
    }
    if (!newFormId) {
      toast({
        title: t("error"),
        description: "Selecione um formulário de avaliação",
        variant: "destructive",
      });
      return;
    }
    if (!newMonth) {
      toast({
        title: t("error"),
        description: t("month"),
        variant: "destructive",
      });
      return;
    }

    const assignedTo = newCollaboratorId;
    const selectedForm = evalTemplates.find((f) => f.id === newFormId);
    const derivedType = deriveEvaluationType(selectedForm);

    try {
      if (DEMO_MODE) {
        const newEval: Evaluation = {
          id: `e-${Date.now()}`,
          created_by: profile.user_id,
          assigned_to: assignedTo,
          status: "pending_self",
          type: derivedType,
          month: newMonth,
          year: newYear,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          form_id: newFormId,
        };
        setDemoEvaluations((prev) => [...prev, newEval]);
        toast({ title: t("evaluationDemoCreated") });
        setCreateOpen(false);
        return;
      }

      await createMutation.mutateAsync({
        created_by: profile.user_id,
        assigned_to: assignedTo,
        type: derivedType,
        month: newMonth,
        year: newYear,
        form_id: newFormId,
        flow_type: newBlindMode ? "blind_simultaneous" : "sequential",
      });

      toast({ title: t("evaluationCreated") });
      setCreateOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: t("error"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const resetCreateForm = () => {
    setNewCollaboratorId("");
    setNewFormId("");
    setNewMonth(new Date().getMonth() + 1);
    setNewYear(new Date().getFullYear());
    setNewBlindMode(true);
  };

  const handleExportPdf = () => {
    if (!selectedEvaluation || evalFormData.pdfScores.length === 0) return;

    const collaboratorName =
      collaborators.find((c) => c.user_id === selectedEvaluation.assigned_to)
        ?.full_name ??
      profile?.full_name ??
      "Colaborador";

    const evaluatorName =
      collaborators.find((c) => c.user_id === selectedEvaluation.created_by)
        ?.full_name ??
      profile?.full_name ??
      "Gestor";

    const scores = evalFormData.pdfScores.map((s) => ({
      topic: s.topic,
      selfScore: s.selfScore ?? null,
      managerScore: s.managerScore ?? null,
      finalScore: s.finalScore ?? null,
    }));

    const validScores = scores.map(
      (s) => s.finalScore ?? s.selfScore ?? s.managerScore ?? 0,
    );
    const overallAverage =
      validScores.length > 0
        ? validScores.reduce((sum, v) => sum + v, 0) / validScores.length
        : 0;

    const statusLabels: Record<string, string> = {
      pending_self: t("pendingSelf"),
      pending_manager: t("pendingManager"),
      completed: t("completed"),
      closed: t("closed"),
    };

    generateEvaluationPdf({
      title: `Avaliação - ${selectedEvaluation.month}/${selectedEvaluation.year}`,
      collaboratorName,
      evaluatorName,
      date: `${selectedEvaluation.month}/${selectedEvaluation.year}`,
      type: selectedEvaluation.type,
      status:
        statusLabels[selectedEvaluation.status] ?? selectedEvaluation.status,
      scores,
      overallAverage,
    });

    toast({ title: t("pdfGenerated") });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending_self: "outline",
      pending_manager: "secondary",
      completed: "default",
      closed: "destructive",
    };
    const labels: Record<string, string> = {
      pending_self: t("pendingSelf"),
      pending_manager: t("pendingManager"),
      completed: t("completed"),
      closed: t("closed"),
      self_submitted: "Liderado preencheu",
      leader_submitted: "Líder preencheu",
      both_submitted: "Comparativo liberado",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
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
        <h1 className="text-2xl font-bold">{t("evaluations")}</h1>
        {showTeamTab && (
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (open) resetCreateForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> {t("newEvaluation")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("createEvaluation")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>{t("selectCollaborator")}</Label>
                  <Select
                    value={newCollaboratorId}
                    onValueChange={setNewCollaboratorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCollaborator")} />
                    </SelectTrigger>
                    <SelectContent>
                      {collaborators
                        .filter((c) =>
                          isAdmin
                            ? true
                            : (directReportsQuery.data ?? []).includes(
                                c.user_id,
                              ),
                        )
                        .map((c) => (
                          <SelectItem key={c.user_id} value={c.user_id}>
                            {c.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formulário de avaliação</Label>
                  <Select value={newFormId} onValueChange={setNewFormId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formulário" />
                    </SelectTrigger>
                    <SelectContent>
                      {evalTemplates.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("month")}</Label>
                    <Select
                      value={String(newMonth)}
                      onValueChange={(v) => setNewMonth(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("year")}</Label>
                    <Input
                      type="number"
                      value={newYear}
                      onChange={(e) => setNewYear(Number(e.target.value))}
                      min={2020}
                      max={2030}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-md border p-3 bg-muted/40">
                  <input
                    id="blind-mode"
                    type="checkbox"
                    className="mt-1"
                    checked={newBlindMode}
                    onChange={(e) => setNewBlindMode(e.target.checked)}
                  />
                  <label htmlFor="blind-mode" className="cursor-pointer flex-1">
                    <span className="text-sm font-medium block">
                      Modo cego simultâneo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Líder e liderado preenchem ao mesmo tempo, sem ver as
                      respostas um do outro. O comparativo aparece quando ambos
                      submeterem.
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={handleCreateEvaluation}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {t("save")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Limpa a avaliação selecionada ao trocar de aba */}
      <Tabs defaultValue="my" onValueChange={() => setSelectedEvaluation(null)}>
        <TabsList>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <User className="h-4 w-4" /> {t("myEvaluations")}
            {evaluations.filter((e) => e.assigned_to === profile?.user_id)
              .length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 text-xs px-1.5 py-0 h-5"
              >
                {
                  evaluations.filter((e) => e.assigned_to === profile?.user_id)
                    .length
                }
              </Badge>
            )}
          </TabsTrigger>
          {showTeamTab && (
            <TabsTrigger value="team" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" /> {t("teamEvaluations")}
              {evaluations.filter((e) => isInTeam(e.assigned_to)).length >
                0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs px-1.5 py-0 h-5"
                >
                  {evaluations.filter((e) => isInTeam(e.assigned_to)).length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          {evaluations.filter((e) => e.assigned_to === profile?.user_id)
            .length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={ClipboardList}
                  title="Você não tem avaliações pendentes"
                  description="Quando seu líder iniciar uma avaliação sua, ela aparece aqui."
                />
              </CardContent>
            </Card>
          ) : (
            evaluations
              .filter((e) => e.assigned_to === profile?.user_id)
              .map((evaluation) => {
                const isPending =
                  evaluation.status === "pending_self" ||
                  evaluation.status === "pending_manager";
                return (
                  <Card
                    key={evaluation.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${isPending ? "border-l-4 border-l-amber-400" : ""}`}
                    onClick={() => handleSelectEvaluation(evaluation)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <CardTitle className="text-base">
                          {t(evaluation.type as any)} - {evaluation.month}/
                          {evaluation.year}
                        </CardTitle>
                      </div>
                      {getStatusBadge(evaluation.status)}
                    </CardHeader>
                  </Card>
                );
              })
          )}
        </TabsContent>

        {showTeamTab && (
          <TabsContent value="team" className="space-y-4">
            {evaluations.filter((e) => isInTeam(e.assigned_to)).length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState
                    icon={ClipboardList}
                    title="Nenhuma avaliação criada"
                    description="Crie a primeira avaliação para um liderado."
                    ctaLabel="Nova avaliação"
                    onCtaClick={() => setCreateOpen(true)}
                  />
                </CardContent>
              </Card>
            ) : (
              evaluations
                .filter((e) => isInTeam(e.assigned_to))
                .map((evaluation) => {
                  const isPending =
                    evaluation.status === "pending_self" ||
                    evaluation.status === "pending_manager";
                  const liderado = collaborators.find(
                    (c) => c.user_id === evaluation.assigned_to,
                  );
                  const lideradoName = liderado?.full_name ?? "Liderado";
                  return (
                    <Card
                      key={evaluation.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${isPending ? "border-l-4 border-l-amber-400" : ""}`}
                      onClick={() => handleSelectEvaluation(evaluation)}
                    >
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                          )}
                          <div className="flex flex-col">
                            <CardTitle className="text-base">
                              {lideradoName}
                            </CardTitle>
                            <CardDescription>
                              {t(evaluation.type as any)} ·{" "}
                              {evaluation.month}/{evaluation.year}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(evaluation.status)}
                      </CardHeader>
                    </Card>
                  );
                })
            )}
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

      {evalFormData.radarData.length > 0 && (
        <EvaluationRadarChart radarData={evalFormData.radarData} />
      )}

      {selectedEvaluation && evalFormData.pdfScores.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleExportPdf}
          >
            <Download className="h-4 w-4" />
            {t("exportPdf")}
          </Button>
        </div>
      )}
    </div>
  );
}
