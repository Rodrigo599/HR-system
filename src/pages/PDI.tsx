import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollaborators, useDirectReportUserIds } from '@/services/profileService';
import { Loader2, BookOpen, Calendar, CheckCircle, ExternalLink, Plus, Users as UsersIcon, Download } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pdi, PdiTask, PdiTaskStatus } from '@/types/database';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { supabase } from '@/integrations/supabase/client';
import { GiveFeedback } from '@/components/feedback/GiveFeedback';

// Converte "YYYY-MM-DD" para Date local sem shift de timezone (UTC-3 no Brasil)
function parseLocalDate(dateStr: string): Date {
  const clean = dateStr.split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Formata "YYYY-MM-DD" como "DD/MM/YYYY" sem passar por Date UTC
function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const clean = dateStr.split('T')[0];
  const [y, m, d] = clean.split('-');
  return `${d}/${m}/${y}`;
}
import { useAlerts } from '@/hooks/useAlerts';
import { DEMO_MODE } from '@/lib/demoMode';
import { generatePdiPdf } from '@/lib/generatePdf';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import {
  useUserPdis,
  useTeamPdis,
  usePdiTasks,
  useCreatePdi,
  useCreatePdiTask,
  toggleTaskCompleted,
  submitTaskForReview,
  reviewTask,
} from '@/services/pdiService';

// --- Status Badge ---
function TaskStatusBadge({ status, t }: { status: PdiTaskStatus; t: (key: string) => string }) {
  const config: Record<PdiTaskStatus, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }> = {
    pending: { label: t('statusPending'), variant: 'outline' },
    submitted: { label: t('statusSubmitted'), variant: 'secondary' },
    approved: { label: t('statusApproved'), variant: 'default' },
    rejected: { label: t('statusRejected'), variant: 'destructive' },
  };
  const { label, variant } = config[status] ?? config.pending;
  return <Badge variant={variant}>{label}</Badge>;
}

// --- Review Dialog ---
interface ReviewDialogProps {
  open: boolean;
  mode: 'approve' | 'reject';
  taskTitle: string;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  t: (key: string) => string;
}

