import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR, es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Gift,
  Star,
  List,
  Grid,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEMO_MODE } from "@/lib/demoMode";
import { cn } from "@/lib/utils";
import { useAllPdiTasks, useTeamPdiTasks } from "@/services/pdiService";
import { useEvaluations } from "@/services/evaluationService";
import { useDependents } from "@/services/dependentService";
import { useCollaborators } from "@/services/profileService";
import { useViewMode } from "@/contexts/ViewModeContext";
import {
  useMyContentAssignments,
  useContentItemsCreated,
} from "@/services/contentService";
import { useMyOneOnOnes } from "@/services/oneOnOneService";
import { User, Users, GraduationCap, BookOpen, ListChecks } from "lucide-react";

interface CalendarEvent {
  type:
    | "evaluation"
    | "pdi_task"
    | "birthday"
    | "experience"
    | "goal"
    | "content_due"
    | "one_on_one";
  title: string;
  date: string;
  assignee: string;
  color:
    | "blue"
    | "green"
    | "red"
    | "purple"
    | "orange"
    | "teal"
    | "amber"
    | "indigo";
  overdue?: boolean;
  isPersonal?: boolean; // true = belongs to the logged-in user
}

// Events visible to the collaborator (their own stuff)
const mockPersonalEvents: CalendarEvent[] = [
  {
    type: "evaluation",
    title: "Minha Avaliação Cultural",
    date: "2026-04-20",
    assignee: "Demo Admin",
    color: "blue",
    isPersonal: true,
  },
  {
    type: "pdi_task",
    title: "Curso de liderança situacional",
    date: "2026-04-30",
    assignee: "Demo Admin",
    color: "green",
    overdue: false,
    isPersonal: true,
  },
  {
    type: "pdi_task",
    title: "Mentoria gerente",
    date: "2026-04-10",
    assignee: "Demo Admin",
    color: "red",
    overdue: true,
    isPersonal: true,
  },
  {
    type: "birthday",
    title: "Aniversario: Sofia (filha)",
    date: "2026-04-20",
    assignee: "Demo Admin",
    color: "purple",
    isPersonal: true,
  },
  {
    type: "goal",
    title: "Meta: NPS > 80pts",
    date: "2026-04-30",
    assignee: "Demo Admin",
    color: "teal",
    isPersonal: true,
  },
  {
    type: "goal",
    title: "Meta: Ocupação > 75%",
    date: "2026-04-30",
    assignee: "Demo Admin",
    color: "teal",
    isPersonal: true,
  },
  {
    type: "one_on_one",
    title: "1:1 com German",
    date: "2026-04-18",
    assignee: "Demo Admin",
    color: "indigo",
    isPersonal: true,
  },
];

// All events visible to gestor/admin (team panoramic view)
const mockTeamEvents: CalendarEvent[] = [
  ...mockPersonalEvents,
  {
    type: "evaluation",
    title: "Avaliação Cultural - Ana Garcia",
    date: "2026-04-20",
    assignee: "Ana Garcia",
    color: "blue",
  },
  {
    type: "evaluation",
    title: "Avaliação Desempenho - Carlos Rodriguez",
    date: "2026-04-25",
    assignee: "Carlos Rodriguez",
    color: "blue",
  },
  {
    type: "evaluation",
    title: "Avaliação Cultural - Maria Lopez",
    date: "2026-04-22",
    assignee: "Maria Lopez",
    color: "blue",
  },
  {
    type: "pdi_task",
    title: "Nivel B1 Cambridge - Ana Garcia",
    date: "2026-04-28",
    assignee: "Ana Garcia",
    color: "green",
  },
  {
    type: "pdi_task",
    title: "Curso atendimento - Carlos Rodriguez",
    date: "2026-04-05",
    assignee: "Carlos Rodriguez",
    color: "red",
    overdue: true,
  },
  {
    type: "birthday",
    title: "Aniversario: Lucas (filho Ana)",
    date: "2026-04-12",
    assignee: "Ana Garcia",
    color: "purple",
  },
  {
    type: "experience",
    title: "90 dias - Ana Garcia",
    date: "2026-04-15",
    assignee: "Ana Garcia",
    color: "orange",
  },
  {
    type: "experience",
    title: "30 dias - Carlos Rodriguez",
    date: "2026-04-08",
    assignee: "Carlos Rodriguez",
    color: "orange",
  },
  {
    type: "goal",
    title: "Meta equipe: Reviews > 90%",
    date: "2026-04-30",
    assignee: "Equipe",
    color: "teal",
  },
  {
    type: "one_on_one",
    title: "1:1 com Ana Garcia",
    date: "2026-04-16",
    assignee: "Ana Garcia",
    color: "indigo",
  },
  {
    type: "one_on_one",
    title: "1:1 com Carlos Rodriguez",
    date: "2026-04-23",
    assignee: "Carlos Rodriguez",
    color: "indigo",
  },
];

