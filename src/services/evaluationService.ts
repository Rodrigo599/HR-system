import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/lib/demoMode";
import { mockEvaluations, mockTopics, mockResponses } from "@/lib/mockData";
import type {
  Evaluation,
  EvaluationTopic,
  EvaluationResponse,
  EvaluationType,
} from "@/types/database";

interface FetchEvaluationsParams {
  userId: string;
  isAdmin: boolean;
  isGestor: boolean;
}

export async function fetchEvaluations({
  userId,
  isAdmin,
  isGestor,
}: FetchEvaluationsParams): Promise<Evaluation[]> {
  if (DEMO_MODE) {
    return mockEvaluations.map((e, i) =>
      i < 4 ? { ...e, assigned_to: userId } : { ...e, created_by: userId },
    );
  }
  let query = supabase.from("evaluations").select("*");
  if (!isAdmin && !isGestor) {
    query = query.eq("assigned_to", userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Evaluation[];
}

export async function fetchEvaluationsByYear(
  year: number,
  userId: string,
  isAdmin: boolean,
  isGestor: boolean,
): Promise<Evaluation[]> {
  if (DEMO_MODE) {
    return mockEvaluations.filter((e) => e.year === year);
  }
  // A-08: incluir join com profiles para exibir nome do avaliado no Historico
  let query = supabase
    .from("evaluations")
    .select(
      "*, assignee:profiles!evaluations_assigned_to_fkey(user_id, full_name)",
    )
    .eq("year", year)
    .order("month", { ascending: false });
  if (!isAdmin && !isGestor) {
    query = query.eq("assigned_to", userId);
  }
  const { data, error } = await query;
  if (error) {
    // Fallback sem join se foreign key nao existir com esse nome
    const { data: fallback, error: err2 } = await supabase
      .from("evaluations")
      .select("*")
      .eq("year", year)
      .order("month", { ascending: false });
    if (err2) throw err2;
    return (fallback ?? []) as Evaluation[];
  }
  return (data ?? []) as Evaluation[];
}

/** @deprecated Usar SmartForms — evaluation_topics mantida apenas como backup. */
export async function fetchEvaluationTopics(): Promise<EvaluationTopic[]> {
  if (DEMO_MODE) return mockTopics;
  const { data, error } = await supabase.from("evaluation_topics").select("*");
  if (error) throw error;
  return (data ?? []) as EvaluationTopic[];
}

/** @deprecated Usar useEvaluationForms — evaluation_responses mantida apenas como backup. */
export async function fetchEvaluationResponses(
  evaluationId: string,
): Promise<EvaluationResponse[]> {
  if (DEMO_MODE) {
    return mockResponses.filter((mr) => mr.evaluation_id === evaluationId);
  }
  const { data, error } = await supabase
    .from("evaluation_responses")
    .select("*, topic:evaluation_topics(*)")
    .eq("evaluation_id", evaluationId);
  if (error) throw error;
  return (data ?? []) as EvaluationResponse[];
}

interface CreateEvaluationParams {
  created_by: string;
  assigned_to: string;
  type: EvaluationType;
  month: number;
  year: number;
  form_id: string;
  flow_type?: "sequential" | "blind_simultaneous";
}

export async function createEvaluation(
  params: CreateEvaluationParams,
): Promise<void> {
  if (DEMO_MODE) return;
  const { error } = await supabase.from("evaluations").insert({
    ...params,
    flow_type: params.flow_type ?? "sequential",
    status: "pending_self",
  });
  if (error) throw error;
}

export function useEvaluations(params: FetchEvaluationsParams | null) {
  return useQuery({
    queryKey: ["evaluations", params?.userId],
    queryFn: () => fetchEvaluations(params!),
    enabled: !!params,
  });
}

export function useEvaluationsByYear(
  year: number,
  userId: string,
  isAdmin: boolean,
  isGestor: boolean,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["evaluations", "history", year, userId],
    queryFn: () => fetchEvaluationsByYear(year, userId, isAdmin, isGestor),
    enabled,
  });
}

/** @deprecated Usar SmartForms — evaluation_topics mantida apenas como backup. */
export function useEvaluationTopics() {
  return useQuery({
    queryKey: ["evaluation-topics"],
    queryFn: fetchEvaluationTopics,
  });
}

/** @deprecated Usar useEvaluationForms — evaluation_responses mantida apenas como backup. */
export function useEvaluationResponses(evaluationId: string | null) {
  return useQuery({
    queryKey: ["evaluation-responses", evaluationId],
    queryFn: () => fetchEvaluationResponses(evaluationId!),
    enabled: !!evaluationId,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}
