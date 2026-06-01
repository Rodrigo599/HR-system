import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demoMode';
import type { SmartForm, SmartFormConfig } from '@/types/smartforms';

// ============================================================
// Re-export SmartForm so consumers can import from this hook
// ============================================================
export type { SmartForm };

// ============================================================
// SmartFormResponse type (persistencia de respostas)
// ============================================================
export interface SmartFormResponse {
  id: string;
  form_id: string;
  user_id: string;
  data: Record<string, unknown>;
  submitted_at: string;
}

type FormStatus = SmartForm['status'];
type FormCategory = SmartForm['category'];

// ============================================================
// Mock data for DEMO_MODE
// (espelha os mocks de SmartForms.tsx para consistencia)
// ============================================================

const MOCK_FORMS: SmartForm[] = [
  {
    id: 'sf3',
    name: 'Avaliação de Desempenho',
    slug: 'avaliacao-desempenho',
    status: 'active' as const,
    category: 'evaluation' as const,
    config: {
      steps: [{
        title: { pt: 'Indicadores de Desempenho', es: 'Indicadores de Desempeno' },
        subtitle: { pt: 'Avalie de 1 a 10', es: 'Evalua de 1 a 10' },
        fields: [
          { type: 'scale' as const, name: 'qualidade-trabalho', label: { pt: 'Qualidade do trabalho', es: 'Calidad del trabajo' }, required: true, min: 1, max: 10 },
          { type: 'scale' as const, name: 'produtividade', label: { pt: 'Produtividade', es: 'Productividad' }, required: true, min: 1, max: 10 },
          { type: 'scale' as const, name: 'resolucao-problemas', label: { pt: 'Resolucao de problemas', es: 'Resolucion de problemas' }, required: true, min: 1, max: 10 },
          { type: 'scale' as const, name: 'autonomia', label: { pt: 'Autonomia', es: 'Autonomia' }, required: true, min: 1, max: 10 },
          { type: 'textarea' as const, name: 'comentarios-desempenho', label: { pt: 'Comentários gerais', es: 'Comentarios generales' } },
        ],
      }],
      submit: { pt: 'Enviar avaliação', es: 'Enviar evaluación' },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sf1',
    name: 'Avaliação Cultural',
    slug: 'avaliacao-cultural',
    status: 'active',
    category: 'evaluation',
    config: {
      steps: [
        {
          title: { pt: 'Competências Culturais', es: 'Competencias Culturales' },
          subtitle: { pt: 'Avalie de 1 a 10', es: 'Evalúa de 1 a 10' },
          fields: [
            { type: 'scale', name: 'trabalho-equipe', label: { pt: 'Trabalho em equipe', es: 'Trabajo en equipo' }, required: true, min: 1, max: 10 },
            { type: 'scale', name: 'comunicacao', label: { pt: 'Comunicação', es: 'Comunicación' }, required: true, min: 1, max: 10 },
            { type: 'scale', name: 'proatividade', label: { pt: 'Proatividade', es: 'Proactividad' }, required: true, min: 1, max: 10 },
            { type: 'scale', name: 'pontualidade', label: { pt: 'Pontualidade', es: 'Puntualidad' }, required: true, min: 1, max: 10 },
            { type: 'scale', name: 'atendimento-hospede', label: { pt: 'Atendimento ao hóspede', es: 'Atención al huésped' }, required: true, min: 1, max: 10 },
            { type: 'scale', name: 'cumprimento-processos', label: { pt: 'Cumprimento de processos', es: 'Cumplimiento de procesos' }, required: true, min: 1, max: 10 },
            { type: 'textarea', name: 'comentarios', label: { pt: 'Comentários gerais', es: 'Comentarios generales' } },
          ],
        },
      ],
      submit: { pt: 'Enviar avaliação', es: 'Enviar evaluación' },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sf2',
    name: 'Onboarding Checklist',
    slug: 'onboarding',
    status: 'active',
    category: 'onboarding',
    config: {
      steps: [
        {
          title: { pt: 'Checklist de Entrada', es: 'Checklist de Entrada' },
          fields: [
            { type: 'yes-no', name: 'uniforme', label: { pt: 'Recebeu uniforme?', es: '¿Recibió uniforme?' }, required: true },
            { type: 'yes-no', name: 'tour', label: { pt: 'Fez tour nas áreas?', es: '¿Hizo tour por las áreas?' }, required: true },
            { type: 'yes-no', name: 'treinamento-seguranca', label: { pt: 'Treinamento de segurança concluído?', es: '¿Entrenamiento de seguridad completado?' }, required: true },
            { type: 'yes-no', name: 'sistemas', label: { pt: 'Acesso aos sistemas configurado?', es: '¿Acceso a sistemas configurado?' }, required: true },
            { type: 'textarea', name: 'observacoes', label: { pt: 'Observações', es: 'Observaciones' } },
          ],
        },
      ],
      submit: { pt: 'Concluir', es: 'Concluir' },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================
// Fetcher
// ============================================================

async function fetchSmartForms(): Promise<SmartForm[]> {
  if (DEMO_MODE) {
    return MOCK_FORMS;
  }

  const { data, error } = await supabase
    .from('smart_forms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SmartForm[];
}

// ============================================================
// Hooks
// ============================================================

/** Lista todos os formulários. DEMO_MODE retorna mocks. */
export function useSmartForms(): { forms: SmartForm[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['smart-forms'],
    queryFn: fetchSmartForms,
    staleTime: 5 * 60 * 1000,
  });

  return {
    forms: data ?? [],
    isLoading,
  };
}

/** Cria um formulário novo. Recebe { name, slug, category, config }. */
export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      slug: string;
      category: FormCategory;
      config: SmartFormConfig;
      sector_id?: string | null;
    }) => {
      if (DEMO_MODE) {
        return {
          id: crypto.randomUUID(),
          ...params,
          status: 'draft' as FormStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as SmartForm;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('smart_forms')
        .insert({ ...params, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data as SmartForm;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smart-forms'] }),
  });
}

/** Atualiza campos de um formulário existente por id. */
export function useUpdateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      name?: string;
      slug?: string;
      status?: FormStatus;
      category?: FormCategory;
      config?: SmartFormConfig;
      sector_id?: string | null;
    }) => {
      const { id, ...fields } = params;

      if (DEMO_MODE) {
        return { id, ...fields, updated_at: new Date().toISOString() } as Partial<SmartForm> & { id: string };
      }

      const { data, error } = await supabase
        .from('smart_forms')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SmartForm;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smart-forms'] }),
  });
}

/** Remove um formulário por id. */
export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) return;

      const { error } = await supabase
        .from('smart_forms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smart-forms'] }),
  });
}

