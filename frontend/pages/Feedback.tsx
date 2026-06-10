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
import { useFeedback, useCreateFeedback, useDeleteFeedback } from '@/hooks/api/useFeedback';
import { useUsers } from '@/hooks/api/useUsers';

export default function Feedback() {
  const { user } = useAuth();
  const { toast } = useToast();

  const feedbackQuery = useFeedback();
  const usersQuery = useUsers();
  const createMutation = useCreateFeedback();
  const deleteMutation = useDeleteFeedback();

  const feedbacks = feedbackQuery.data ?? [];
  const users = (usersQuery.data ?? []).filter(u => u.id !== user?.id);

  const [toUserId, setToUserId] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSend = async () => {
    if (!toUserId || !content.trim()) {
      toast({ title: 'Preencha destinatário e mensagem', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({ to_user_id: toUserId, content, is_anonymous: isAnonymous });
      toast({ title: 'Feedback enviado' });
      setToUserId('');
      setContent('');
    } catch {
      toast({ title: 'Erro ao enviar', variant: 'destructive' });
    }
  };

  const received = feedbacks.filter(f => f.to_user_id === user?.id);
  const sent = feedbacks.filter(f => f.from_user_id === user?.id);

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
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione um colega" /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Escreva seu feedback..." rows={3} maxLength={500} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label>Enviar anonimamente</Label>
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
            <CardContent className="pt-4">
              <p className="text-sm">{f.content}</p>
              <p className="text-xs text-muted-foreground mt-2">{f.is_anonymous ? 'Anônimo' : `De: ${f.from_user_id}`} · {new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
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
              <div>
                <p className="text-sm">{f.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{f.is_anonymous ? 'Anônimo' : ''} · {new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
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
