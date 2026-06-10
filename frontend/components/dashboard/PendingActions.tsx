import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface PendingActionsProps {
  pendingTaskReviews: number;
  pendingEvaluations: number;
  collaboratorsWithoutEval: number;
  overdueTasksCount: number;
}

interface ActionItem {
  count: number;
  label: string;
  icon: React.ReactNode;
  navigateTo: string;
  urgent: boolean;
  /** Prioridade numerica: 3=overdue(vermelho), 2=urgent(laranja), 1=normal */
  priority: number;
}

export function PendingActions({
  pendingTaskReviews,
  pendingEvaluations,
  collaboratorsWithoutEval,
  overdueTasksCount,
}: PendingActionsProps) {
  const navigate = useNavigate();

  const items: ActionItem[] = [
    {
      count: overdueTasksCount,
      label: 'tasks PDI com prazo vencido no seu time',
      icon: <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />,
      navigateTo: '/pdi',
      urgent: true,
      priority: 3,
    },
    {
      count: pendingTaskReviews,
      label: 'tasks PDI aguardando sua aprovação',
      icon: <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />,
      navigateTo: '/pdi',
      urgent: true,
      priority: 2,
    },
    {
      count: pendingEvaluations,
      label: 'avaliações para dar nota',
      icon: <Clock className="h-4 w-4 text-yellow-500 shrink-0" />,
      navigateTo: '/evaluations',
      urgent: false,
      priority: 1,
    },
    {
      count: collaboratorsWithoutEval,
      label: 'colaboradores sem avaliação este mês',
      icon: <Clock className="h-4 w-4 text-yellow-500 shrink-0" />,
      navigateTo: '/evaluations',
      urgent: false,
      priority: 1,
    },
  ]
    // Ordenacao por urgencia: overdue (vermelho) primeiro, urgent/laranja depois, normal por ultimo.
    // Itens com count=0 sao removidos.
    .filter((item) => item.count > 0)
    .sort((a, b) => b.priority - a.priority);

  const totalPending = pendingTaskReviews + pendingEvaluations + collaboratorsWithoutEval + overdueTasksCount;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Ações Pendentes</CardTitle>
          {totalPending > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalPending}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ação pendente. Tudo em dia!</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(item.navigateTo)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(item.navigateTo)}
              >
                {item.icon}
                <span className="flex-1 text-sm">
                  <span className="font-semibold">{item.count}</span> {item.label}
                </span>
                <Badge
                  variant="destructive"
                  className="text-xs min-w-[1.5rem] justify-center"
                >
                  {item.count}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
