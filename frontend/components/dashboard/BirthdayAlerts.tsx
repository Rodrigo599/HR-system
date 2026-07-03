import React from 'react';
import { Cake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBirthdays } from '@/hooks/api/useDependents';

function daysUntilLabel(days: number) {
  if (days === 0) return 'Hoje!';
  if (days === 1) return 'Amanhã';
  return `Em ${days} dias`;
}

export function BirthdayAlerts() {
  const { data: birthdays = [], isLoading } = useBirthdays();

  if (isLoading || birthdays.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Cake className="h-5 w-5 text-muted-foreground" />
          Próximos aniversários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {birthdays.map((birthday, index) => (
          <div
            key={`${birthday.type}-${birthday.name}-${birthday.date}-${index}`}
            className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            <div className="min-w-0">
              <span className="font-medium truncate">{birthday.name}</span>
              {birthday.type === 'dependente' && birthday.relationship && birthday.of && (
                <span className="text-muted-foreground">
                  {' '}
                  ({birthday.relationship} de {birthday.of})
                </span>
              )}
            </div>
            <Badge variant={birthday.days_until === 0 ? 'default' : 'secondary'} className="text-xs shrink-0">
              {daysUntilLabel(birthday.days_until)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
