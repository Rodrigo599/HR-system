import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, EyeOff, Hourglass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SmartFormRenderer } from "@/components/smartforms/SmartFormRenderer";
import { useSmartForm } from "@/hooks/api/useSmartForms";
import { useSubmitSelfEvaluation, useSubmitManagerEvaluation } from "@/hooks/api/useEvaluations";
import { extractScaleFields } from "@/lib/evaluationDataTransform";
import { EvaluationRadarChart } from "./EvaluationRadarChart";
import { useAuth } from "@/contexts/AuthContext";
import type { SmartFormConfig, I18nText } from "@/types/smartforms";
import type { Evaluation } from "@/types/api";

interface EvaluationSmartFormProps {
  evaluation: Evaluation;
  onSaved: () => void;
  onBack?: () => void;
}

function resolveLabel(text: I18nText | undefined, lang = "pt"): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[lang as keyof typeof text] ?? text.pt ?? text.es ?? "";
}

function ReadOnlyResponseBlock({
  title,
  data,
  config,
  lang,
}: {
  title: string;
  data: Record<string, unknown>;
  config: SmartFormConfig;
  lang: string;
}) {
  const scaleFields = extractScaleFields(config);
  const entries = scaleFields
    .map((f) => ({ key: f.name!, label: resolveLabel(f.label, lang), value: data[f.name!] }))
    .filter(({ value }) => value !== null && value !== undefined && value !== "");

  const allKeys = new Set(scaleFields.map((f) => f.name!));
  const extraEntries = Object.entries(data)
    .filter(([k, v]) => !allKeys.has(k) && v !== null && v !== undefined && v !== "")
    .map(([k, v]) => ({ key: k, label: k.replace(/-/g, " "), value: v }));

  const allEntries = [...entries, ...extraEntries];
  if (allEntries.length === 0) return null;

  return (
    <div className="rounded-md border bg-muted/30 p-4 space-y-2">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {allEntries.map(({ key, label, value }) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-muted-foreground capitalize">{label}</span>
            <span className="font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvaluationSmartForm({ evaluation, onSaved, onBack }: EvaluationSmartFormProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  const isGestor = hasRole("gestor") || hasRole("admin");
  const isBlind = evaluation.flow_type === "blind_simultaneous";

  const { data: smartForm, isLoading: formLoading } = useSmartForm(evaluation.form_id ?? "");
  const submitSelf = useSubmitSelfEvaluation(evaluation.id);
  const submitManager = useSubmitManagerEvaluation(evaluation.id);

  const selfResponse = evaluation.self_responses;
  const managerResponse = evaluation.manager_responses;

  // Determinar fase
  type Phase = "self" | "manager" | "readonly";
  type BlindState = "awaiting_my_input" | "awaiting_other" | "reveal" | "na";

  let phase: Phase = "readonly";
  let blindState: BlindState = "na";

  if (isBlind) {
    const isCollaborator = evaluation.assigned_to === user?.id;
    const revealed =
      evaluation.status === "both_submitted" ||
      evaluation.status === "completed" ||
      evaluation.status === "closed";

    if (revealed) {
      phase = "readonly";
      blindState = "reveal";
    } else if (isCollaborator) {
      if (selfResponse) { phase = "readonly"; blindState = "awaiting_other"; }
      else { phase = "self"; blindState = "awaiting_my_input"; }
    } else if (isGestor) {
      if (managerResponse) { phase = "readonly"; blindState = "awaiting_other"; }
      else { phase = "manager"; blindState = "awaiting_my_input"; }
    }
  } else {
    if (evaluation.status === "pending_self" && evaluation.assigned_to === user?.id) {
      phase = "self";
    } else if (evaluation.status === "pending_manager" && isGestor) {
      phase = "manager";
    }
  }

  // Em blind, esconder resposta do outro lado antes de revelar
  const viewSelf = isBlind && blindState !== "reveal" && isGestor ? null : selfResponse;
  const viewManager = isBlind && blindState !== "reveal" && !isGestor ? null : managerResponse;

  const config = smartForm?.config ?? null;

  const radarData = config && viewSelf && viewManager
    ? (() => {
        const fields = extractScaleFields(config);
        return fields.map(f => ({
          topic: resolveLabel(f.label, language),
          autoavaliacao: Number(viewSelf[f.name!] ?? 0),
          gestor: Number(viewManager[f.name!] ?? 0),
          media: (Number(viewSelf[f.name!] ?? 0) + Number(viewManager[f.name!] ?? 0)) / 2,
        }));
      })()
    : [];

  if (formLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!evaluation.form_id) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Esta avaliação não tem formulário vinculado.
          </p>
          {onBack && <Button variant="outline" size="sm" onClick={onBack}>Voltar</Button>}
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Formulário não encontrado. Verifique se o template foi removido.
          </p>
          {onBack && <Button variant="outline" size="sm" onClick={onBack}>Voltar</Button>}
        </CardContent>
      </Card>
    );
  }

  if (isBlind && blindState === "awaiting_other") {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <Hourglass className="h-10 w-10 text-amber-500 mx-auto" />
          <div>
            <p className="font-semibold">Você já preencheu sua avaliação</p>
            <p className="text-sm text-muted-foreground">
              Aguardando o outro lado submeter para liberar o comparativo.
            </p>
          </div>
          {onBack && <Button variant="outline" size="sm" onClick={onBack}>Voltar</Button>}
        </CardContent>
      </Card>
    );
  }

  if (isBlind && blindState === "reveal") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base">Comparativo</CardTitle>
            <Badge className="bg-emerald-600 text-white">Avaliação revelada</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Compare as percepções e converse sobre os pontos com maior diferença.
            </p>
          </CardContent>
        </Card>
        <EvaluationRadarChart radarData={radarData} variant="blind" />
        {viewSelf && <ReadOnlyResponseBlock title="Autoavaliação (liderado)" data={viewSelf} config={config} lang={language} />}
        {viewManager && <ReadOnlyResponseBlock title="Avaliação do líder" data={viewManager} config={config} lang={language} />}
      </div>
    );
  }

  if (phase === "self") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base">{t("selfEvaluation")}</CardTitle>
            <Badge variant="outline">Autoavaliação</Badge>
            {isBlind && <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Cego</Badge>}
          </CardHeader>
          {isBlind && (
            <CardContent className="pt-0 pb-3">
              <p className="text-xs text-muted-foreground">
                Seu líder também está avaliando agora, sem ver suas respostas.
              </p>
            </CardContent>
          )}
        </Card>
        <SmartFormRenderer
          config={config}
          readOnly={false}
          initialValues={viewSelf ?? {}}
          onSubmit={(values) => {
            submitSelf.mutate({ responses: values }, {
              onSuccess: () => {
                toast({ title: t("success"), description: t("evaluationUpdated") });
                onSaved();
              },
              onError: (err) => {
                toast({ title: t("error"), description: err instanceof Error ? err.message : "Erro ao salvar", variant: "destructive" });
              },
            });
          }}
        />
      </div>
    );
  }

  if (phase === "manager") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base">{t("managerEvaluation")}</CardTitle>
            <Badge variant="secondary">Avaliação do Gestor</Badge>
            {isBlind && <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Cego</Badge>}
          </CardHeader>
          {isBlind && (
            <CardContent className="pt-0 pb-3">
              <p className="text-xs text-muted-foreground">
                O liderado também está avaliando agora.
              </p>
            </CardContent>
          )}
        </Card>
        {!isBlind && viewSelf && (
          <ReadOnlyResponseBlock title="Respostas do colaborador:" data={viewSelf} config={config} lang={language} />
        )}
        <SmartFormRenderer
          config={config}
          readOnly={false}
          initialValues={viewManager ?? {}}
          onSubmit={(values) => {
            submitManager.mutate({ responses: values }, {
              onSuccess: () => {
                toast({ title: t("success"), description: t("evaluationUpdated") });
                onSaved();
              },
              onError: (err) => {
                toast({ title: t("error"), description: err instanceof Error ? err.message : "Erro ao salvar", variant: "destructive" });
              },
            });
          }}
        />
      </div>
    );
  }

  // Readonly (completed/closed)
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <CardTitle className="text-base">{t("evaluationResults")}</CardTitle>
          <Badge className="bg-green-600 text-white hover:bg-green-700">Concluída</Badge>
        </CardHeader>
      </Card>
      {viewSelf && <ReadOnlyResponseBlock title="Autoavaliação" data={viewSelf} config={config} lang={language} />}
      {viewManager && <ReadOnlyResponseBlock title="Avaliação do Gestor" data={viewManager} config={config} lang={language} />}
      {!viewSelf && !viewManager && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">{t("noData")}</CardContent>
        </Card>
      )}
    </div>
  );
}

export default EvaluationSmartForm;
