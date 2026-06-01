import {
  sendEmailNotification,
  getEvaluationAssignedEmail,
  getEvaluationCompletedEmail,
  getPdiApprovedEmail,
  getPdiRejectedEmail,
  getPdiSubmittedEmail,
  getEscalationEmail,
  getOneOnOneScheduledEmail,
  getOneOnOneReminderEmail,
  getOneOnOneCancelledEmail,
} from "@/services/emailService";
import { fetchProfiles } from "@/services/profileService";
import { DEMO_MODE } from "@/lib/demoMode";

type RecurrenceRule = "weekly" | "biweekly" | "monthly" | null;

async function resolveProfilePair(managerId: string, reportId: string) {
  const profiles = await fetchProfiles();
  const manager = profiles.find((p) => p.user_id === managerId);
  const report = profiles.find((p) => p.user_id === reportId);
  return { manager, report };
}

export function useEmailNotifications() {
  const notifyEvaluationAssigned = async (
    email: string,
    name: string,
    type: string,
    month: number,
    year: number,
  ): Promise<boolean> => {
    const notification = getEvaluationAssignedEmail(name, type, month, year);
    notification.to = email;
    return sendEmailNotification(notification);
  };

  const notifyEvaluationCompleted = async (
    email: string,
    gestorName: string,
    collabName: string,
    type: string,
  ): Promise<boolean> => {
    const notification = getEvaluationCompletedEmail(
      gestorName,
      collabName,
      type,
    );
    notification.to = email;
    return sendEmailNotification(notification);
  };

  const notifyPdiApproved = async (
    email: string,
    name: string,
    taskTitle: string,
    comment?: string,
  ): Promise<boolean> => {
    const notification = getPdiApprovedEmail(name, taskTitle, comment);
    notification.to = email;
    return sendEmailNotification(notification);
  };

  const notifyPdiRejected = async (
    email: string,
    name: string,
    taskTitle: string,
    comment: string,
  ): Promise<boolean> => {
    const notification = getPdiRejectedEmail(name, taskTitle, comment);
    notification.to = email;
    return sendEmailNotification(notification);
  };

  const notifyPdiSubmitted = async (
    email: string,
    gestorName: string,
    collabName: string,
    taskTitle: string,
  ): Promise<boolean> => {
    const notification = getPdiSubmittedEmail(
      gestorName,
      collabName,
      taskTitle,
    );
    notification.to = email;
    return sendEmailNotification(notification);
  };

  const notifyEscalation = async (
    email: string,
    adminName: string,
    collabName: string,
    taskTitle: string,
    days: number,
  ): Promise<boolean> => {
    const notification = getEscalationEmail(
      adminName,
      collabName,
      taskTitle,
      days,
    );
    notification.to = email;
    return sendEmailNotification(notification);
  };

  const notifyOneOnOneScheduled = async (
    managerId: string,
    reportId: string,
    scheduledAt: string,
    recurrenceRule: RecurrenceRule,
  ): Promise<boolean> => {
    if (DEMO_MODE) {
      console.log("[DEMO] notifyOneOnOneScheduled", {
        managerId,
        reportId,
        scheduledAt,
        recurrenceRule,
      });
      return true;
    }
    try {
      const { manager, report } = await resolveProfilePair(managerId, reportId);
      if (!manager || !report) {
        console.warn(
          "[email] notifyOneOnOneScheduled: profile nao encontrado",
          { managerId, reportId },
        );
        return false;
      }
      const template = getOneOnOneScheduledEmail(
        manager.full_name,
        report.full_name,
        scheduledAt,
        recurrenceRule,
      );
      const sendTo = async (to: string) => {
        const n = { ...template, to };
        return sendEmailNotification(n);
      };
      const [a, b] = await Promise.all([
        sendTo(manager.email),
        sendTo(report.email),
      ]);
      return a && b;
    } catch (err) {
      console.error("[email] notifyOneOnOneScheduled falhou", err);
      return false;
    }
  };

  const notifyOneOnOneCancelled = async (
    managerId: string,
    reportId: string,
    scheduledAt: string,
  ): Promise<boolean> => {
    if (DEMO_MODE) {
      console.log("[DEMO] notifyOneOnOneCancelled", {
        managerId,
        reportId,
        scheduledAt,
      });
      return true;
    }
    try {
      const { manager, report } = await resolveProfilePair(managerId, reportId);
      if (!manager || !report) {
        console.warn(
          "[email] notifyOneOnOneCancelled: profile nao encontrado",
          { managerId, reportId },
        );
        return false;
      }
      const template = getOneOnOneCancelledEmail(
        manager.full_name,
        report.full_name,
        scheduledAt,
      );
      const sendTo = async (to: string) => {
        const n = { ...template, to };
        return sendEmailNotification(n);
      };
      const [a, b] = await Promise.all([
        sendTo(manager.email),
        sendTo(report.email),
      ]);
      return a && b;
    } catch (err) {
      console.error("[email] notifyOneOnOneCancelled falhou", err);
      return false;
    }
  };

  const notifyOneOnOneReminder = async (
    managerId: string,
    reportId: string,
    scheduledAt: string,
  ): Promise<boolean> => {
    if (DEMO_MODE) {
      console.log("[DEMO] notifyOneOnOneReminder", {
        managerId,
        reportId,
        scheduledAt,
      });
      return true;
    }
    try {
      const { manager, report } = await resolveProfilePair(managerId, reportId);
      if (!manager || !report) return false;
      const template = getOneOnOneReminderEmail(
        manager.full_name,
        report.full_name,
        scheduledAt,
      );
      const sendTo = async (to: string) => {
        const n = { ...template, to };
        return sendEmailNotification(n);
      };
      const [a, b] = await Promise.all([
        sendTo(manager.email),
        sendTo(report.email),
      ]);
      return a && b;
    } catch (err) {
      console.error("[email] notifyOneOnOneReminder falhou", err);
      return false;
    }
  };

  return {
    notifyEvaluationAssigned,
    notifyEvaluationCompleted,
    notifyPdiApproved,
    notifyPdiRejected,
    notifyPdiSubmitted,
    notifyEscalation,
    notifyOneOnOneScheduled,
    notifyOneOnOneCancelled,
    notifyOneOnOneReminder,
  };
}
