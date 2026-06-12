import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '@/i18n/translations';

type Params = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