/** Alterna o status de um formulário entre 'active' e 'draft'. */
export function useToggleFormStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; currentStatus: FormStatus }) => {
      const nextStatus: FormStatus = params.currentStatus === 'active' ? 'draft' : 'active';

      if (DEMO_MODE) {
        return { id: params.id, status: nextStatus };
      }

      const { data, error } = await supabase
        .from('smart_forms')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data as SmartForm;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smart-forms'] }),
  });
}

/** Busca um SmartForm por ID. Usado pra carregar template de avaliação. */
export function useSmartFormById(id: string | null | undefined) {
  return useQuery({
    queryKey: ['smart-form', id],
    queryFn: async () => {
      if (DEMO_MODE) {
        return MOCK_FORMS.find(f => f.id === id) ?? null;
      }
      if (!id) return null;
      const { data, error } = await supabase
        .from('smart_forms')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data as SmartForm;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Lista SmartForms por categoria (ex: 'evaluation').
 *
 * @param category Categoria do form ('evaluation', 'feedback' etc.)
 * @param sectorId (opcional) Quando informado, retorna apenas forms universais
 *   (sector_id = NULL) ou do setor exato. Quando undefined, retorna todos —
 *   preserva o comportamento original pra chamadas legadas.
 */
export function useSmartFormsByCategory(
  category: string,
  sectorId?: string | null,
) {
  const { forms, isLoading } = useSmartForms();
  const filtered = forms.filter((f) => {
    if (f.category !== category || f.status !== 'active') return false;
    if (sectorId === undefined) return true;
    return f.sector_id == null || f.sector_id === sectorId;
  });
  return { forms: filtered, isLoading };
}

/** Submete uma resposta a um formulário. Usa auth.uid() como user_id. */
export function useSubmitFormResponse() {
  return useMutation({
    mutationFn: async (params: { formId: string; data: Record<string, unknown> }) => {
      if (DEMO_MODE) {
        return {
          id: crypto.randomUUID(),
          form_id: params.formId,
          user_id: 'demo-user',
          data: params.data,
          submitted_at: new Date().toISOString(),
        } as SmartFormResponse;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('smart_form_responses')
        .insert({
          form_id: params.formId,
          user_id: user.id,
          data: params.data,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SmartFormResponse;
    },
  });
}
