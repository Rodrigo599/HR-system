import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Evaluation, ApiList, ApiItem } from '@/types/api';

export function useEvaluations() {
  return useQuery({
    queryKey: ['evaluations'],
    queryFn: () => apiClient.get<ApiList<Evaluation>>('/evaluations').then((r) => r.data.data),
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ['evaluations', id],
    queryFn: () => apiClient.get<ApiItem<Evaluation>>(`/evaluations/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

interface CreateEvaluationPayload {
  type: string;
  month: number;
  year: number;
  assigned_to: string;
  smart_form_id?: string;
}

export function useCreateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEvaluationPayload) =>
      apiClient.post<ApiItem<Evaluation>>('/evaluations', payload).then((r) => r.data.data),
    onSuccess: (newEval) => {
      qc.setQueryData<Evaluation[]>(['evaluations'], (old = []) => [newEval, ...old]);
      qc.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

interface SubmitResponsePayload {
  responses: Record<string, unknown>;
}

export function useSubmitSelfEvaluation(evaluationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitResponsePayload) =>
      apiClient.put<ApiItem<Evaluation>>(`/evaluations/${evaluationId}/submit-self`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluations', evaluationId] }),
  });
}

export function useSubmitManagerEvaluation(evaluationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitResponsePayload) =>
      apiClient.put<ApiItem<Evaluation>>(`/evaluations/${evaluationId}/submit-manager`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluations', evaluationId] }),
  });
}