const colorClasses: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  indigo: "bg-indigo-500",
};

const colorBadgeClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  green: "bg-green-100 text-green-800 border-green-200",
  red: "bg-red-100 text-red-800 border-red-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  teal: "bg-teal-100 text-teal-800 border-teal-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const eventIcons: Record<string, React.ElementType> = {
  evaluation: Star,
  pdi_task: Clock,
  birthday: Gift,
  experience: CalendarDays,
  goal: Star,
  content_due: GraduationCap,
  one_on_one: Users,
};

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const NAVIGABLE_TYPES: Record<string, string | null> = {
  evaluation: "/evaluations",
  pdi_task: "/pdi",
  birthday: null,
  experience: null,
  goal: "/kpis",
  content_due: "/content",
  one_on_one: "/one-on-ones",
};

export default function Calendar() {
  const { profile, isGestor, isAdmin } = useAuth();
  const { viewMode: roleMode } = useViewMode();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [calendarScope, setCalendarScope] = useState<"personal" | "team">(
    "personal",
  );

  // Team scope is only available when the user has a leadership role and is currently
  // operating in "Visao Gestor". A pure colaborador never sees the team toggle.
  const canSeeTeam = (isGestor || isAdmin) && roleMode === "team";

  // If the role mode flips to personal, force the calendar scope back to personal
  // so the user does not stay locked on a hidden team view.
  useEffect(() => {
    if (!canSeeTeam && calendarScope === "team") {
      setCalendarScope("personal");
    }
  }, [canSeeTeam, calendarScope]);

  // Real data hooks (only used when not in DEMO_MODE)
  const allPdiTasksQuery = useAllPdiTasks(profile?.user_id);
  const teamPdiTasksQuery = useTeamPdiTasks(profile?.id, canSeeTeam);
  const evaluationsQuery = useEvaluations(
    !DEMO_MODE && profile
      ? { userId: profile.user_id, isAdmin, isGestor }
      : null,
  );
  const dependentsQuery = useDependents();
  // Carrega collaborators sempre — necessario pra resolver nome do "outro lado"
  // das 1:1s no modo Pessoal (pode envolver gestor que nao esta em canSeeTeam).
  const collaboratorsQuery = useCollaborators(true);

  // Fase 3 (Conteudo): liderado ve seus prazos pessoais; gestor (em modo team) ve
  // tambem os items que criou com due_date.
  const myContentQuery = useMyContentAssignments(profile?.user_id);
  const teamContentQuery = useContentItemsCreated(canSeeTeam);

  // Onda 3b (1:1): semantica (b) — Pessoal mostra TUDO que envolve voce
  // (como manager OU report). Equipe mostra so onde voce e manager (panorama
  // do time). Hooks sempre habilitados quando ha user_id.
  const myReportOneOnOnesQuery = useMyOneOnOnes(profile?.user_id, false);
  const myManagerOneOnOnesQuery = useMyOneOnOnes(profile?.user_id, true);

  const events: CalendarEvent[] = (() => {
    if (DEMO_MODE) {
      return calendarScope === "team" && canSeeTeam
        ? mockTeamEvents
        : mockPersonalEvents;
    }

    // Build real events from service data
    const realEvents: CalendarEvent[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const userId = profile?.user_id ?? "";
    const userName = profile?.full_name ?? "Usuario";

    // Lookup map user_id -> full_name (only populated when team scope is active)
    const collaborators = collaboratorsQuery.data ?? [];
    const nameByUserId = new Map<string, string>(
      collaborators.map((c) => [c.user_id, c.full_name]),
    );
    const resolveName = (uid: string | null | undefined): string => {
      if (!uid) return "Colaborador";
      if (uid === userId) return userName;
      return nameByUserId.get(uid) ?? "Colaborador";
    };

    // PDI tasks — own (always personal) + team (only when team scope is active)
    const ownTasks = allPdiTasksQuery.data ?? [];
    ownTasks.forEach((task) => {
      if (!task.due_date) return;
      const taskDate = new Date(task.due_date);
      const isOverdue = !task.completed && taskDate < now;
      realEvents.push({
        type: "pdi_task",
        title: task.title,
        date: task.due_date.slice(0, 10),
        assignee: userName,
        color: isOverdue ? "red" : "green",
        overdue: isOverdue,
        isPersonal: true,
      });
    });

    if (calendarScope === "team" && canSeeTeam) {
      const teamTasks = teamPdiTasksQuery.data ?? [];
      teamTasks.forEach((task) => {
        if (!task.due_date) return;
        const taskDate = new Date(task.due_date);
        const isOverdue = !task.completed && taskDate < now;
        const ownerName = task.user_name ?? resolveName(task.user_id);
        realEvents.push({
          type: "pdi_task",
          title: `${task.title} - ${ownerName}`,
          date: task.due_date.slice(0, 10),
          assignee: ownerName,
          color: isOverdue ? "red" : "green",
          overdue: isOverdue,
          isPersonal: false,
        });
      });
    }

    // Evaluations — use first day of month as anchor date (month/year only)
    const evaluations = evaluationsQuery.data ?? [];
    evaluations.forEach((ev) => {
      const isPersonal = ev.assigned_to === userId;
      if (calendarScope === "personal" && !isPersonal) return;
      const dateStr = `${ev.year}-${String(ev.month).padStart(2, "0")}-01`;
      const typeLabel =
        ev.type === "cultural"
          ? "Cultural"
          : ev.type === "performance"
            ? "Desempenho"
            : "KPI";
      const assigneeName = isPersonal ? userName : resolveName(ev.assigned_to);
      const titleSuffix = !isPersonal ? ` - ${assigneeName}` : "";
      realEvents.push({
        type: "evaluation",
        title: `Avaliação ${typeLabel}${titleSuffix} - ${ev.month}/${ev.year}`,
        date: dateStr,
        assignee: assigneeName,
        color: "blue",
        isPersonal,
      });
    });

    // Content (Fase 3): pessoal — assignments do liderado com prazo
    const myContentAssignments = myContentQuery.data ?? [];
    myContentAssignments.forEach((a) => {
      const due = a.item?.due_date;
      if (!due) return;
      const isCompleted = a.status === "completed";
      if (isCompleted) return;
      const dueDate = new Date(due + "T12:00:00");
      const isOverdue = dueDate < now;
      realEvents.push({
        type: "content_due",
        title: a.item?.title ?? "Conteudo",
        date: due.slice(0, 10),
        assignee: userName,
        color: isOverdue ? "red" : "amber",
        overdue: isOverdue,
        isPersonal: true,
      });
    });

    // Content (Fase 3): team — items criados pelo gestor com prazo
    if (calendarScope === "team" && canSeeTeam) {
      const createdItems = teamContentQuery.data ?? [];
      createdItems.forEach((item) => {
        if (!item.due_date) return;
        realEvents.push({
          type: "content_due",
          title: `${item.title} (prazo time)`,
          date: item.due_date.slice(0, 10),
          assignee: "Equipe",
          color: "amber",
          isPersonal: false,
        });
      });
    }

    // 1:1 (Onda 3b — semantica b): Pessoal une os 2 lados (sou report OU manager).
    // Equipe mostra so o lado manager (panorama das 1:1s do time).
    // Dedup por id garante que se ambas as pontas trouxerem a mesma 1:1, ela
    // aparece uma vez so.
    const reportOneOnOnes = myReportOneOnOnesQuery.data ?? [];
    const managerOneOnOnes = myManagerOneOnOnesQuery.data ?? [];
    const seenOneOnOneIds = new Set<string>();

    const pushOneOnOne = (
      ooo: (typeof reportOneOnOnes)[number],
      iAmManager: boolean,
    ) => {
      if (ooo.status !== "scheduled") return;
      if (seenOneOnOneIds.has(ooo.id)) return;
      seenOneOnOneIds.add(ooo.id);
      const otherUserId = iAmManager ? ooo.report_id : ooo.manager_id;
      const otherName = resolveName(otherUserId);
      realEvents.push({
        type: "one_on_one",
        title: `1:1 com ${otherName}`,
        date: ooo.scheduled_at.slice(0, 10),
        assignee: iAmManager ? otherName : userName,
        color: "indigo",
        isPersonal: !iAmManager || calendarScope === "personal",
      });
    };

    if (calendarScope === "personal") {
      // Tudo que me envolve (report + manager)
      reportOneOnOnes.forEach((o) => pushOneOnOne(o, false));
      managerOneOnOnes.forEach((o) => pushOneOnOne(o, true));
    } else if (calendarScope === "team" && canSeeTeam) {
      // Equipe: panorama das 1:1s onde sou gestor
      managerOneOnOnes.forEach((o) => pushOneOnOne(o, true));
    }

    // Dependents birthdays — use current year, month+day from birth_date
    const dependents = dependentsQuery.data ?? [];
    dependents.forEach((dep) => {
      if (!dep.birth_date) return;
      const parts = dep.birth_date.slice(0, 10).split("-");
      if (parts.length < 3) return;
      const birthMonth = parts[1];
      const birthDay = parts[2];
      const dateStr = `${currentYear}-${birthMonth}-${birthDay}`;
      realEvents.push({
        type: "birthday",
        title: `Aniversario: ${dep.name}`,
        date: dateStr,
        assignee: userName,
        color: "purple",
        isPersonal: true,
      });
    });

    return realEvents;
  })();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = language === "pt" ? WEEKDAYS_PT : WEEKDAYS_ES;
  const monthNames = language === "pt" ? MONTH_NAMES_PT : MONTH_NAMES_ES;

  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events.filter((ev) => {
      const evDate = new Date(ev.date + "T12:00:00");
      return isSameDay(evDate, day);
    });
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const listEvents = [...events]
    .sort((a, b) => {
      const aDate = new Date(a.date + "T12:00:00");
      const bDate = new Date(b.date + "T12:00:00");
      return aDate.getTime() - bDate.getTime();
    })
    .filter((ev) => {
      const evDate = new Date(ev.date + "T12:00:00");
      return isSameMonth(evDate, currentDate);
    });

  const getEventTypeLabel = (type: CalendarEvent["type"]): string => {
    const labels: Record<string, Record<string, string>> = {
      evaluation: { pt: "Avaliação", es: "Evaluación" },
      pdi_task: { pt: "Tarefa PDI", es: "Tarea PDI" },
      birthday: { pt: "Aniversário", es: "Cumpleaños" },
      experience: { pt: "Período experiência", es: "Período experiencia" },
      goal: { pt: "Meta/KPI", es: "Meta/KPI" },
      content_due: { pt: "Conteúdo (prazo)", es: "Contenido (plazo)" },
      one_on_one: { pt: "1:1", es: "1:1" },
    };
    return labels[type]?.[language] ?? type;
  };

  const formatDayLabel = (day: Date): string => {
    const locale = language === "pt" ? ptBR : es;
    return format(day, "d MMMM", { locale });
  };

  const noEventsLabel =
    language === "pt" ? "Nenhum evento neste dia" : "Sin eventos en este día";
  const todayLabel = language === "pt" ? "Hoje" : "Hoy";
  const monthViewLabel = language === "pt" ? "Mês" : "Mes";
  const listViewLabel = language === "pt" ? "Lista" : "Lista";
  const calendarLabel = language === "pt" ? "Calendário" : "Calendario";

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{calendarLabel}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {calendarScope === "team"
              ? language === "pt"
                ? "Visão panorâmica de toda a equipe"
                : "Visión panorámica de todo el equipo"
              : language === "pt"
                ? "Seus eventos, metas e tarefas"
                : "Sus eventos, metas y tareas"}
          </p>
        </div>
        {canSeeTeam && (
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={calendarScope === "personal" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCalendarScope("personal")}
              className="flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              {language === "pt" ? "Meu" : "Mio"}
            </Button>
            <Button
              variant={calendarScope === "team" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCalendarScope("team")}
              className="flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              {language === "pt" ? "Equipe" : "Equipo"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Month navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[160px] text-center">
                {currentMonthName} {currentYear}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDay(new Date());
                }}
              >
                {todayLabel}
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                aria-label={monthViewLabel}
              >
                <Grid className="h-4 w-4 mr-1" />
                {monthViewLabel}
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                aria-label={listViewLabel}
              >
                <List className="h-4 w-4 mr-1" />
                {listViewLabel}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {viewMode === "month" ? (
            <>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 border-t border-l">
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDay
                    ? isSameDay(day, selectedDay)
                    : false;
                  const isDayToday = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() =>
                        setSelectedDay(
                          isSameDay(day, selectedDay ?? new Date(""))
                            ? null
                            : day,
                        )
                      }
                      className={cn(
                        "min-h-[80px] border-b border-r p-1 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset",
                        isCurrentMonth
                          ? "bg-background hover:bg-muted/50"
                          : "bg-muted/20",
                        isSelected && "ring-2 ring-primary ring-inset",
                      )}
                      aria-label={`${format(day, "dd/MM/yyyy")}${dayEvents.length > 0 ? `, ${dayEvents.length} eventos` : ""}`}
                    >
                      <div className="flex flex-col h-full gap-1">
                        {/* Day number */}
                        <span
                          className={cn(
                            "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                            isDayToday && "bg-primary text-primary-foreground",
                            !isCurrentMonth && "text-muted-foreground",
                            isCurrentMonth && !isDayToday && "text-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </span>

                        {/* Event dots / badges */}
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {dayEvents.slice(0, 3).map((ev, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                "flex items-center gap-1 rounded text-xs px-1 truncate",
                                colorBadgeClasses[ev.color],
                              )}
                              title={ev.title}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                  colorClasses[ev.color],
                                )}
                              />
                              <span className="truncate hidden sm:inline">
                                {ev.title}
                              </span>
                            </span>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-xs text-muted-foreground px-1">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* List view */
            <div className="space-y-2">
              {listEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {noEventsLabel}
                </p>
              ) : (
                listEvents.map((ev, idx) => {
                  const Icon = eventIcons[ev.type];
                  const evDate = new Date(ev.date + "T12:00:00");
                  const targetPath = NAVIGABLE_TYPES[ev.type] ?? null;
                  return (
                    <div
                      key={idx}
                      role={targetPath ? "button" : undefined}
                      tabIndex={targetPath ? 0 : undefined}
                      onClick={
                        targetPath ? () => navigate(targetPath) : undefined
                      }
                      onKeyDown={
                        targetPath
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ")
                                navigate(targetPath);
                            }
                          : undefined
                      }
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        colorBadgeClasses[ev.color],
                        targetPath &&
                          "cursor-pointer hover:opacity-80 transition-opacity",
                      )}
                    >
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ev.title}
                        </p>
                        <p className="text-xs opacity-75">{ev.assignee}</p>
                      </div>
                      <div className="text-xs font-medium flex-shrink-0">
                        {format(evDate, "dd/MM")}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs flex-shrink-0",
                          colorBadgeClasses[ev.color],
                        )}
                      >
                        {getEventTypeLabel(ev.type)}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected day events panel */}
      {viewMode === "month" && selectedDay && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {language === "pt" ? "Eventos em" : "Eventos en"}{" "}
              {formatDayLabel(selectedDay)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{noEventsLabel}</p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map((ev, idx) => {
                  const Icon = eventIcons[ev.type];
                  const targetPath = NAVIGABLE_TYPES[ev.type] ?? null;
                  return (
                    <div
                      key={idx}
                      role={targetPath ? "button" : undefined}
                      tabIndex={targetPath ? 0 : undefined}
                      onClick={
                        targetPath ? () => navigate(targetPath) : undefined
                      }
                      onKeyDown={
                        targetPath
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ")
                                navigate(targetPath);
                            }
                          : undefined
                      }
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        colorBadgeClasses[ev.color],
                        targetPath &&
                          "cursor-pointer hover:opacity-80 transition-opacity",
                      )}
                    >
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ev.title}</p>
                        <p className="text-xs opacity-75">{ev.assignee}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", colorBadgeClasses[ev.color])}
                      >
                        {getEventTypeLabel(ev.type)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            {[
              {
                label: language === "pt" ? "Avaliação" : "Evaluación",
                color: "blue",
                icon: Star,
              },
              {
                label: language === "pt" ? "Tarefa PDI" : "Tarea PDI",
                color: "green",
                icon: Clock,
              },
              {
                label: language === "pt" ? "PDI (atrasada)" : "PDI (atrasada)",
                color: "red",
                icon: Clock,
              },
              {
                label: language === "pt" ? "Meta/KPI" : "Meta/KPI",
                color: "teal",
                icon: Star,
              },
              {
                label: language === "pt" ? "Aniversário" : "Cumpleaños",
                color: "purple",
                icon: Gift,
              },
              {
                label:
                  language === "pt"
                    ? "Período experiência"
                    : "Período experiencia",
                color: "orange",
                icon: CalendarDays,
              },
              {
                label:
                  language === "pt" ? "Conteúdo (prazo)" : "Contenido (plazo)",
                color: "amber",
                icon: GraduationCap,
              },
              {
                label: "1:1",
                color: "indigo",
                icon: Users,
              },
            ].map(({ label, color, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    colorClasses[color],
                  )}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
