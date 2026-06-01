import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, EyeOff, Hourglass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SmartFormRenderer } from "@/components/smartforms/SmartFormRenderer";
import {
  useEvaluationForms,
  useSaveEvaluationResponse,
} from "@/hooks/useEvaluationForms";
import { extractScaleFields } from "@/lib/evaluationDataTransform";
import { EvaluationRadarChart } from "./EvaluationRadarChart";
import type { SmartFormConfig, I18nText } from "@/types/smartforms";
import type { Evaluation } from "@/types/database";

// ============================================================
// Props
// ============================================================

interface EvaluationSmartFormProps {
  evaluation: Evaluation;
  onSaved: () => void;
  onBack?: () => void;
}

// ============================================================
// Helper: resolve I18nText para string simples
// ============================================================

function resolveLabel(text: I18nText | undefined, lang = "pt"): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[lang as keyof typeof text] ?? text.pt ?? text.es ?? "";
}

// ============================================================
// Subcomponente: respostas scale em modo somente-leitura
// ============================================================

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
    .map((f) => ({
      key: f.name!,
      label: resolveLabel(f.label, lang),
      value: data[f.name!],
    }))
    .filter(
      ({ value }) => value !== null && value !== undefined && value !== "",
    );

  const allKeys = new Set(scaleFields.map((f) => f.name!));
  const extraEntries = Object.entries(data)
    .filter(
      ([k, v]) => !allKeys.has(k) && v !== null && v !== undefined && v !== "",
    )
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

// ============================================================
// Componente principal
// ============================================================

export function EvaluationSmartForm({
  evaluation,
  onSaved,
  onBack,
}: EvaluationSmartFormProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const {
    config,
    phase,
    selfResponse,
    managerResponse,
    isLoading,
    flowType,
    blindState,
    radarData,
  } = useEvaluationForms(evaluation);

  const saveResponse = useSaveEvaluationResponse();
  const isBlind = flowType === "blind_simultaneous";

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---- Avaliacao sem formulario ou template ausente ----
  if (!evaluation.form_id) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Esta avaliação não tem formulário vinculado. Crie uma nova com um
            template.
          </p>
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  if (!config) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Formulário não encontrado. Verifique se o template foi removido do
            sistema.
          </p>
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // ---- BLIND: aguardando o outro lado ----
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
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // ---- BLIND: revelado (both_submitted ou completed) — comparativo ----
  if (isBlind && blindState === "reveal") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base">Comparativo</CardTitle>
            <Badge className="bg-emerald-600 text-white">
              Avaliação revelada
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vermelho = líder. Azul = liderado. Compare as percepções e
              converse sobre os pontos com maior diferença.
            </p>
          </CardContent>
        </Card>

        <EvaluationRadarChart radarData={radarData} variant="blind" />

        {selfResponse && (
          <ReadOnlyResponseBlock
            title="Autoavaliação (liderado)"
            data={selfResponse}
            config={config}
            lang={language}
          />
        )}
        {managerResponse && (
          <ReadOnlyResponseBlock
            title="Avaliação do líder"
            data={managerResponse}
            config={config}
            lang={language}
          />
        )}
      </div>
    );
  }

  // ---- Fase de Autoavaliacao ----
  if (phase === "self") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base">{t("selfEvaluation")}</CardTitle>
            <Badge variant="outline">Autoavaliação</Badge>
            {isBlind && (
              <Badge variant="secondary" className="gap-1">
                <EyeOff className="h-3 w-3" /> Cego
              </Badge>
            )}
          </CardHeader>
          {isBlind && (
            <CardContent className="pt-0 pb-3">
              <p className="text-xs text-muted-foreground">
                Seu líder também está avaliando agora, sem ver suas respostas.
                Quando ambos submeterem, o comparativo aparece.
              </p>
            </CardContent>
          )}
        </Card>

        <SmartFormRenderer
          config={config}
          readOnly={false}
          initialValues={selfResponse ?? {}}
          onSubmit={(values) => {
            saveResponse.mutate(
              {
                evaluationId: evaluation.id,
                formId: evaluation.form_id ?? "",
                phase: "self",
                data: values,
                assignedTo: evaluation.assigned_to,
                flowType,
                currentStatus: evaluation.status,
              },
              {
                onSuccess: () => {
                  toast({
                    title: t("success"),
                    description: t("evaluationUpdated"),
                  });
                  onSaved();
                },
                onError: (err) => {
                  toast({
                    title: t("error"),
                    description:
                      err instanceof Error ? err.message : "Erro ao salvar",
                    variant: "destructive",
                  });
                },
              },
            );
          }}
        />
      </div>
    );
  }

  // ---- Fase de Avaliacao do Gestor ----
  if (phase === "manager") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base">
              {t("managerEvaluation")}
            </CardTitle>
            <Badge variant="secondary">Avaliação do Gestor</Badge>
            {isBlind && (
              <Badge variant="secondary" className="gap-1">
                <EyeOff className="h-3 w-3" /> Cego
              </Badge>
            )}
          </CardHeader>
          {isBlind && (
            <CardContent className="pt-0 pb-3">
              <p className="text-xs text-muted-foreground">
                O liderado também está avaliando agora. Você não verá as
                respostas dele até ambos submeterem.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Em sequencial, mostra autoavaliacao do liderado em modo leitura */}
        {!isBlind && selfResponse && (
          <ReadOnlyResponseBlock
            title="Respostas do colaborador:"
            data={selfResponse}
            config={config}
            lang={language}
          />
        )}

        <SmartFormRenderer
          config={config}
          readOnly={false}
          initialValues={managerResponse ?? {}}
          onSubmit={(values) => {
            saveResponse.mutate(
              {
                evaluationId: evaluation.id,
                formId: evaluation.form_id ?? "",
                phase: "manager",
                data: values,
                assignedTo: evaluation.assigned_to,
                flowType,
                currentStatus: evaluation.status,
              },
              {
                onSuccess: () => {
                  toast({
                    title: t("success"),
                    description: t("evaluationUpdated"),
                  });
                  onSaved();
                },
                onError: (err) => {
                  toast({
                    title: t("error"),
                    description:
                      err instanceof Error ? err.message : "Erro ao salvar",
                    variant: "destructive",
                  });
                },
              },
            );
          }}
        />
      </div>
    );
  }

  // ---- Fase Readonly (completed / closed) — fluxo sequencial ----
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <CardTitle className="text-base">{t("evaluationResults")}</CardTitle>
          <Badge className="bg-green-600 text-white hover:bg-green-700">
            Concluída
          </Badge>
        </CardHeader>
      </Card>

      {selfResponse && (
        <ReadOnlyResponseBlock
          title="Autoavaliação"
          data={selfResponse}
          config={config}
          lang={language}
        />
      )}

      {managerResponse && (
        <ReadOnlyResponseBlock
          title="Avaliação do Gestor"
          data={managerResponse}
          config={config}
          lang={language}
        />
      )}

      {!selfResponse && !managerResponse && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {t("noData")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EvaluationSmartForm;
