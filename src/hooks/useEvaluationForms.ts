import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/lib/demoMode";
import { useSmartFormById } from "./useSmartForms";
import { useAuth } from "@/contexts/AuthContext";
import {
  responsesToRadarData,
  responsesToPdfScores,
} from "@/lib/evaluationDataTransform";
import type { Evaluation } from "@/types/database";
import type { SmartFormConfig } from "@/types/smartforms";

// ============================================================
// Tipos
// ============================================================

export type EvaluationFlowType = "sequential" | "blind_simultaneous";
export type BlindUserState =
  | "awaiting_my_input" // ainda preciso preencher
  | "awaiting_other" // ja submeti, aguardando o outro lado
  | "reveal" // ambos submeteram, pode ver
  | "na"; // nao se aplica (sequencial)

export interface EvaluationFormData {
  config: SmartFormConfig | null;
  selfResponse: Record<string, unknown> | null;
  managerResponse: Record<string, unknown> | null;
  phase: "self" | "manager" | "readonly";
  canEdit: boolean;
  isLoading: boolean;
  flowType: EvaluationFlowType;
  blindState: BlindUserState;
  radarData: Array<{
    topic: string;
    autoavaliacao: number;
    gestor: number;
    media: number;
  }>;
  pdfScores: Array<{
    topic: string;
    selfScore: number;
    managerScore: number;
    finalScore: number;
  }>;
}

// ============================================================
// Hook principal
// ============================================================

/**
 * Orquestra SmartForm + respostas para uma avaliacao especifica.
 * Suporta dois fluxos:
 *  - 'sequential' (legado): liderado preenche, depois gestor preenche.
 *  - 'blind_simultaneous': ambos preenchem em paralelo, sem ver o outro ate both_submitted.
 */
export function useEvaluationForms(
  evaluation: Evaluation | null,
): EvaluationFormData {
  const { profile, hasRole } = useAuth();
  const isGestor = hasRole("gestor") || hasRole("admin");
  const flowType =
    (evaluation?.flow_type as EvaluationFlowType) ?? "sequential";
  const isBlind = flowType === "blind_simultaneous";

  // Buscar template do SmartForm
  const { data: smartForm, isLoading: formLoading } = useSmartFormById(
    evaluation?.form_id,
  );

  // Buscar respostas vinculadas a esta avaliacao
  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ["eval-form-responses", evaluation?.id],
    queryFn: async () => {
      if (DEMO_MODE || !evaluation?.id) return [];
      const { data, error } = await supabase
        .from("smart_form_responses")
        .select("*")
        .eq("evaluation_id", evaluation.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!evaluation?.id,
  });

  // Separar respostas por phase
  const selfResp = responses?.find((r: any) => r.phase === "self");
  const mgrResp = responses?.find((r: any) => r.phase === "manager");
  const selfData = (selfResp?.data as Record<string, unknown>) ?? null;
  const managerData = (mgrResp?.data as Record<string, unknown>) ?? null;

  // Determinar phase do usuario atual nesta avaliacao
  let phase: "self" | "manager" | "readonly" = "readonly";
  let blindState: BlindUserState = "na";

  if (isBlind && evaluation) {
    const isLeaderUser = evaluation.assigned_to === profile?.user_id;
    const status = evaluation.status;
    const revealed =
      status === "both_submitted" ||
      status === "completed" ||
      status === "closed";

    if (revealed) {
      phase = "readonly";
      blindState = "reveal";
    } else if (isLeaderUser) {
      // Liderado: ja submeteu se status inclui self_submitted
      const selfDone = !!selfData;
      if (selfDone) {
        phase = "readonly";
        blindState = "awaiting_other";
      } else {
        phase = "self";
        blindState = "awaiting_my_input";
      }
    } else if (isGestor) {
      // Gestor: ja submeteu se status inclui leader_submitted ou tem managerData
      const managerDone = !!managerData;
      if (managerDone) {
        phase = "readonly";
        blindState = "awaiting_other";
      } else {
        phase = "manager";
        blindState = "awaiting_my_input";
      }
    }
  } else if (evaluation) {
    // Fluxo sequencial — comportamento legado
    if (
      evaluation.status === "pending_self" &&
      evaluation.assigned_to === profile?.user_id
    ) {
      phase = "self";
    } else if (evaluation.status === "pending_manager" && isGestor) {
      phase = "manager";
    }
  }

  const config = smartForm?.config ?? null;

  // Em blind, antes de revelar, esconder a resposta do outro lado mesmo se vier
  // do servidor (defesa em profundidade — RLS ja restringe, mas UX coerente).
  let viewSelf = selfData;
  let viewManager = managerData;
  if (isBlind && blindState !== "reveal") {
    const isLeaderUser = evaluation?.assigned_to === profile?.user_id;
    if (isLeaderUser) viewManager = null;
    else if (isGestor) viewSelf = null;
  }

  return {
    config,
    selfResponse: viewSelf,
    managerResponse: viewManager,
    phase,
    canEdit: phase !== "readonly",
    isLoading: formLoading || responsesLoading,
    flowType,
    blindState,
    radarData: config
      ? responsesToRadarData(viewSelf, viewManager, config)
      : [],
    pdfScores: config
      ? responsesToPdfScores(viewSelf, viewManager, config)
      : [],
  };
}

// ============================================================
// Mutation: salvar resposta de avaliacao
// ============================================================

interface SaveEvaluationResponseParams {
  evaluationId: string;
  formId: string;
  phase: "self" | "manager";
  data: Record<string, unknown>;
  assignedTo: string;
  flowType?: EvaluationFlowType;
  currentStatus?: string;
}

/**
 * Salva uma resposta (self ou manager) e transiciona o status da avaliacao
 * conforme o flowType:
 *   sequential: self -> pending_manager; manager -> completed
 *   blind     : derivado via funcao SQL public.derive_blind_status
 */
export function useSaveEvaluationResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveEvaluationResponseParams) => {
      if (DEMO_MODE) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nao autenticado");

      // Inserir resposta na tabela unificada
      const { error: insertError } = await supabase
        .from("smart_form_responses")
        .insert({
          form_id: params.formId,
          user_id: user.id,
          evaluation_id: params.evaluationId,
          phase: params.phase,
          assigned_to: params.assignedTo,
          assigned_by: user.id,
          data: params.data,
        });
      if (insertError) throw insertError;

      // Computar proximo status
      let nextStatus: string;
      if (params.flowType === "blind_simultaneous") {
        const { data: derived, error: rpcErr } = await supabase.rpc(
          "derive_blind_status",
          {
            current_status: params.currentStatus ?? "pending_self",
            side: params.phase,
          },
        );
        if (rpcErr) throw rpcErr;
        nextStatus = (derived as string | null) ?? "pending_self";
      } else {
        nextStatus = params.phase === "self" ? "pending_manager" : "completed";
      }

      const { error: updateError } = await supabase
        .from("evaluations")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", params.evaluationId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["eval-form-responses"] });
    },
  });
}
