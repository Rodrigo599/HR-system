import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/lib/demoMode";

// ============================================================
// Tipos
// ============================================================

export type PointwiseFeedbackType = "kudos" | "adjustment" | "observation";
export type PointwiseFeedbackVisibility = "private" | "with_manager";

export interface PointwiseFeedback {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: PointwiseFeedbackType;
  content: string;
  visibility: PointwiseFeedbackVisibility;
  created_at: string;
}

// ============================================================
// DEMO_MODE: store em memoria pra simular o ciclo completo
// ============================================================

const MOCK_USER_PEDRO = "demo-user";

const mockFeedbacks: PointwiseFeedback[] = [
  {
    id: "pf-seed-1",
    from_user_id: MOCK_USER_PEDRO,
    to_user_id: "user-nacho",
    type: "kudos",
    content: "Mandou bem na apresentacao do report Q1.",
    visibility: "with_manager",
    created_at: new Date(Date.now() - 86_400_000 * 2).toISOString(),
  },
];

// ============================================================
// Fetchers
// ============================================================

export async function fetchFeedbackGiven(
  userId: string,
): Promise<PointwiseFeedback[]> {
  if (DEMO_MODE) {
    return mockFeedbacks
      .filter((f) => f.from_user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await supabase
    .from("pointwise_feedback")
    .select("*")
    .eq("from_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PointwiseFeedback[];
}

export async function fetchFeedbackReceived(
  userId: string,
): Promise<PointwiseFeedback[]> {
  if (DEMO_MODE) {
    return mockFeedbacks
      .filter((f) => f.to_user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await supabase
    .from("pointwise_feedback")
    .select("*")
    .eq("to_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PointwiseFeedback[];
}

export async function fetchFeedbackForReport(
  reportUserId: string,
): Promise<PointwiseFeedback[]> {
  if (DEMO_MODE) {
    return mockFeedbacks
      .filter(
        (f) =>
          (f.from_user_id === reportUserId || f.to_user_id === reportUserId) &&
          f.visibility === "with_manager",
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  // RLS ja filtra: gestor so ve linhas com visibility='with_manager' ou onde
  // ele e parte. Esse OR busca o feedback dado E recebido pelo liderado.
  const { data, error } = await supabase
    .from("pointwise_feedback")
    .select("*")
    .or(`from_user_id.eq.${reportUserId},to_user_id.eq.${reportUserId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PointwiseFeedback[];
}

// ============================================================
// Mutations
// ============================================================

interface GiveFeedbackParams {
  to_user_id: string;
  type: PointwiseFeedbackType;
  content: string;
  visibility: PointwiseFeedbackVisibility;
}

export async function giveFeedback(
  params: GiveFeedbackParams,
  authorUserId: string,
): Promise<PointwiseFeedback> {
  if (DEMO_MODE) {
    const row: PointwiseFeedback = {
      id: `pf-${Date.now()}`,
      from_user_id: authorUserId,
      ...params,
      created_at: new Date().toISOString(),
    };
    mockFeedbacks.unshift(row);
    console.log("[DEMO] giveFeedback", row);
    return row;
  }
  const { data, error } = await supabase
    .from("pointwise_feedback")
    .insert({ from_user_id: authorUserId, ...params })
    .select("*")
    .single();
  if (error) throw error;
  return data as PointwiseFeedback;
}

export async function deleteFeedback(id: string): Promise<void> {
  if (DEMO_MODE) {
    const idx = mockFeedbacks.findIndex((f) => f.id === id);
    if (idx >= 0) mockFeedbacks.splice(idx, 1);
    return;
  }
  const { error } = await supabase
    .from("pointwise_feedback")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Hooks (TanStack)
// ============================================================

export function useMyFeedbackGiven(userId: string | undefined) {
  return useQuery({
    queryKey: ["pointwise-feedback", "given", userId],
    queryFn: () => fetchFeedbackGiven(userId!),
    enabled: !!userId,
  });
}

export function useMyFeedbackReceived(userId: string | undefined) {
  return useQuery({
    queryKey: ["pointwise-feedback", "received", userId],
    queryFn: () => fetchFeedbackReceived(userId!),
    enabled: !!userId,
  });
}

export function useFeedbackForReport(reportUserId: string | undefined) {
  return useQuery({
    queryKey: ["pointwise-feedback", "report", reportUserId],
    queryFn: () => fetchFeedbackForReport(reportUserId!),
    enabled: !!reportUserId,
  });
}

export function useGiveFeedback(authorUserId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: GiveFeedbackParams) => {
      if (!authorUserId)
        throw new Error("useGiveFeedback: authorUserId obrigatorio");
      return giveFeedback(params, authorUserId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pointwise-feedback"] });
    },
  });
}

export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFeedback,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pointwise-feedback"] });
    },
  });
}
