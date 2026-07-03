import { useState } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Smile, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { SmartFormRenderer } from '@/components/smartforms/SmartFormRenderer';
import { useSmartForms, useSubmitSmartFormResponse, useSmartFormAggregate } from '@/hooks/api/useSmartForms';
import type { SmartForm } from '@/types/api';
import type { I18nText } from '@/types/smartforms';

function resolveLabel(text: I18nText | undefined, lang: string): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return (text as Record<string, string>)[lang] || text.pt || text.es || '';
}

// Percorre o config do form pra achar o rotulo amigavel do campo (fallback = a propria chave).
function resolveFieldLabel(form: SmartForm, key: string, language: string): string {
  for (const step of form.config.steps) {
    for (const field of step.fields) {
      if (field.name === key) {
        return resolveLabel(field.label, language) || key;
      }
    }
  }
  return key;
}

interface AggregateResult {
  total_responses: number;
  averages: Record<string, number>;
  insufficient?: boolean;
  min_required?: number;
}

function ClimaResponseForm({ form }: { form: SmartForm }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const submitMutation = useSubmitSmartFormResponse(form.id);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-medium">Resposta enviada. Obrigado!</p>
          <p className="text-xs text-muted-foreground">
            Sua resposta é anônima — só o resultado agregado do time fica visível para o gestor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{form.name}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs">
            <EyeOff className="h-3 w-3" /> Resposta anônima — seu gestor vê apenas a média do time.
          </CardDescription>
        </CardHeader>
      </Card>
      <SmartFormRenderer
        config={form.config}
        onSubmit={(values) => {
          submitMutation.mutate(values, {
            onSuccess: () => {
              toast({ title: t('success'), description: 'Resposta enviada. Obrigado pelo seu feedback!' });
              setSubmitted(true);
            },
            onError: (err) => {
              toast({
                title: t('error'),
                description: err instanceof Error ? err.message : 'Erro ao enviar resposta.',
                variant: 'destructive',
              });
            },
          });
        }}
      />
    </div>
  );
}

function ClimaAggregateCard({ form }: { form: SmartForm }) {
  const { language } = useLanguage();
  const { data, isLoading } = useSmartFormAggregate(form.id);
  const aggregate = data as AggregateResult | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{form.name}</CardTitle>
        {aggregate && !isLoading && (
          <CardDescription>
            {aggregate.total_responses} resposta{aggregate.total_responses === 1 ? '' : 's'}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !aggregate ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o resultado.</p>
        ) : aggregate.insufficient ? (
          <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-4">
            <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                Respostas insuficientes para exibir resultado anônimo (mínimo {aggregate.min_required ?? 3})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Hoje: {aggregate.total_responses} resposta{aggregate.total_responses === 1 ? '' : 's'}. Assim que o
                mínimo for atingido, a média aparece aqui.
              </p>
            </div>
          </div>
        ) : Object.keys(aggregate.averages).length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há respostas para este formulário.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(aggregate.averages).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <span className="text-muted-foreground">{resolveFieldLabel(form, key, language)}</span>
                <Badge variant="secondary" className="font-semibold">{value.toFixed(2)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Clima() {
  const { isAdmin, isGestor } = useAuth();
  const { viewMode } = useViewMode();
  const { t } = useLanguage();

  const formsQuery = useSmartForms({ category: 'feedback' });
  const forms: SmartForm[] = (formsQuery.data ?? []).filter((f) => f.status === 'active');

  // Toggle "Visao Colaborador" tem prioridade, igual ao Dashboard — mesmo admin/gestor
  // que ativou visao pessoal responde a pesquisa como colaborador.
  const showManagerView = viewMode !== 'personal' && (isAdmin || isGestor);

  if (formsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <Smile className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t('climaSurvey')}</h1>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Smile}
              title="Nenhuma pesquisa de clima ativa"
              description="Quando o RH publicar uma pesquisa, ela aparece aqui."
            />
          </CardContent>
        </Card>
      ) : showManagerView ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Resultado agregado e anônimo do time. Respostas individuais nunca são exibidas.
          </p>
          {forms.map((form) => (
            <ClimaAggregateCard key={form.id} form={form} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <ClimaResponseForm key={form.id} form={form} />
          ))}
        </div>
      )}
    </div>
  );
}