function ReviewDialog({ open, mode, taskTitle, onClose, onConfirm, t }: ReviewDialogProps) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (mode === 'reject' && !comment.trim()) {
      setError(t('commentRequired'));
      return;
    }
    onConfirm(comment.trim());
    setComment('');
    setError('');
  };

  const handleClose = () => {
    setComment('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'approve' ? t('approveTaskTitle') : t('rejectTaskTitle')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{taskTitle}</p>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {mode === 'approve' ? t('optionalComment') : t('reviewComment')}
          </label>
          <Textarea
            value={comment}
            onChange={e => { setComment(e.target.value); setError(''); }}
            placeholder={mode === 'approve' ? t('optionalComment') : t('reviewComment')}
            rows={3}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t('cancel')}</Button>
          <Button
            variant={mode === 'approve' ? 'default' : 'destructive'}
            onClick={handleConfirm}
          >
            {mode === 'approve' ? t('approveTask') : t('rejectTask')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page ---
export default function PDI() {
  const { profile, user, isGestor, isAdmin } = useAuth();
  const { viewMode } = useViewMode();
  const showTeamTab = isAdmin || (isGestor && viewMode === 'team');
  const { t } = useLanguage();
  const { toast } = useToast();
  const { notifyPdiSubmitted, notifyPdiApproved, notifyPdiRejected } = useEmailNotifications();

  // Data queries
  const pdisQuery = useUserPdis(profile?.user_id);
  const teamPdisQuery = useTeamPdis(profile?.id, showTeamTab);

  const pdis = pdisQuery.data ?? [];
  const teamPdis = teamPdisQuery.data ?? [];

  const [selectedPdi, setSelectedPdi] = useState<Pdi | null>(null);
  const [selectedTeamPdi, setSelectedTeamPdi] = useState<Pdi | null>(null);

  const tasksQuery = usePdiTasks(selectedPdi?.id);
  const teamTasksQuery = usePdiTasks(selectedTeamPdi?.id);

  const tasks = tasksQuery.data ?? [];
  const teamTasks = teamTasksQuery.data ?? [];

  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  // Demo mode local state overrides
  const [localTasks, setLocalTasks] = useState<PdiTask[]>([]);
  const [localTeamTasks, setLocalTeamTasks] = useState<PdiTask[]>([]);
  const [localPdis, setLocalPdis] = useState<Pdi[]>([]);

  const effectiveTasks = DEMO_MODE && localTasks.length > 0 ? localTasks : tasks;
  const effectiveTeamTasks = DEMO_MODE && localTeamTasks.length > 0 ? localTeamTasks : teamTasks;
  const effectivePdis = DEMO_MODE && localPdis.length > 0 ? localPdis : pdis;

  // Sync demo local state from queries
  useEffect(() => {
    if (DEMO_MODE && tasks.length > 0 && localTasks.length === 0) setLocalTasks(tasks);
  }, [tasks]);
  useEffect(() => {
    if (DEMO_MODE && teamTasks.length > 0 && localTeamTasks.length === 0) setLocalTeamTasks(teamTasks);
  }, [teamTasks]);
  useEffect(() => {
    if (DEMO_MODE && pdis.length > 0 && localPdis.length === 0) setLocalPdis(pdis);
  }, [pdis]);

  // Auto-select first PDI
  useEffect(() => {
    if (effectivePdis.length > 0 && !selectedPdi) setSelectedPdi(effectivePdis[0]);
  }, [effectivePdis]);
  useEffect(() => {
    if (teamPdis.length > 0 && !selectedTeamPdi) setSelectedTeamPdi(teamPdis[0]);
  }, [teamPdis]);

  // Review dialog state
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    mode: 'approve' | 'reject';
    task: PdiTask | null;
    isTeam?: boolean;
  }>({ open: false, mode: 'approve', task: null, isTeam: false });

  // New PDI dialog state
  const [pdiDialogOpen, setPdiDialogOpen] = useState(false);
  const [creatingPdi, setCreatingPdi] = useState(false);
  const [newPdiTitle, setNewPdiTitle] = useState('');
  const [newPdiDescription, setNewPdiDescription] = useState('');
  const [newPdiStartDate, setNewPdiStartDate] = useState('');
  const [newPdiEndDate, setNewPdiEndDate] = useState('');
  // Onda 2 / Fix 9: gestor/admin escolhe "Para quem" o PDI sera criado.
  // Valor especial 'self' = "Para mim" (default = comportamento legado).
  const [newPdiAssignee, setNewPdiAssignee] = useState<string>('self');

  // Liderados do gestor (so carrega quando ele eh gestor/admin de fato)
  const canAssignToOthers = isGestor || isAdmin;
  const directReportsQuery = useDirectReportUserIds(profile?.id, canAssignToOthers);
  const collaboratorsQuery = useCollaborators(canAssignToOthers);
  const directReportIds = directReportsQuery.data ?? [];
  const allCollaborators = collaboratorsQuery.data ?? [];
  // Admin ve todos; gestor ve so seus liderados
  const assignableCollaborators = isAdmin
    ? allCollaborators.filter((c) => c.user_id !== profile?.user_id)
    : allCollaborators.filter((c) => directReportIds.includes(c.user_id));

  // New Task dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogIsTeam, setTaskDialogIsTeam] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [newTaskLinkError, setNewTaskLinkError] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  function isValidUrl(str: string): boolean {
    if (!str) return true; // URL e opcional
    try { new URL(str); return true; } catch { return false; }
  }

  const createPdiMutation = useCreatePdi();
  const createTaskMutation = useCreatePdiTask();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const alerts = useAlerts({ kpis: [], kpiResults: [], pdiTasks: effectiveTasks, month: currentMonth, year: currentYear });

  const loading = pdisQuery.isLoading;

  const toggleTask = async (task: PdiTask) => {
    setUpdatingTask(task.id);
    const willComplete = !task.completed;
    // M-13: status e a fonte da verdade. Ao marcar como concluido, mover para "submitted".
    // Ao desmarcar, voltar para "pending". Checkbox e derivado do status.
    const newStatus: PdiTaskStatus = willComplete ? 'submitted' : 'pending';
    try {
      if (DEMO_MODE) {
        setLocalTasks(prev => prev.map(tsk =>
          tsk.id === task.id ? { ...tsk, completed: willComplete, status: newStatus } : tsk
        ));
        toast({ title: t('success'), description: willComplete ? t('taskCompleted') : t('taskUncompleted') });
      } else {
        await toggleTaskCompleted(task.id, task.completed);
        toast({ title: t('success'), description: willComplete ? t('taskCompleted') : t('taskUncompleted') });
        tasksQuery.refetch();

        // Melhoria 2: notificacao in-app pro gestor quando colaborador marca task como concluida
        if (willComplete && profile?.manager_id) {
          // manager_id e o ID da tabela profiles, precisamos do user_id (auth.users.id) do gestor
          supabase
            .from('profiles')
            .select('user_id')
            .eq('id', profile.manager_id)
            .single()
            .then(({ data: managerProfile }) => {
              if (managerProfile?.user_id) {
                supabase.from('notifications').insert({
                  user_id: managerProfile.user_id,
                  type: 'task_submitted',
                  title: `${profile.full_name} completou uma tarefa`,
                  message: `Tarefa "${task.title}" enviada para aprovacao`,
                  data: { pdi_id: task.pdi_id, task_id: task.id },
                }).catch(() => {}); // fire-and-forget: notificacao e secundaria
              }
            })
            .catch(() => {}); // fire-and-forget: falha silenciosa
        }
      }
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
    setUpdatingTask(null);
  };

  const submitTask = async (task: PdiTask) => {
    setUpdatingTask(task.id);
    const updatedFields = { status: 'submitted' as PdiTaskStatus, updated_at: new Date().toISOString() };
    try {
      if (DEMO_MODE) {
        setLocalTasks(prev => prev.map(tsk => tsk.id === task.id ? { ...tsk, ...updatedFields } : tsk));
        toast({ title: t('success'), description: t('taskSubmitted') });
      } else {
        await submitTaskForReview(task.id);
        toast({ title: t('success'), description: t('taskSubmitted') });
        tasksQuery.refetch();
      }
      // Notify gestor via email — fire-and-forget, falha silenciosa (A-09)
      notifyPdiSubmitted(
        '', // gestor email (resolved server-side or by GHL contact lookup)
        'Gestor',
        profile?.full_name ?? 'Colaborador',
        task.title
      ).catch(() => {/* notificacao e secundaria, nao exibir erro ao usuario */});
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
    setUpdatingTask(null);
  };

  const confirmReview = async (comment: string) => {
    const { task, mode, isTeam } = reviewDialog;
    if (!task) return;

    setReviewDialog({ open: false, mode: 'approve', task: null, isTeam: false });
    setUpdatingTask(task.id);

    const now = new Date().toISOString();
    const reviewerId = user?.id ?? 'demo-reviewer';

    const updatedFields: Partial<PdiTask> = {
      status: mode === 'approve' ? 'approved' : 'rejected',
      reviewer_id: reviewerId,
      review_comment: comment || null,
      reviewed_at: now,
      updated_at: now,
      ...(mode === 'approve' ? { completed: true } : {}),
    };

    try {
      if (DEMO_MODE) {
        const setFn = isTeam ? setLocalTeamTasks : setLocalTasks;
        setFn(prev => {
          const updated = prev.map(tsk => tsk.id === task.id ? { ...tsk, ...updatedFields } : tsk);
          // Melhoria 1 (DEMO_MODE): verificar se todas as tasks do mesmo PDI estao aprovadas
          if (mode === 'approve') {
            const pdiTasks = updated.filter(t => t.pdi_id === task.pdi_id);
            const allApproved = pdiTasks.length > 0 && pdiTasks.every(t =>
              t.id === task.id ? true : t.status === 'approved'
            );
            if (allApproved) {
              setTimeout(() => {
                toast({ title: 'PDI concluido! Todas as tarefas foram aprovadas.' });
              }, 300);
            }
          }
          return updated;
        });
        toast({ title: t('success'), description: mode === 'approve' ? t('taskApproved') : t('taskRejected') });
      } else {
        await reviewTask({ taskId: task.id, mode, reviewerId, comment });
        toast({ title: t('success'), description: mode === 'approve' ? t('taskApproved') : t('taskRejected') });
        if (isTeam) {
          const { data: refreshedTeamTasks } = await teamTasksQuery.refetch();
          // Melhoria 1 (real mode, team tab): verificar se todas as tasks do PDI estao aprovadas
          if (mode === 'approve' && refreshedTeamTasks) {
            const pdiTasks = refreshedTeamTasks.filter((t: PdiTask) => t.pdi_id === task.pdi_id);
            const allApproved = pdiTasks.length > 0 && pdiTasks.every((t: PdiTask) => t.status === 'approved');
            if (allApproved) {
              toast({ title: 'PDI concluido! Todas as tarefas foram aprovadas.' });
            }
          }
        } else {
          const { data: refreshedTasks } = await tasksQuery.refetch();
          // Melhoria 1 (real mode, my tab): verificar se todas as tasks do PDI estao aprovadas
          if (mode === 'approve' && refreshedTasks) {
            const pdiTasks = refreshedTasks.filter((t: PdiTask) => t.pdi_id === task.pdi_id);
            const allApproved = pdiTasks.length > 0 && pdiTasks.every((t: PdiTask) => t.status === 'approved');
            if (allApproved) {
              toast({ title: 'PDI concluido! Todas as tarefas foram aprovadas.' });
            }
          }
        }
      }
      // Notify collaborator via email about review result — fire-and-forget (A-09)
      if (mode === 'approve') {
        notifyPdiApproved('', 'Colaborador', task.title, comment).catch(() => {});
      } else {
        notifyPdiRejected('', 'Colaborador', task.title, comment).catch(() => {});
      }
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
    setUpdatingTask(null);
  };

  const resetPdiForm = () => {
    setNewPdiTitle('');
    setNewPdiDescription('');
    setNewPdiStartDate('');
    setNewPdiEndDate('');
    setNewPdiAssignee('self');
  };

  const resetTaskForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskLink('');
    setNewTaskLinkError('');
    setNewTaskDueDate('');
  };

  const handleCreatePdi = async () => {
    if (!profile || !newPdiTitle.trim()) return;

    // Bug 4 fix: validar que data inicio nao e posterior a data fim
    if (newPdiStartDate && newPdiEndDate && newPdiStartDate > newPdiEndDate) {
      toast({
        title: t('error'),
        description: 'A data de inicio nao pode ser posterior a data de termino.',
        variant: 'destructive',
      });
      return;
    }

    setCreatingPdi(true);
    // Onda 2 / Fix 9: assignee real do PDI. 'self' ou usuario nao listado = proprio gestor.
    const assigneeUserId =
      newPdiAssignee !== 'self' && assignableCollaborators.some((c) => c.user_id === newPdiAssignee)
        ? newPdiAssignee
        : profile.user_id;
    try {
      if (DEMO_MODE) {
        const newPdi: Pdi = {
          id: `p-${Date.now()}`,
          user_id: assigneeUserId,
          title: newPdiTitle.trim(),
          description: newPdiDescription.trim() || null,
          start_date: newPdiStartDate || null,
          end_date: newPdiEndDate || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setLocalPdis(prev => [...prev, newPdi]);
        toast({ title: t('pdiDemoCreated') });
        setPdiDialogOpen(false);
        return;
      }
      const result = await createPdiMutation.mutateAsync({
        user_id: assigneeUserId,
        title: newPdiTitle.trim(),
        description: newPdiDescription.trim() || null,
        start_date: newPdiStartDate || null,
        end_date: newPdiEndDate || null,
      });
      toast({ title: t('pdiCreated') });
      if (result) setSelectedPdi(result);
      setPdiDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    } finally {
      setCreatingPdi(false);
    }
  };

  const handleCreateTask = async () => {
    const targetPdi = taskDialogIsTeam ? selectedTeamPdi : selectedPdi;
    if (!profile || !targetPdi || !newTaskTitle.trim()) return;
    if (!isValidUrl(newTaskLink.trim())) {
      setNewTaskLinkError('Insira um link valido (ex: https://...)');
      return;
    }
    setCreatingTask(true);
    try {
      if (DEMO_MODE) {
        const newTask: PdiTask = {
          id: `pt-${Date.now()}`,
          pdi_id: targetPdi.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          link: newTaskLink.trim() || null,
          completed: false,
          due_date: newTaskDueDate || null,
          status: 'pending',
          reviewer_id: null,
          review_comment: null,
          reviewed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setLocalTasks(prev => [...prev, newTask]);
        toast({ title: t('taskDemoCreated') });
        setTaskDialogOpen(false);
        return;
      }
      await createTaskMutation.mutateAsync({
        pdi_id: targetPdi.id,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        link: newTaskLink.trim() || null,
        due_date: newTaskDueDate || null,
      });
      toast({ title: t('taskCreated') });
      if (taskDialogIsTeam) {
        teamTasksQuery.refetch();
      } else {
        tasksQuery.refetch();
      }
      setTaskDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    } finally {
      setCreatingTask(false);
    }
  };

  const isOwner = selectedPdi ? (profile?.user_id === selectedPdi.user_id) : false;
  const canReview = isGestor || isAdmin;

  const completedCount = effectiveTasks.filter(tsk => tsk.completed).length;
  const progressPct = effectiveTasks.length > 0 ? Math.round((completedCount / effectiveTasks.length) * 100) : 0;

  // Melhoria 1: PDI e considerado concluido quando todas as tasks estao aprovadas
  const isPdiComplete = effectiveTasks.length > 0 && effectiveTasks.every(t => t.status === 'approved');

  const handleExportPdiPdf = () => {
    if (!selectedPdi || !effectiveTasks) return;
    const collaboratorName = profile?.full_name ?? 'Colaborador';
    generatePdiPdf({
      pdiTitle: selectedPdi.title,
      collaboratorName,
      startDate: selectedPdi.start_date
        ? formatDateBR(selectedPdi.start_date)
        : '-',
      endDate: selectedPdi.end_date
        ? formatDateBR(selectedPdi.end_date)
        : '-',
      tasks: effectiveTasks.map((task) => ({
        title: task.title,
        status: task.status === 'pending'
          ? t('statusPending')
          : task.status === 'submitted'
          ? t('statusSubmitted')
          : task.status === 'approved'
          ? t('statusApproved')
          : t('statusRejected'),
        dueDate: task.due_date
          ? formatDateBR(task.due_date)
          : '-',
        reviewComment: task.review_comment,
        completed: task.completed,
      })),
      completionPercentage: progressPct,
    });
    toast({ title: t('pdfGenerated') });
  };

  const teamCompletedCount = effectiveTeamTasks.filter(tsk => tsk.completed).length;
  const teamProgressPct = effectiveTeamTasks.length > 0 ? Math.round((teamCompletedCount / effectiveTeamTasks.length) * 100) : 0;

  // Melhoria 1: PDI do time e considerado concluido quando todas as suas tasks estao aprovadas
  const isTeamPdiComplete = effectiveTeamTasks.length > 0 && effectiveTeamTasks.every(t => t.status === 'approved');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderTaskList = (
    taskList: PdiTask[],
    taskIsOwner: boolean,
    isTeamTab: boolean,
  ) => {
    if (taskList.length === 0) return <p className="text-muted-foreground text-sm">{t('noData')}</p>;
    return (
      <div className="space-y-3">
        {taskList.map(task => {
          const isOverdue = !task.completed && task.due_date && parseLocalDate(task.due_date) < new Date();
          const isUpdating = updatingTask === task.id;
          return (
            <div key={task.id} className="flex items-start gap-3 p-3 rounded-md border">
              <Checkbox
                checked={task.completed}
                disabled={isUpdating || isTeamTab}
                onCheckedChange={() => !isTeamTab && toggleTask(task)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <TaskStatusBadge status={task.status} t={t} />
                </div>
                {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                {task.link && (
                  <a href={task.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                    <ExternalLink className="h-3 w-3" /> Link
                  </a>
                )}
                {task.due_date && (
                  <div className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDateBR(task.due_date)}
                    {isOverdue && ` - ${t('overdue')}`}
                  </div>
                )}
                {task.review_comment && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {t('reviewComment')}: {task.review_comment}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                {!isUpdating && taskIsOwner && task.status === 'pending' && (
                  <Button size="sm" variant="outline" onClick={() => submitTask(task)}>
                    {t('submitTask')}
                  </Button>
                )}
                {!isUpdating && canReview && task.status === 'submitted' && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setReviewDialog({ open: true, mode: 'approve', task, isTeam: isTeamTab })}
                    >
                      {t('approveTask')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setReviewDialog({ open: true, mode: 'reject', task, isTeam: isTeamTab })}
                    >
                      {t('rejectTask')}
                    </Button>
                  </>
                )}
                {!isUpdating && task.completed && task.status !== 'submitted' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('personalDevelopment')}</h1>
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={() => { resetPdiForm(); setPdiDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" /> {t('createPdi')}
        </Button>
      </div>

      {showTeamTab ? (
        <Tabs defaultValue="my">
          <TabsList>
            <TabsTrigger value="my">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('myPdi')}
            </TabsTrigger>
            <TabsTrigger value="team">
              <UsersIcon className="h-4 w-4 mr-2" />
              {t('teamPdis')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="space-y-4 mt-4">
            {effectivePdis.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">{t('noPdis')}</CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {effectivePdis.map(pdi => {
                    const isThisPdiComplete = selectedPdi?.id === pdi.id && isPdiComplete;
                    return (
                      <Card
                        key={pdi.id}
                        className={`cursor-pointer hover:shadow-md ${selectedPdi?.id === pdi.id ? 'ring-2 ring-primary' : ''} ${isThisPdiComplete ? 'opacity-75' : ''}`}
                        onClick={() => setSelectedPdi(pdi)}
                      >
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> {pdi.title}
                            {isThisPdiComplete && (
                              <Badge className="bg-green-600 text-white ml-1">Concluido</Badge>
                            )}
                          </CardTitle>
                          {pdi.description && <CardDescription>{pdi.description}</CardDescription>}
                        </CardHeader>
                        {pdi.start_date && (
                          <CardContent className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDateBR(pdi.start_date)}
                            {pdi.end_date && ` - ${formatDateBR(pdi.end_date)}`}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
                {selectedPdi && (
                  <Card className={isPdiComplete ? 'opacity-75' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {selectedPdi.title} - {t('tasks')}
                          {isPdiComplete && (
                            <Badge className="bg-green-600 text-white">Concluido</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={handleExportPdiPdf}
                          >
                            <Download className="h-4 w-4" /> {t('exportPdf')}
                          </Button>
                          {!isPdiComplete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => { resetTaskForm(); setTaskDialogIsTeam(false); setTaskDialogOpen(true); }}
                            >
                              <Plus className="h-4 w-4" /> {t('createTask')}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progressPct} className="flex-1" />
                        <span className="text-sm font-medium">{progressPct}%</span>
                        <Badge variant="outline">{completedCount}/{effectiveTasks.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderTaskList(effectiveTasks, isOwner, false)}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4 mt-4">
            {teamPdis.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">{t('noPdis')}</CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {teamPdis.map(pdi => {
                    const isThisTeamPdiComplete = selectedTeamPdi?.id === pdi.id && isTeamPdiComplete;
                    return (
                      <Card
                        key={pdi.id}
                        className={`cursor-pointer hover:shadow-md ${selectedTeamPdi?.id === pdi.id ? 'ring-2 ring-primary' : ''} ${isThisTeamPdiComplete ? 'opacity-75' : ''}`}
                        onClick={() => setSelectedTeamPdi(pdi)}
                      >
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> {pdi.title}
                            {isThisTeamPdiComplete && (
                              <Badge className="bg-green-600 text-white ml-1">Concluido</Badge>
                            )}
                          </CardTitle>
                          {pdi.description && <CardDescription>{pdi.description}</CardDescription>}
                        </CardHeader>
                        {pdi.start_date && (
                          <CardContent className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDateBR(pdi.start_date)}
                            {pdi.end_date && ` - ${formatDateBR(pdi.end_date)}`}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
                {selectedTeamPdi && (
                  <Card className={isTeamPdiComplete ? 'opacity-75' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {selectedTeamPdi.title} - {t('tasks')}
                          {isTeamPdiComplete && (
                            <Badge className="bg-green-600 text-white">Concluido</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <GiveFeedback
                            toUserId={selectedTeamPdi.user_id}
                            toUserName={
                              allCollaborators.find(
                                (c) => c.user_id === selectedTeamPdi.user_id,
                              )?.full_name ?? 'liderado'
                            }
                          />
                          {!isTeamPdiComplete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => { resetTaskForm(); setTaskDialogIsTeam(true); setTaskDialogOpen(true); }}
                            >
                              <Plus className="h-4 w-4" /> {t('createTask')}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={teamProgressPct} className="flex-1" />
                        <span className="text-sm font-medium">{teamProgressPct}%</span>
                        <Badge variant="outline">{teamCompletedCount}/{effectiveTeamTasks.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderTaskList(effectiveTeamTasks, false, true)}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {effectivePdis.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">{t('noPdis')}</CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {effectivePdis.map(pdi => {
                  const isThisPdiComplete = selectedPdi?.id === pdi.id && isPdiComplete;
                  return (
                    <Card
                      key={pdi.id}
                      className={`cursor-pointer hover:shadow-md ${selectedPdi?.id === pdi.id ? 'ring-2 ring-primary' : ''} ${isThisPdiComplete ? 'opacity-75' : ''}`}
                      onClick={() => setSelectedPdi(pdi)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> {pdi.title}
                          {isThisPdiComplete && (
                            <Badge className="bg-green-600 text-white ml-1">Concluido</Badge>
                          )}
                        </CardTitle>
                        {pdi.description && <CardDescription>{pdi.description}</CardDescription>}
                      </CardHeader>
                      {pdi.start_date && (
                        <CardContent className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDateBR(pdi.start_date)}
                          {pdi.end_date && ` - ${formatDateBR(pdi.end_date)}`}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
              {selectedPdi && (
                <Card className={isPdiComplete ? 'opacity-75' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {selectedPdi.title} - {t('tasks')}
                        {isPdiComplete && (
                          <Badge className="bg-green-600 text-white">Concluido</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={handleExportPdiPdf}
                        >
                          <Download className="h-4 w-4" /> {t('exportPdf')}
                        </Button>
                        {!isPdiComplete && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => { resetTaskForm(); setTaskDialogIsTeam(true); setTaskDialogOpen(true); }}
                          >
                            <Plus className="h-4 w-4" /> {t('createTask')}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progressPct} className="flex-1" />
                      <span className="text-sm font-medium">{progressPct}%</span>
                      <Badge variant="outline">{completedCount}/{effectiveTasks.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderTaskList(effectiveTasks, isOwner, false)}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {alerts.length > 0 && <AlertsPanel alerts={alerts} />}

      <ReviewDialog
        open={reviewDialog.open}
        mode={reviewDialog.mode}
        taskTitle={reviewDialog.task?.title ?? ''}
        onClose={() => setReviewDialog({ open: false, mode: 'approve', task: null })}
        onConfirm={confirmReview}
        t={t}
      />

      <Dialog open={pdiDialogOpen} onOpenChange={setPdiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createPdi')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {canAssignToOthers && assignableCollaborators.length > 0 && (
              <div className="space-y-2">
                <Label>Para quem</Label>
                <Select value={newPdiAssignee} onValueChange={setNewPdiAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Para mim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Para mim</SelectItem>
                    {assignableCollaborators.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('pdiTitle')}</Label>
              <Input
                value={newPdiTitle}
                onChange={(e) => setNewPdiTitle(e.target.value)}
                placeholder={t('pdiTitle')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('pdiDescription')}</Label>
              <Textarea
                value={newPdiDescription}
                onChange={(e) => setNewPdiDescription(e.target.value)}
                placeholder={t('pdiDescription')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('startDate')}</Label>
                <Input
                  type="date"
                  value={newPdiStartDate}
                  onChange={(e) => setNewPdiStartDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">(selecione pelo calendario)</p>
              </div>
              <div className="space-y-2">
                <Label>{t('endDate')}</Label>
                <Input
                  type="date"
                  value={newPdiEndDate}
                  onChange={(e) => setNewPdiEndDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">(selecione pelo calendario)</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPdiDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleCreatePdi} disabled={creatingPdi || !newPdiTitle.trim()}>
                {creatingPdi && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('save')}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createTask')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('taskTitle')}</Label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={t('taskTitle')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('taskDescription')}</Label>
              <Textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder={t('taskDescription')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('taskLink')}</Label>
              <Input
                value={newTaskLink}
                onChange={(e) => {
                  setNewTaskLink(e.target.value);
                  setNewTaskLinkError('');
                }}
                placeholder="https://"
                type="url"
              />
              {newTaskLinkError && (
                <p className="text-xs text-destructive">{newTaskLinkError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('dueDate')}</Label>
              <Input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">(selecione pelo calendario)</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleCreateTask} disabled={creatingTask || !newTaskTitle.trim()}>
                {creatingTask && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('save')}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
