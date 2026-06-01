import { useMemo } from 'react';
import { Kpi, KpiResult, PdiTask, Pdi, Dependent } from '@/types/database';

export interface Alert {
  id: string;
  type: 'kpi_low' | 'pdi_overdue' | 'pdi_pending_review' | 'pdi_urgent_review' | 'birthday_upcoming' | 'pdi_inactive' | 'pdi_half_month';
  severity: 'warning' | 'error';
  title: string;
  description: string;
  actionUrl?: string;
  kpiName?: string;
  taskName?: string;
  value?: number;
  target?: number;
  days?: number;
}

interface UseAlertsParams {
  kpis: Kpi[];
  kpiResults: KpiResult[];
  pdiTasks: PdiTask[];
  month: number;
  year: number;
  dependents?: Dependent[];
  pdis?: Pdi[];
}

export function useAlerts({ kpis, kpiResults, pdiTasks, month, year, dependents, pdis }: UseAlertsParams): Alert[] {
  return useMemo(() => {
    const alerts: Alert[] = [];

    // Check KPIs below 50% of target
    const currentMonthResults = kpiResults.filter(
      r => r.month === month && r.year === year
    );

    currentMonthResults.forEach(result => {
      const kpi = kpis.find(k => k.id === result.kpi_id);
      if (kpi && kpi.target_value) {
        const percentage = (result.score / kpi.target_value) * 100;
        if (percentage < 50) {
          alerts.push({
            id: `kpi-${result.id}`,
            type: 'kpi_low',
            severity: percentage < 25 ? 'error' : 'warning',
            title: kpi.name,
            description: `${kpi.name} esta abaixo de 50% da meta (${percentage.toFixed(0)}%)`,
            kpiName: kpi.name,
            value: result.score,
            target: kpi.target_value,
          });
        }
      }
    });

    // Check overdue PDI tasks
    const now = new Date();
    pdiTasks.forEach(task => {
      if (!task.completed && task.due_date) {
        const dueDate = new Date(task.due_date);
        if (dueDate < now) {
          alerts.push({
            id: `pdi-${task.id}`,
            type: 'pdi_overdue',
            severity: 'error',
            title: task.title,
            description: `${task.title} esta com prazo vencido`,
            taskName: task.title,
          });
        }
      }
    });

    // Check submitted tasks awaiting review
    pdiTasks.forEach(task => {
      if (task.status === 'submitted' && task.updated_at) {
        const submittedDate = new Date(task.updated_at);
        const diffMs = now.getTime() - submittedDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays >= 10) {
          alerts.push({
            id: `pdi-urgent-${task.id}`,
            type: 'pdi_urgent_review',
            severity: 'error',
            title: task.title,
            description: `URGENTE: ${task.title} sem revisão há ${diffDays} dias`,
            taskName: task.title,
            days: diffDays,
          });
        } else if (diffDays >= 5) {
          alerts.push({
            id: `pdi-pending-${task.id}`,
            type: 'pdi_pending_review',
            severity: 'warning',
            title: task.title,
            description: `${task.title} aguardando aprovação há ${diffDays} dias`,
            taskName: task.title,
            days: diffDays,
          });
        }
      }
    });

    // Check upcoming birthdays in the next 7 days
    if (dependents && dependents.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      dependents.forEach(dep => {
        if (!dep.birth_date) return;

        const [, birthMonth, birthDay] = dep.birth_date.split('-').map(Number);

        // Check each of the next 7 days (today inclusive)
        for (let offset = 0; offset <= 7; offset++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + offset);

          if (
            checkDate.getMonth() + 1 === birthMonth &&
            checkDate.getDate() === birthDay
          ) {
            const displayDate = `${String(birthDay).padStart(2, '0')}/${String(birthMonth).padStart(2, '0')}`;
            alerts.push({
              id: `birthday-${dep.id}`,
              type: 'birthday_upcoming',
              severity: 'warning',
              title: dep.name,
              description: `Aniversario de ${dep.name} (${dep.relationship}) em ${displayDate}`,
            });
            break;
          }
        }
      });
    }

    // Check PDI inactivity (14+ days without any task update, with pending tasks)
    if (pdis && pdis.length > 0) {
      const INACTIVE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

      pdis.forEach(pdi => {
        const pdiTasks_ = pdiTasks.filter(t => t.pdi_id === pdi.id);
        const pendingTasks = pdiTasks_.filter(t => t.status !== 'approved');

        // Only alert when there are pending tasks (something left to do)
        if (pendingTasks.length === 0) return;

        const mostRecentUpdate = pendingTasks.reduce<number | null>((latest, task) => {
          if (!task.updated_at) return latest;
          const ts = new Date(task.updated_at).getTime();
          return latest === null || ts > latest ? ts : latest;
        }, null);

        const isInactive =
          mostRecentUpdate === null ||
          now.getTime() - mostRecentUpdate > INACTIVE_THRESHOLD_MS;

        if (isInactive) {
          alerts.push({
            id: `pdi-inactive-${pdi.id}`,
            type: 'pdi_inactive',
            severity: 'warning',
            title: pdi.title,
            description: `PDI "${pdi.title}" sem atividade ha mais de 14 dias`,
            actionUrl: '/pdi',
          });
        }
      });
    }

    // Check half-month without any task completion this month (day >= 15)
    if (pdis && pdis.length > 0 && now.getDate() >= 15) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      pdis.forEach(pdi => {
        const pdiTasks_ = pdiTasks.filter(t => t.pdi_id === pdi.id);

        // A task is "completed this month" when it reached submitted or approved
        // and its updated_at falls within the current calendar month
        const completedThisMonth = pdiTasks_.some(t => {
          if (t.status !== 'submitted' && t.status !== 'approved') return false;
          if (!t.updated_at) return false;
          return new Date(t.updated_at).getTime() >= startOfMonth;
        });

        if (!completedThisMonth) {
          alerts.push({
            id: `pdi-half-month-${pdi.id}`,
            type: 'pdi_half_month',
            severity: 'warning',
            title: pdi.title,
            description: `Metade do mes e nenhuma tarefa do PDI foi concluida`,
            actionUrl: '/pdi',
          });
        }
      });
    }

    return alerts;
  }, [kpis, kpiResults, pdiTasks, month, year, dependents, pdis]);
}
