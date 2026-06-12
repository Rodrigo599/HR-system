import React, { useState } from "react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEvaluations } from "@/hooks/api/useEvaluations";
import { usePdis } from "@/hooks/api/usePdi";
import { useOneOnOnes } from "@/hooks/api/useOneOnOnes";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  type: 'evaluation' | 'pdi_task' | 'one_on_one';
  title: string;
  date: string;
  color: 'blue' | 'green' | 'purple';
}

const COLOR_CLASS: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const evaluationsQuery = useEvaluations();
  const pdisQuery = usePdis();
  const oneOnOnesQuery = useOneOnOnes();

  const events: CalendarEvent[] = [];

  (evaluationsQuery.data ?? []).forEach(e => {
    if (e.period) {
      events.push({ type: 'evaluation', title: `Avaliação: ${e.type}`, date: e.period + '-01', color: 'blue' });
    }
  });

  (pdisQuery.data ?? []).forEach(pdi => {
    (pdi.tasks ?? []).forEach(task => {
      if (task.due_date) {
        events.push({ type: 'pdi_task', title: task.title, date: task.due_date.split('T')[0], color: 'green' });
      }
    });
  });

  (oneOnOnesQuery.data ?? []).forEach(o => {
    events.push({ type: 'one_on_one', title: '1:1', date: o.scheduled_at.split('T')[0], color: 'purple' });
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(new Date(e.date + 'T12:00:00'), day));

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendário</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-36 text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[80px] p-1 border-r border-b',
                    !isCurrentMonth && 'bg-muted/30',
                    i % 7 === 6 && 'border-r-0',
                  )}
                >
                  <div className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                    isTodayDate && 'bg-primary text-primary-foreground',
                    !isCurrentMonth && 'text-muted-foreground',
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event, j) => (
                      <div key={j} className={cn('text-xs text-white rounded px-1 truncate', COLOR_CLASS[event.color])}>
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
