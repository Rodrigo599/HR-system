import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquareHeart, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedbackReceived, useFeedbackSent, useCreateFeedback, useDeleteFeedback } from '@/hooks/api/useFeedback';
import { UserSelect } from '@/components/shared/UserSelect';
import {
  FEEDBACK_TYPES,
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_VISIBILITY_LABELS,
  type PointwiseFeedbackType,
  type FeedbackVisibility,
} from '@/lib/enums';

export default function Feedback() {
  const { user } = useAuth();
  const { toast } = useToast();

  const receivedQuery = useFeedbackReceived();
  const sentQuery = useFeedbackSent();
  const createMutation = useCreateFeedback();
  const deleteMutation = useDeleteFeedback();

  const received = receivedQuery.data ?? [];
  const sent = sentQuery.data ?? [];

  const [toUserId, setToUserId] = useState('');
  const [type, setType] = useState<PointwiseFeedbackType>('kudos');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<FeedbackVisibility>('with_manager');

  const handleSend = async () => {
    if (!toUserId) {
      toast({ title: 'Selecione o destinatário', variant: 'destructive' });
      return;
    }
    if (content.trim().length < 10) {
      toast({ title: 'Mensagem muito curta', description: 'O feedback precisa ter pelo menos 10 caracteres.', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({ to_user_id: toUserId, type, content: content.trim(), visibility });
      toast({ title: 'Feedback enviado' });
      setToUserId('');
      setContent('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const apiMsg = axiosErr?.response?.data?.message;
      const firstError = axiosErr?.response?.data?.errors ? Object.values(axiosErr.response.data.errors)[0]?.[0] : undefined;
      toast({ title: 'Erro ao enviar', description: firstError ?? apiMsg ?? 'Tente novamente.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <MessageSquareHeart className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Feedback</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Enviar feedback</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Para</Label>
            <UserSelect
              value={toUserId}
              onValueChange={setToUserId}
              placeholder="Selecione um colega"
              excludeId={user?.id}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={v => setType(v as PointwiseFeedbackType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FEEDBACK_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{FEEDBACK_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Escreva seu feedback..." rows={3} maxLength={500} />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={visibility === 'with_manager'}
              onCheckedChange={v => setVisibility(v ? 'with_manager' : 'private')}
            />
            <Label>{FEEDBACK_VISIBILITY_LABELS[visibility]}</Label>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Recebidos ({received.length})</h2>
        {received.length === 0 ? (
          <Card><CardContent><EmptyState icon={MessageSquareHeart} title="Nenhum feedback recebido" description="Feedbacks dos seus colegas aparecem aqui." /></CardContent></Card>
        ) : received.map(f => (
          <Card key={f.id}>
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{FEEDBACK_TYPE_LABELS[f.type as PointwiseFeedbackType] ?? f.type}</Badge>
              </div>
              <p className="text-sm">{f.content}</p>
              <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Enviados ({sent.length})</h2>
        {sent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum feedback enviado ainda.</p>
        ) : sent.map(f => (
          <Card key={f.id}>
            <CardContent className="pt-4 flex items-start justify-between">
              <div className="space-y-1">
                <Badge variant="secondary">{FEEDBACK_TYPE_LABELS[f.type as PointwiseFeedbackType] ?? f.type}</Badge>
                <p className="text-sm">{f.content}</p>
                <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(f.id)} disabled={deleteMutation.isPending}>
                Remover
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
