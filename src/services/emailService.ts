import { DEMO_MODE } from "@/lib/demoMode";

const GHL_PROXY_URL = "https://analytics.elmistihostels.com/api/ghl/proxy";

export interface EmailNotification {
  to: string;
  toName: string;
  subject: string;
  body: string;
  type:
    | "evaluation_assigned"
    | "evaluation_completed"
    | "pdi_approved"
    | "pdi_rejected"
    | "reminder"
    | "pdi_submitted"
    | "escalation"
    | "one_on_one_scheduled"
    | "one_on_one_reminder"
    | "one_on_one_cancelled";
}

const RECURRENCE_LABEL_PT: Record<string, string> = {
  weekly: "semanal",
  biweekly: "quinzenal",
  monthly: "mensal",
};

function formatScheduledAtBR(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  } catch {
    return iso;
  }
}

export function getEvaluationAssignedEmail(
  collaboratorName: string,
  evaluationType: string,
  month: number,
  year: number,
): EmailNotification {
  return {
    to: "",
    toName: collaboratorName,
    subject: `Nova avaliação atribuída - ${evaluationType}`,
    body: `<h2>Olá ${collaboratorName},</h2>
<p>Uma nova avaliação do tipo <strong>${evaluationType}</strong> foi atribuída a você para ${month}/${year}.</p>
<p>Acesse o <a href="https://hr.elmistihostels.com/evaluations">HR Compass</a> para preencher.</p>
<p>Equipe RH - El Misti</p>`,
    type: "evaluation_assigned",
  };
}

export function getEvaluationCompletedEmail(
  gestorName: string,
  collaboratorName: string,
  evaluationType: string,
): EmailNotification {
  return {
    to: "",
    toName: gestorName,
    subject: `Avaliação concluída - ${collaboratorName}`,
    body: `<h2>Olá ${gestorName},</h2>
<p>${collaboratorName} completou a avaliação de <strong>${evaluationType}</strong>.</p>
<p>Acesse o <a href="https://hr.elmistihostels.com/evaluations">HR Compass</a> para revisar.</p>
<p>Equipe RH - El Misti</p>`,
    type: "evaluation_completed",
  };
}

export function getPdiApprovedEmail(
  collaboratorName: string,
  taskTitle: string,
  comment?: string,
): EmailNotification {
  return {
    to: "",
    toName: collaboratorName,
    subject: `Tarefa PDI aprovada - ${taskTitle}`,
    body: `<h2>Olá ${collaboratorName},</h2>
<p>Sua tarefa <strong>${taskTitle}</strong> foi aprovada!</p>
${comment ? `<p><em>Comentário: ${comment}</em></p>` : ""}
<p>Acesse o <a href="https://hr.elmistihostels.com/pdi">HR Compass</a> para ver detalhes.</p>
<p>Equipe RH - El Misti</p>`,
    type: "pdi_approved",
  };
}

export function getPdiRejectedEmail(
  collaboratorName: string,
  taskTitle: string,
  comment: string,
): EmailNotification {
  return {
    to: "",
    toName: collaboratorName,
    subject: `Tarefa PDI requer ajustes - ${taskTitle}`,
    body: `<h2>Olá ${collaboratorName},</h2>
<p>Sua tarefa <strong>${taskTitle}</strong> requer ajustes.</p>
<p><em>Comentário: ${comment}</em></p>
<p>Acesse o <a href="https://hr.elmistihostels.com/pdi">HR Compass</a> para atualizar.</p>
<p>Equipe RH - El Misti</p>`,
    type: "pdi_rejected",
  };
}

export function getPdiSubmittedEmail(
  gestorName: string,
  collaboratorName: string,
  taskTitle: string,
): EmailNotification {
  return {
    to: "",
    toName: gestorName,
    subject: `Tarefa PDI submetida para revisão - ${taskTitle}`,
    body: `<h2>Olá ${gestorName},</h2>
<p>${collaboratorName} submeteu a tarefa <strong>${taskTitle}</strong> para sua revisão.</p>
<p>Acesse o <a href="https://hr.elmistihostels.com/pdi">HR Compass</a> para revisar.</p>
<p>Equipe RH - El Misti</p>`,
    type: "pdi_submitted",
  };
}

