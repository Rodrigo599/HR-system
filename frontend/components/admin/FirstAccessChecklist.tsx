import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FirstAccessChecklistProps {
  sectorsCount: number;
  usersCount: number;
  formsCount: number;
  evaluationsCount: number;
}

interface ChecklistItem {
  label: string;
  done: boolean;
  navigateTo: string;
  tip: string;
}

export function FirstAccessChecklist({
  sectorsCount,
  usersCount,
  formsCount,
  evaluationsCount,
}: FirstAccessChecklistProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const items: ChecklistItem[] = [
    {
      label: t('checklistCreateSectors'),
      done: sectorsCount > 0,
      navigateTo: '/admin',
      tip: t('checklistCreateSectorsTip'),
    },
    {
      label: t('checklistRegisterUsers'),
      done: usersCount > 0,
      navigateTo: '/admin',
      tip: t('checklistRegisterUsersTip'),
    },
    {
      label: t('checklistCreateForm'),
      done: formsCount > 0,
      navigateTo: '/smartforms',
      tip: t('checklistCreateFormTip'),
    },
    {
      label: t('checklistStartEvaluation'),
      done: evaluationsCount > 0,
      navigateTo: '/evaluations',
      tip: t('checklistStartEvaluationTip'),
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  if (allDone) return null;

  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{t('initialSetup')}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {t('checklistSteps', { done: completedCount, total: items.length })}
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                item.done
                  ? 'opacity-50'
                  : 'cursor-pointer hover:bg-accent'
              }`}
              onClick={() => !item.done && navigate(item.navigateTo)}
              role={item.done ? undefined : 'button'}
              tabIndex={item.done ? undefined : 0}
              onKeyDown={(e) => !item.done && e.key === 'Enter' && navigate(item.navigateTo)}
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div>
                <span className={item.done ? 'line-through text-muted-foreground' : 'font-medium'}>
                  {item.label}
                </span>
                {!item.done && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.tip}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
