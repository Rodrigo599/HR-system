import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/evaluations': 'Avaliações',
  '/kpis': 'KPIs',
  '/pdi': 'PDI',
  '/calendar': 'Calendário',
  '/history': 'Histórico',
  '/admin': 'Administração',
  '/smartforms': 'Formulários',
};

export function Breadcrumbs() {
  const { pathname } = useLocation();

  // Nao mostrar no dashboard (e a home)
  if (pathname === '/dashboard' || pathname === '/') return null;

  const basePath = '/' + pathname.split('/')[1];
  const label = ROUTE_LABELS[basePath] || basePath.replace('/', '');

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
