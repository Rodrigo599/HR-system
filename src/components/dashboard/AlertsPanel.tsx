import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Target, BookOpen } from 'lucide-react';
import { Alert as AlertType } from '@/hooks/useAlerts';
import { useLanguage } from '@/contexts/LanguageContext';

interface AlertsPanelProps {
  alerts: AlertType[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const { t } = useLanguage();

  const getIcon = (alert: AlertType) => {
    return alert.type === 'kpi_low'
      ? <Target className="h-4 w-4" />
      : <BookOpen className="h-4 w-4" />;
  };

  const getSeverityVariant = (severity: string) => {
    return severity === 'error' ? 'destructive' as const : 'default' as const;
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('alerts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('noData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t('alerts')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Alert key={alert.id} variant={getSeverityVariant(alert.severity)}>
            <div className="flex items-center gap-2">
              {alert.severity === 'error' ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {getIcon(alert)}
            </div>
            <AlertTitle className="text-sm">{alert.title}</AlertTitle>
            <AlertDescription className="text-xs">{alert.description}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
