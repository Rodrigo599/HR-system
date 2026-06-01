import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/lib/demoMode";
import type { Database } from "@/integrations/supabase/types";

export type ContentType = Database["public"]["Enums"]["content_type"];
export type ContentStatus = Database["public"]["Enums"]["content_status"];
export type ContentItemRow =
  Database["public"]["Tables"]["content_items"]["Row"];
export type ContentAssignmentRow =
  Database["public"]["Tables"]["content_assignments"]["Row"];

export interface ContentItem extends ContentItemRow {
  assignments_count?: number;
  completed_count?: number;
}

export interface ContentAssignment extends ContentAssignmentRow {
  item?: ContentItemRow;
  user?: { full_name: string; user_id: string };
}

// ---------------------------------------------------------------------------
// QUERIES — gestor
// ---------------------------------------------------------------------------

async function fetchContentItemsCreated(): Promise<ContentItem[]> {
  if (DEMO_MODE) return [];
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useContentItemsCreated(enabled = true) {
  return useQuery({
    queryKey: ["content-items", "created"],
    queryFn: fetchContentItemsCreated,
    enabled,
  });
}

async function fetchContentItemAssignments(
  itemId: string,
): Promise<ContentAssignment[]> {
  if (DEMO_MODE) return [];
  const { data, error } = await supabase
    .from("content_assignments")
    .select("*")
    .eq("item_id", itemId)
    .order("assigned_at", { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Hidratar nome do colaborador
  const userIds = Array.from(new Set(data.map((a) => a.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", userIds);
  const nameByUser = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.full_name]),
  );

  return data.map((a) => ({
    ...a,
    user: { user_id: a.user_id, full_name: nameByUser.get(a.user_id) ?? "—" },
  }));
}

export function useContentItemAssignments(itemId: string | null) {
  return useQuery({
    queryKey: ["content-assignments", itemId],
    queryFn: () => fetchContentItemAssignments(itemId as string),
    enabled: !!itemId,
  });
}

// ---------------------------------------------------------------------------
// QUERIES — colaborador
// ---------------------------------------------------------------------------

async function fetchMyContentAssignments(
  userId: string,
): Promise<ContentAssignment[]> {
  if (DEMO_MODE) return [];
  const { data, error } = await supabase
    .from("content_assignments")
    .select("*, item:content_items(*)")
    .eq("user_id", userId)
    .order("assigned_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContentAssignment[];
}

export function useMyContentAssignments(userId: string | undefined) {
  return useQuery({
    queryKey: ["content-assignments", "mine", userId],
    queryFn: () => fetchMyContentAssignments(userId as string),
    enabled: !!userId,
  });
}

// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------

interface CreateContentInput {
  createdByUserId: string;
  type: ContentType;
  title: string;
  description?: string;
  linkUrl?: string;
  fileUrl?: string;
  dueDate?: string; // YYYY-MM-DD
  audienceUserIds: string[]; // user_id de cada alvo (1+); team-all = lista completa de liderados
}

export function useCreateContentItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContentInput): Promise<ContentItemRow> => {
      const { data: item, error } = await supabase
        .from("content_items")
        .insert({
          created_by: input.createdByUserId,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          link_url: input.linkUrl ?? null,
          file_url: input.fileUrl ?? null,
          due_date: input.dueDate ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      if (!item) throw new Error("Falha ao criar item");

      if (input.audienceUserIds.length > 0) {
        const rows = input.audienceUserIds.map((uid) => ({
          item_id: item.id,
          user_id: uid,
        }));
        const { error: aErr } = await supabase
          .from("content_assignments")
          .insert(rows);
        if (aErr) throw aErr;
      }
      return item;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-items"] });
      qc.invalidateQueries({ queryKey: ["content-assignments"] });
    },
  });
}

interface UpdateAssignmentStatusInput {
  assignmentId: string;
  status: ContentStatus;
}

export function useUpdateAssignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assignmentId,
      status,
    }: UpdateAssignmentStatusInput) => {
      const patch: Database["public"]["Tables"]["content_assignments"]["Update"] =
        { status };
      const now = new Date().toISOString();
      if (status === "seen") patch.seen_at = now;
      if (status === "completed") {
        patch.completed_at = now;
        if (!patch.seen_at) patch.seen_at = now;
      }
      const { error } = await supabase
        .from("content_assignments")
        .update(patch)
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-assignments"] });
    },
  });
}

export function useDeleteContentItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-items"] });
      qc.invalidateQueries({ queryKey: ["content-assignments"] });
    },
  });
}

// ---------------------------------------------------------------------------
// AGREGADO (KPI gestor) — usa RPC
// ---------------------------------------------------------------------------

export interface ContentItemProgress {
  total_assigned: number;
  total_seen: number;
  total_in_progress: number;
  total_completed: number;
  completion_rate: number;
}

export function useContentItemProgress(itemId: string | null) {
  return useQuery({
    queryKey: ["content-item-progress", itemId],
    queryFn: async (): Promise<ContentItemProgress | null> => {
      if (!itemId || DEMO_MODE) return null;
      const { data, error } = await supabase.rpc("content_item_progress", {
        p_item_id: itemId,
      });
      if (error) throw error;
      const row = (data ?? [])[0];
      return row
        ? {
            total_assigned: Number(row.total_assigned),
            total_seen: Number(row.total_seen),
            total_in_progress: Number(row.total_in_progress),
            total_completed: Number(row.total_completed),
            completion_rate: Number(row.completion_rate),
          }
        : null;
    },
    enabled: !!itemId,
  });
}
