import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SmartFormConfig } from '@/types/smartforms';
import { I18nInput } from './I18nInput';

interface SettingsCardProps {
  config: SmartFormConfig;
  onChange: (config: SmartFormConfig) => void;
}

export function SettingsCard({ config, onChange }: SettingsCardProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex-row items-center gap-2 bg-muted/30 rounded-t-lg space-y-0">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">{t('builderGeneralSettings')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('builderButtonTexts')}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsExpanded((v) => !v)}
          aria-label={isExpanded ? t('builderCollapseSettings') : t('builderExpandSettings')}
        >
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-3 space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {t('builderButtonTextsSection')}
          </p>
          <div className="space-y-3">
            <I18nInput
              label={t('builderSubmitLabel')}
              value={config.submit}
              onChange={(val) => onChange({ ...config, submit: val })}
              placeholder={t('submit')}
            />
            <div className="grid grid-cols-2 gap-3">
              <I18nInput
                label={t('builderNextLabel')}
                value={config.next}
                onChange={(val) => onChange({ ...config, next: val })}
                placeholder={t('next')}
              />
              <I18nInput
                label={t('builderBackLabel')}
                value={config.back}
                onChange={(val) => onChange({ ...config, back: val })}
                placeholder={t('back')}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
