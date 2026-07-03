import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const ROUTE_KEYS: Record<string, TranslationKey> = {
  '/evaluations': 'navEvaluations',
  '/kpis': 'navKpis',
  '/pdi': 'navPdi',
  '/calendar': 'navCalendar',
  '/history': 'navHistory',
  '/admin': 'navAdmin',
  '/smartforms': 'navSmartforms',
  '/feedback': 'navFeedback',
  '/clima': 'climaSurvey',
  '/one-on-ones': 'navOneOnOnes',
  '/content': 'navContent',
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  // Nao mostrar no dashboard (e a home)
  if (pathname === '/dashboard' || pathname === '/') return null;

  const basePath = '/' + pathname.split('/')[1];
  const key = ROUTE_KEYS[basePath];
  const label = key ? t(key) : basePath.replace('/', '');

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">{label}</span>
    </nav>
  );
}
