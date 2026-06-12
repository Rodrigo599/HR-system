import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { I18nText } from '@/types/smartforms';
import { i18nToLangs, makeI18n } from './helpers';
import type { Lang } from './types';

interface I18nInputProps {
  label: string;
  value: I18nText | undefined;
  onChange: (val: I18nText) => void;
  placeholder?: string;
  className?: string;
}

const TAB_ACTIVE_CLASS: Record<Lang, string> = {
  pt: 'data-[state=active]:bg-green-600 data-[state=active]:text-white',
  es: 'data-[state=active]:bg-yellow-500 data-[state=active]:text-white',
};

export function I18nInput({ label, value, onChange, placeholder, className = '' }: I18nInputProps) {
  const [activeTab, setActiveTab] = useState<Lang>('pt');
  const langs = i18nToLangs(value);

  const handleChange = (lang: Lang, text: string) => {
    const updated = { ...langs, [lang]: text };
    onChange(makeI18n(updated.pt, updated.es));
  };

  return (
    <div className={className}>
      {label && (
        <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      )}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Lang)} className="w-full">
        <TabsList className="h-7 mb-1.5 bg-muted/50 p-0.5 gap-0.5">
          {(['pt', 'es'] as Lang[]).map((lang) => (
            <TabsTrigger
              key={lang}
              value={lang}
              className={`h-6 px-2 text-xs font-medium rounded transition-colors ${TAB_ACTIVE_CLASS[lang]}`}
            >
              {lang.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Input
        type="text"
        value={langs[activeTab]}
        onChange={(e) => handleChange(activeTab, e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}
