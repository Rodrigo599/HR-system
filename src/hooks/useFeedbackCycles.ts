import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';

// Marker keys we store inside smart_form_responses.data to keep the feedback flow
// working without a schema change.
export const FEEDBACK_MARKERS = {
  isAnonymous: '_is_anonymous',
  period: '_period',
  isAssignment: '_is_assignment',
} as const;

export interface FeedbackAssignment {
  id: string;
  form_id: string;
  assigned_to: string;
  assigned_by: string;
  period: string; // YYYY-MM
  isAnonymous: boolean;
  submitted: boolean;
}

export interface FeedbackAggregateRow {
  field_name: string;
  response_count: number;
  avg_value: number;
}

/**
 * Lists feedback assignments for the currently logged-in user that are not yet
 * submitted (a "pending" assignment is a row where the data only contains
 * marker keys and submitted_at is null).
 */
export function useMyFeedbackAssignments(userId: string | undefined) {
  return useQuery({
    queryKey: ['feedback-assignments', userId],
    queryFn: async (): Promise<FeedbackAssignment[]> => {
      if (DEMO_MODE) {
        return [];
      }
      if (!userId) return [];
      const { data, error } = await supabase
        .from('smart_form_responses')
        .select('id, form_id, assigned_to, assigned_by, data, submitted_at')
        .eq('assigned_to', userId)
        .is('submitted_at', null);
      if (error) throw error;
      return (data ?? [])
        .filter((row) => (row.data as Record<string, unknown>)?.[FEEDBACK_MARKERS.isAssignment] === true)
        .map((row) => ({
          id: row.id as string,
          form_id: row.form_id as string,
          assigned_to: row.assigned_to as string,
          assigned_by: row.assigned_by as string,
          period: ((row.data as Record<string, unknown>)?.[FEEDBACK_MARKERS.period] as string) ?? '',
          isAnonymous: ((row.data as Record<string, unknown>)?.[FEEDBACK_MARKERS.isAnonymous] as boolean) ?? true,
          submitted: false,
        }));
    },
    enabled: !!userId,
  });
}

/**
 * Creates feedback assignments — one row per (assignee, period). Stored in
 * smart_form_responses with data marker `_is_assignment=true` so the colaborador
 * can list them as pending.
 */
export function useAssignFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      formId: string;
      assigneeUserIds: string[];
      assignedByUserId: string;
      period: string; // YYYY-MM
      isAnonymous: boolean;
    }) => {
      if (DEMO_MODE) {
        return { count: params.assigneeUserIds.length };
      }
      const rows = params.assigneeUserIds.map((uid) => ({
        form_id: params.formId,
        user_id: uid,
        assigned_to: uid,
        assigned_by: params.assignedByUserId,
        data: {
          [FEEDBACK_MARKERS.isAssignment]: true,
          [FEEDBACK_MARKERS.period]: params.period,
          [FEEDBACK_MARKERS.isAnonymous]: params.isAnonymous,
        },
      }));
      const { error } = await supabase.from('smart_form_responses').insert(rows);
      if (error) throw error;
      return { count: rows.length };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback-assignments'] }),
  });
}

/**
 * Submits a feedback response. Updates the assignment row in place when one
 * exists (so the gestor's aggregate query finds the row); otherwise inserts
 * a fresh response.
 */
export function useSubmitFeedbackResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      assignmentId: string | null;
      formId: string;
      data: Record<string, unknown>;
      period: string;
      isAnonymous: boolean;
      respondingUserId: string;
    }) => {
      if (DEMO_MODE) return;
      const payload = {
        ...params.data,
        [FEEDBACK_MARKERS.period]: params.period,
        [FEEDBACK_MARKERS.isAnonymous]: params.isAnonymous,
        [FEEDBACK_MARKERS.isAssignment]: false,
      };
      if (params.assignmentId) {
        const update: Record<string, unknown> = {
          data: payload,
          submitted_at: new Date().toISOString(),
        };
        // Anonymous responses scrub the user_id so the gestor cannot trace it back.
        if (params.isAnonymous) {
          update.user_id = null;
          update.assigned_to = null;
        }
        const { error } = await supabase
          .from('smart_form_responses')
          .update(update)
          .eq('id', params.assignmentId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('smart_form_responses').insert({
        form_id: params.formId,
        user_id: params.isAnonymous ? null : params.respondingUserId,
        data: payload,
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback-assignments'] }),
  });
}

/**
 * Aggregates feedback responses for a given form + period. Uses the SQL function
 * `aggregate_feedback_by_form` (created in migration 20260501) so individual
 * answers never reach the client. Returns empty when fewer than 3 responses.
 */
export function useFeedbackAggregate(formId: string | null, period: string | null) {
  return useQuery({
    queryKey: ['feedback-aggregate', formId, period],
    queryFn: async (): Promise<FeedbackAggregateRow[]> => {
      if (DEMO_MODE) return [];
      if (!formId || !period) return [];
      const { data, error } = await supabase.rpc('aggregate_feedback_by_form', {
        p_form_id: formId,
        p_period: period,
      });
      if (error) throw error;
      return (data ?? []) as FeedbackAggregateRow[];
    },
    enabled: !!formId && !!period,
  });
}
