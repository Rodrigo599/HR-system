import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/lib/demoMode";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";

// ============================================================
// Tipos
// ============================================================

export type OneOnOneStatus = "scheduled" | "completed" | "cancelled";
export type OneOnOneRecurrence = null | "weekly" | "biweekly" | "monthly";
export type OneOnOneNoteType = "decision" | "action" | "observation";

export interface OneOnOne {
  id: string;
  manager_id: string;
  report_id: string;
  scheduled_at: string;
  recurrence_rule: OneOnOneRecurrence;
  status: OneOnOneStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OneOnOneTopic {
  id: string;
  one_on_one_id: string;
  author_user_id: string;
  content: string;
  addressed: boolean;
  created_at: string;
}

export interface OneOnOneNote {
  id: string;
  one_on_one_id: string;
  author_user_id: string;
  content: string;
  type: OneOnOneNoteType;
  created_at: string;
}

// ============================================================
// DEMO_MODE: mocks Nacho/Regi/Vitor (referencias do auditoria)
// ============================================================

const MOCK_USER_PEDRO = "demo-user";
const MOCK_USER_NACHO = "user-nacho";
const MOCK_USER_REGI = "user-regi";
const MOCK_USER_VITOR = "user-vitor";

const now = new Date();
const inDays = (d: number) => {
  const x = new Date(now);
  x.setDate(x.getDate() + d);
  return x.toISOString();
};

const mockOneOnOnes: OneOnOne[] = [
  {
    id: "ooo-1",
    manager_id: MOCK_USER_PEDRO,
    report_id: MOCK_USER_NACHO,
    scheduled_at: inDays(2),
    recurrence_rule: "weekly",
    status: "scheduled",
    notes: null,
    created_at: inDays(-7),
    updated_at: inDays(-7),
  },
  {
    id: "ooo-2",
    manager_id: MOCK_USER_PEDRO,
    report_id: MOCK_USER_REGI,
    scheduled_at: inDays(5),
    recurrence_rule: "biweekly",
    status: "scheduled",
    notes: null,
    created_at: inDays(-14),
    updated_at: inDays(-14),
  },
  {
    id: "ooo-3",
    manager_id: MOCK_USER_PEDRO,
    report_id: MOCK_USER_VITOR,
    scheduled_at: inDays(-3),
    recurrence_rule: null,
    status: "completed",
    notes: "Vitor topou puxar o experimento de retencao em maio.",
    created_at: inDays(-30),
    updated_at: inDays(-3),
  },
];

const mockTopics: OneOnOneTopic[] = [
  {
    id: "topic-1",
    one_on_one_id: "ooo-1",
    author_user_id: MOCK_USER_PEDRO,
    content: "Alinhar prioridade do Q2 com Nacho",
    addressed: false,
    created_at: inDays(-2),
  },
  {
    id: "topic-2",
    one_on_one_id: "ooo-1",
    author_user_id: MOCK_USER_NACHO,
    content: "Pedir feedback sobre apresentacao do report",
    addressed: false,
    created_at: inDays(-1),
  },
  {
    id: "topic-3",
    one_on_one_id: "ooo-3",
    author_user_id: MOCK_USER_PEDRO,
    content: "Discutir bloqueio com Vitor no funil de retencao",
    addressed: true,
    created_at: inDays(-10),
  },
];

const mockNotes: OneOnOneNote[] = [
  {
    id: "note-1",
    one_on_one_id: "ooo-3",
    author_user_id: MOCK_USER_PEDRO,
    content: "Vitor vai conduzir o experimento de retencao em maio.",
    type: "decision",
    created_at: inDays(-3),
  },
  {
    id: "note-2",
    one_on_one_id: "ooo-3",
    author_user_id: MOCK_USER_PEDRO,
    content: "Marcar checkpoint em 15 dias para revisar metrica.",
    type: "action",
    created_at: inDays(-3),
  },
];

// ============================================================
// Fetchers
// ============================================================

interface FetchMyOneOnOnesParams {
  userId: string;
  asManager: boolean;
}

export async function fetchMyOneOnOnes({
  userId,
  asManager,
}: FetchMyOneOnOnesParams): Promise<OneOnOne[]> {
  if (DEMO_MODE) {
    return asManager
      ? mockOneOnOnes.filter((o) => o.manager_id === userId)
      : mockOneOnOnes.filter((o) => o.report_id === userId);
  }
  const column = asManager ? "manager_id" : "report_id";
  const { data, error } = await supabase
    .from("one_on_ones")
    .select("*")
    .eq(column, userId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OneOnOne[];
}

export async function fetchOneOnOneById(id: string): Promise<OneOnOne | null> {
  if (DEMO_MODE) return mockOneOnOnes.find((o) => o.id === id) ?? null;
  const { data, error } = await supabase
    .from("one_on_ones")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as OneOnOne | null;
}

export async function fetchOneOnOneTopics(
  oneOnOneId: string,
): Promise<OneOnOneTopic[]> {
  if (DEMO_MODE)
    return mockTopics.filter((t) => t.one_on_one_id === oneOnOneId);
  const { data, error } = await supabase
    .from("one_on_one_topics")
    .select("*")
    .eq("one_on_one_id", oneOnOneId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OneOnOneTopic[];
}

export async function fetchOneOnOneNotes(
  oneOnOneId: string,
): Promise<OneOnOneNote[]> {
  if (DEMO_MODE) return mockNotes.filter((n) => n.one_on_one_id === oneOnOneId);
  const { data, error } = await supabase
    .from("one_on_one_notes")
    .select("*")
    .eq("one_on_one_id", oneOnOneId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OneOnOneNote[];
}

// ============================================================
// Mutations
// ============================================================

interface CreateOneOnOneParams {
  manager_id: string;
  report_id: string;
  scheduled_at: string;
  recurrence_rule: OneOnOneRecurrence;
}

export async function createOneOnOne(
  params: CreateOneOnOneParams,
): Promise<void> {
  if (DEMO_MODE) {
    mockOneOnOnes.push({
      id: `ooo-${Date.now()}`,
      ...params,
      status: "scheduled",
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return;
  }
  const { error } = await supabase.from("one_on_ones").insert(params);
  if (error) throw error;
}

interface CompleteOneOnOneParams {
  id: string;
  notes: string | null;
}

export interface CompleteOneOnOneResult {
  completed: OneOnOne;
  next: OneOnOne | null;
}

const RECURRENCE_DAYS: Record<NonNullable<OneOnOneRecurrence>, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function completeOneOnOne({
  id,
  notes,
}: CompleteOneOnOneParams): Promise<CompleteOneOnOneResult> {
  if (DEMO_MODE) {
    const ooo = mockOneOnOnes.find((o) => o.id === id);
    if (!ooo)
      throw new Error(`completeOneOnOne: 1:1 ${id} nao encontrada (DEMO)`);
    ooo.status = "completed";
    ooo.notes = notes;
    ooo.updated_at = new Date().toISOString();

    let next: OneOnOne | null = null;
    if (ooo.recurrence_rule) {
      const days = RECURRENCE_DAYS[ooo.recurrence_rule];
      const nextScheduledAt = addDaysIso(ooo.scheduled_at, days);
      next = {
        id: `ooo-${Date.now()}`,
        manager_id: ooo.manager_id,
        report_id: ooo.report_id,
        scheduled_at: nextScheduledAt,
        recurrence_rule: ooo.recurrence_rule,
        status: "scheduled",
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockOneOnOnes.push(next);
    }
    return { completed: { ...ooo }, next };
  }

  // Real DB: pega snapshot, atualiza, e (se recorrente) cria proxima
  const { data: current, error: fetchErr } = await supabase
    .from("one_on_ones")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!current) throw new Error(`completeOneOnOne: 1:1 ${id} nao encontrada`);

  const { error: updErr } = await supabase
    .from("one_on_ones")
    .update({ status: "completed", notes })
    .eq("id", id);
  if (updErr) throw updErr;

  const completedSnapshot: OneOnOne = {
    ...(current as OneOnOne),
    status: "completed",
    notes,
    updated_at: new Date().toISOString(),
  };

  let next: OneOnOne | null = null;
  if (completedSnapshot.recurrence_rule) {
    const days = RECURRENCE_DAYS[completedSnapshot.recurrence_rule];
    const nextScheduledAt = addDaysIso(completedSnapshot.scheduled_at, days);
    const { data: inserted, error: insErr } = await supabase
      .from("one_on_ones")
      .insert({
        manager_id: completedSnapshot.manager_id,
        report_id: completedSnapshot.report_id,
        scheduled_at: nextScheduledAt,
        recurrence_rule: completedSnapshot.recurrence_rule,
      })
      .select("*")
      .maybeSingle();
    if (insErr) throw insErr;
    next = (inserted ?? null) as OneOnOne | null;
  }

  return { completed: completedSnapshot, next };
}

export async function cancelOneOnOne(id: string): Promise<OneOnOne> {
  if (DEMO_MODE) {
    const ooo = mockOneOnOnes.find((o) => o.id === id);
    if (!ooo)
      throw new Error(`cancelOneOnOne: 1:1 ${id} nao encontrada (DEMO)`);
    ooo.status = "cancelled";
    ooo.updated_at = new Date().toISOString();
    return { ...ooo };
  }
  const { data: current, error: fetchErr } = await supabase
    .from("one_on_ones")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!current) throw new Error(`cancelOneOnOne: 1:1 ${id} nao encontrada`);

  const { error: updErr } = await supabase
    .from("one_on_ones")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (updErr) throw updErr;

  return {
    ...(current as OneOnOne),
    status: "cancelled",
    updated_at: new Date().toISOString(),
  };
}

interface AddTopicParams {
  one_on_one_id: string;
  author_user_id: string;
  content: string;
}

export async function addTopic(params: AddTopicParams): Promise<void> {
  if (DEMO_MODE) {
    mockTopics.push({
      id: `topic-${Date.now()}`,
      ...params,
      addressed: false,
      created_at: new Date().toISOString(),
    });
    return;
  }
  const { error } = await supabase.from("one_on_one_topics").insert(params);
  if (error) throw error;
}

interface ToggleTopicParams {
  id: string;
  addressed: boolean;
}

export async function toggleTopic({
  id,
  addressed,
}: ToggleTopicParams): Promise<void> {
  if (DEMO_MODE) {
    const t = mockTopics.find((mt) => mt.id === id);
    if (t) t.addressed = !addressed;
    return;
  }
  const { error } = await supabase
    .from("one_on_one_topics")
    .update({ addressed: !addressed })
    .eq("id", id);
  if (error) throw error;
}

interface AddNoteParams {
  one_on_one_id: string;
  author_user_id: string;
  content: string;
  type: OneOnOneNoteType;
}

export async function addNote(params: AddNoteParams): Promise<void> {
  if (DEMO_MODE) {
    mockNotes.push({
      id: `note-${Date.now()}`,
      ...params,
      created_at: new Date().toISOString(),
    });
    return;
  }
  const { error } = await supabase.from("one_on_one_notes").insert(params);
  if (error) throw error;
}

// ============================================================
// Hooks (TanStack)
// ============================================================

export function useMyOneOnOnes(userId: string | undefined, asManager: boolean) {
  return useQuery({
    queryKey: ["one-on-ones", asManager ? "manager" : "report", userId],
    queryFn: () => fetchMyOneOnOnes({ userId: userId!, asManager }),
    enabled: !!userId,
  });
}

export function useOneOnOneById(id: string | undefined) {
  return useQuery({
    queryKey: ["one-on-one", id],
    queryFn: () => fetchOneOnOneById(id!),
    enabled: !!id,
  });
}

export function useOneOnOneTopics(oneOnOneId: string | undefined) {
  return useQuery({
    queryKey: ["one-on-one-topics", oneOnOneId],
    queryFn: () => fetchOneOnOneTopics(oneOnOneId!),
    enabled: !!oneOnOneId,
  });
}

export function useOneOnOneNotes(oneOnOneId: string | undefined) {
  return useQuery({
    queryKey: ["one-on-one-notes", oneOnOneId],
    queryFn: () => fetchOneOnOneNotes(oneOnOneId!),
    enabled: !!oneOnOneId,
  });
}

export function useCreateOneOnOne() {
  const qc = useQueryClient();
  const { notifyOneOnOneScheduled } = useEmailNotifications();
  return useMutation({
    mutationFn: createOneOnOne,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["one-on-ones"] });
      // fire-and-forget: nao bloqueia UI, falhas sao logadas dentro do hook
      void notifyOneOnOneScheduled(
        vars.manager_id,
        vars.report_id,
        vars.scheduled_at,
        vars.recurrence_rule,
      );
    },
  });
}

export function useCompleteOneOnOne() {
  const qc = useQueryClient();
  const { notifyOneOnOneScheduled } = useEmailNotifications();
  return useMutation({
    mutationFn: completeOneOnOne,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["one-on-ones"] });
      qc.invalidateQueries({ queryKey: ["one-on-one"] });
      // Recorrencia: se geramos uma proxima 1:1, avisa as duas pontas
      if (result.next) {
        void notifyOneOnOneScheduled(
          result.next.manager_id,
          result.next.report_id,
          result.next.scheduled_at,
          result.next.recurrence_rule,
        );
      }
    },
  });
}

export function useCancelOneOnOne() {
  const qc = useQueryClient();
  const { notifyOneOnOneCancelled } = useEmailNotifications();
  return useMutation({
    mutationFn: cancelOneOnOne,
    onSuccess: (cancelled) => {
      qc.invalidateQueries({ queryKey: ["one-on-ones"] });
      qc.invalidateQueries({ queryKey: ["one-on-one"] });
      void notifyOneOnOneCancelled(
        cancelled.manager_id,
        cancelled.report_id,
        cancelled.scheduled_at,
      );
    },
  });
}

export function useAddTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addTopic,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["one-on-one-topics", vars.one_on_one_id],
      });
    },
  });
}

export function useToggleTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["one-on-one-topics"] });
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addNote,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["one-on-one-notes", vars.one_on_one_id],
      });
    },
  });
}
