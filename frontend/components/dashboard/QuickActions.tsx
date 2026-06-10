import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface QuickActionsProps {
  pendingReviews: number;
  pendingEvaluations: number;
}

export function QuickActions({ pendingReviews, pendingEvaluations }: QuickActionsProps) {
  const navigate = useNavigate();

  const hasActions = pendingReviews > 0 || pendingEvaluations > 0;

  if (!hasActions) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Acoes rapidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {pendingReviews > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate('/pdi')}
            >
              <ClipboardCheck className="h-4 w-4" />
              Revisar tasks
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingReviews}
              </Badge>
            </Button>
          )}
          {pendingEvaluations > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate('/evaluations')}
            >
              <ClipboardList className="h-4 w-4" />
              Avaliações pendentes
              <Badge variant="secondary" className="ml-1 text-xs">
                {pendingEvaluations}
              </Badge>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