export function getEscalationEmail(
  adminName: string,
  collaboratorName: string,
  taskTitle: string,
  days: number,
): EmailNotification {
  return {
    to: "",
    toName: adminName,
    subject: `URGENTE: Tarefa PDI sem revisão há ${days} dias - ${taskTitle}`,
    body: `<h2>Olá ${adminName},</h2>
<p><strong>URGENTE:</strong> A tarefa <strong>${taskTitle}</strong> de ${collaboratorName} está sem revisão há ${days} dias. Intervenção necessária.</p>
<p>Acesse o <a href="https://hr.elmistihostels.com/pdi">HR Compass</a> para resolver.</p>
<p>Equipe RH - El Misti</p>`,
    type: "escalation",
  };
}

export function getOneOnOneScheduledEmail(
  managerName: string,
  reportName: string,
  scheduledAt: string,
  recurrenceRule: "weekly" | "biweekly" | "monthly" | null,
): EmailNotification {
  const when = formatScheduledAtBR(scheduledAt);
  const recurrenceLabel = recurrenceRule
    ? RECURRENCE_LABEL_PT[recurrenceRule]
    : null;
  const recurrenceLine = recurrenceLabel
    ? `<p>Recorrência: <strong>${recurrenceLabel}</strong>.</p>`
    : "";
  return {
    to: "",
    toName: reportName,
    subject: `1:1 agendada — ${managerName} & ${reportName}`,
    body: `<h2>Olá,</h2>
<p>Uma 1:1 entre <strong>${managerName}</strong> e <strong>${reportName}</strong> foi agendada.</p>
<p>Quando: <strong>${when}</strong> (horário de Brasília).</p>
${recurrenceLine}
<p>Acesse o <a href="https://hr.elmistihostels.com/one-on-ones">HR Compass</a> para registrar pauta antes do encontro.</p>
<p>Equipe RH - El Misti</p>`,
    type: "one_on_one_scheduled",
  };
}

export function getOneOnOneReminderEmail(
  managerName: string,
  reportName: string,
  scheduledAt: string,
): EmailNotification {
  const when = formatScheduledAtBR(scheduledAt);
  return {
    to: "",
    toName: reportName,
    subject: `Lembrete: 1:1 amanhã — ${managerName} & ${reportName}`,
    body: `<h2>Olá,</h2>
<p>Lembrete: a 1:1 entre <strong>${managerName}</strong> e <strong>${reportName}</strong> acontece em breve.</p>
<p>Quando: <strong>${when}</strong> (horário de Brasília).</p>
<p>Aproveite para registrar pontos de pauta no <a href="https://hr.elmistihostels.com/one-on-ones">HR Compass</a>.</p>
<p>Equipe RH - El Misti</p>`,
    type: "one_on_one_reminder",
  };
}

export function getOneOnOneCancelledEmail(
  managerName: string,
  reportName: string,
  scheduledAt: string,
): EmailNotification {
  const when = formatScheduledAtBR(scheduledAt);
  return {
    to: "",
    toName: reportName,
    subject: `1:1 cancelada — ${managerName} & ${reportName}`,
    body: `<h2>Olá,</h2>
<p>A 1:1 entre <strong>${managerName}</strong> e <strong>${reportName}</strong> agendada para <strong>${when}</strong> foi cancelada.</p>
<p>Para reagendar, acesse o <a href="https://hr.elmistihostels.com/one-on-ones">HR Compass</a>.</p>
<p>Equipe RH - El Misti</p>`,
    type: "one_on_one_cancelled",
  };
}

export async function sendEmailNotification(
  notification: EmailNotification,
): Promise<boolean> {
  if (DEMO_MODE) {
    console.log(
      "[DEMO] Email notification:",
      notification.type,
      "to:",
      notification.toName,
    );
    return true;
  }

  try {
    const token = import.meta.env.VITE_HR_NOTIFY_TOKEN || "";
    if (!token) {
      console.warn(
        "[email] VITE_HR_NOTIFY_TOKEN nao configurado — email nao sera enviado",
      );
      return false;
    }
    const response = await fetch(GHL_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-HR-Notify-Token": token,
      },
      body: JSON.stringify({
        path: "/conversations/messages",
        method: "POST",
        body: {
          type: "Email",
          contactId: notification.to,
          subject: notification.subject,
          html: notification.body,
        },
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[email] HTTP ${response.status} ao enviar (${notification.type}):`,
        text,
      );
    }
    return response.ok;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
