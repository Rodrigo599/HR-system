import { pt } from './pt';
import { es } from './es';

export type Language = 'pt' | 'es';
export type TranslationKey = keyof typeof pt;

// Garante em tempo de compilação que ES tem todas as chaves de PT
es satisfies Record<TranslationKey, string>;

export const translations: Record<Language, Record<TranslationKey, string>> = { pt, es };
