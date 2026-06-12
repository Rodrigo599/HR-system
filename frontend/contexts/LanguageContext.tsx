import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '@/i18n/translations';

type Params = Record<string, string | number>;

const LOCALE_MAP: Record<Language, string> = { pt: 'pt-BR', es: 'es-ES' };

interface LanguageContextType {
  language: Language;
  locale: string;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Params) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('preferred_language');
    return (stored === 'pt' || stored === 'es') ? stored : 'pt';
  });

  useEffect(() => {
    localStorage.setItem('preferred_language', language);
  }, [language]);

  const t = (key: TranslationKey, params?: Params): string => {
    let str: string = translations[language][key] || key;
    if (params) {
      str = str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    }
    return str;
  };

  const locale = LOCALE_MAP[language];

  return (
    <LanguageContext.Provider value={{ language, locale, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
