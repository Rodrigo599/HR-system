import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { FEEDBACK_TYPES, getFeedbackTypeLabels, type PointwiseFeedbackType } from "@/lib/enums";
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
const MIN_LEN = 10;

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
  trigger?: React.ReactNode;
}

export function GiveFeedback({
  toUserId,
  toUserName,
  onSuccess,
  trigger,
}: GiveFeedbackProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const feedbackTypeLabels = getFeedbackTypeLabels(t);
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
    content.trim().length >= MIN_LEN &&
    content.length <= MAX_LEN &&
    !createFeedback.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createFeedback.mutate(
      { to_user_id: toUserId, type, content: content.trim(), visibility: withManager ? 'with_manager' : 'private' },
      {
        onSuccess: () => {
          toast({ title: t('feedbackSent'), description: `${t('feedbackSentTo')} ${toUserName}.` });
          reset();
          setOpen(false);
          onSuccess?.();
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
          const apiMsg = axiosErr?.response?.data?.message;
          const firstError = axiosErr?.response?.data?.errors ? Object.values(axiosErr.response.data.errors)[0]?.[0] : undefined;
          toast({ title: t('feedbackErrorSend'), description: firstError ?? apiMsg ?? t('feedbackTryAgain'), variant: "destructive" });
        },
      },
    );
  };

  const defaultTrigger = (
    <Button size="sm" variant="outline" disabled={isSelf}>
      <MessageSquarePlus className="h-4 w-4 mr-2" />
      {t('giveFeedback')}
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
          <DialogTitle>{t('feedbackTo')} {toUserName}</DialogTitle>
          <DialogDescription>{t('feedbackDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('feedbackLabelType')}</Label>
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
                    {feedbackTypeLabels[value]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pf-content">{t('feedbackLabelMessage')}</Label>
            <Textarea
              id="pf-content"
              placeholder={t('feedbackPlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              rows={4}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {content.trim().length < MIN_LEN && content.length > 0 && (
                <span className="text-destructive">{t('feedbackMinChars', { min: MIN_LEN })}</span>
              )}
              <span className="ml-auto">{content.length}/{MAX_LEN}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">
                {withManager ? t('feedbackVisibilityWithManager') : `${t('feedbackVisibilityPrivate')} ${toUserName}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {withManager ? t('feedbackVisibilityWithManagerDesc') : t('feedbackVisibilityPrivateDesc')}
              </p>
            </div>
            <Switch
              checked={withManager}
              onCheckedChange={setWithManager}
              aria-label={t('feedbackShareWithManager')}
            />
          </div>

          {isSelf && (
            <p className="text-sm text-destructive">{t('feedbackSelfError')}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={createFeedback.isPending}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createFeedback.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {t('feedbackSendButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
