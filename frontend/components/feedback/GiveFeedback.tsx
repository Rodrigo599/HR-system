import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FEEDBACK_TYPES, FEEDBACK_TYPE_LABELS, type PointwiseFeedbackType } from "@/lib/enums";
import {
  MessageSquarePlus,
  Star,
  MessageSquare,
  Eye,
  Loader2,
  Send,
} from "lucide-react";
import { useCreateFeedback } from "@/hooks/api/useFeedback";

const MAX_LEN = 500;

const TYPE_ICONS: Record<PointwiseFeedbackType, React.ComponentType<{ className?: string }>> = {
  kudos: Star,
  adjustment: MessageSquare,
  observation: Eye,
};

const TYPE_CLASSES: Record<PointwiseFeedbackType, string> = {
  kudos: "border-green-500 text-green-700 data-[on=true]:bg-green-500 data-[on=true]:text-white",
  adjustment: "border-amber-500 text-amber-700 data-[on=true]:bg-amber-500 data-[on=true]:text-white",
  observation: "border-blue-500 text-blue-700 data-[on=true]:bg-blue-500 data-[on=true]:text-white",
};

interface GiveFeedbackProps {
  toUserId: string;
  toUserName: string;
  onSuccess?: () => void;
  /** Se passar trigger custom, renderiza ao inves do botao default. */
  trigger?: React.ReactNode;
}

export function GiveFeedback({
  toUserId,
  toUserName,
  onSuccess,
  trigger,
}: GiveFeedbackProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createFeedback = useCreateFeedback();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PointwiseFeedbackType>("kudos");
  const [content, setContent] = useState("");
  const [withManager, setWithManager] = useState(true);

  const reset = () => {
    setType("kudos");
    setContent("");
    setWithManager(true);
  };

  const isSelf = user?.id === toUserId;
  const canSubmit =
    !!user?.id &&
    !isSelf &&
    content.trim().length > 0 &&
    content.length <= MAX_LEN &&
    !createFeedback.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createFeedback.mutate(
      { to_user_id: toUserId, type, content: content.trim(), visibility: withManager ? 'with_manager' : 'private' },
      {
        onSuccess: () => {
          toast({ title: "Feedback enviado", description: `Para ${toUserName}.` });
          reset();
          setOpen(false);
          onSuccess?.();
        },
        onError: (err) =>
          toast({ title: "Erro ao enviar", description: String(err), variant: "destructive" }),
      },
    );
  };

  const defaultTrigger = (
    <Button size="sm" variant="outline" disabled={isSelf}>
      <MessageSquarePlus className="h-4 w-4 mr-2" />
      Dar feedback
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback para {toUserName}</DialogTitle>
          <DialogDescription>
            Deixe um sinal pontual fora do ciclo formal. Voce escolhe se o
            gestor enxerga.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {FEEDBACK_TYPES.map((value) => {
                const Icon = TYPE_ICONS[value];
                const on = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    data-on={on}
                    onClick={() => setType(value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-md border-2 text-xs font-medium transition-colors",
                      TYPE_CLASSES[value],
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {FEEDBACK_TYPE_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteudo */}
          <div className="space-y-2">
            <Label htmlFor="pf-content">Mensagem</Label>
            <Textarea
              id="pf-content"
              placeholder="Conte o que aconteceu..."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              rows={4}
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/{MAX_LEN}
            </div>
          </div>

          {/* Visibilidade */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">
                {withManager ? "Eu + gestor" : "Apenas eu e " + toUserName}
              </p>
              <p className="text-xs text-muted-foreground">
                {withManager
                  ? "Gestor do destinatario tambem ve."
                  : "So voces dois enxergam."}
              </p>
            </div>
            <Switch
              checked={withManager}
              onCheckedChange={setWithManager}
              aria-label="Compartilhar com gestor"
            />
          </div>

          {isSelf && (
            <p className="text-sm text-destructive">
              Voce nao pode dar feedback pra si mesmo.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={createFeedback.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createFeedback.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
