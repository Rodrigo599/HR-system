import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Globe, Menu, Users, UserCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/contexts/ViewModeContext';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Header({ sidebarCollapsed, onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const profile = user?.profile;
  const roles = user?.roles ?? [];
  const { t, language, setLanguage } = useLanguage();
  const { viewMode, setViewMode, showToggle } = useViewMode();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: t('adminRole'),
      gestor: t('gestorRole'),
      colaborador: t('colaboradorRole'),
      analista: t('analistaRole'),
    };
    return labels[role] || role;
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {showToggle && (
        <div
          className="flex items-center gap-1 bg-muted rounded-lg p-1"
          role="group"
          aria-label="Alternar entre visao gestor e visao colaborador"
        >
          <Button
            variant={viewMode === 'team' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => setViewMode('team')}
            aria-pressed={viewMode === 'team'}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Visao Gestor</span>
          </Button>
          <Button
            variant={viewMode === 'personal' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => setViewMode('personal')}
            aria-pressed={viewMode === 'personal'}
          >
            <UserCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Visao Colaborador</span>
          </Button>
        </div>
      )}

      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="focus-visible:outline-none">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('pt')} className="flex items-center justify-between gap-4">
              {t('portuguese')}
              {language === 'pt' && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('es')} className="flex items-center justify-between gap-4">
              {t('spanish')}
              {language === 'es' && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {profile ? getInitials(profile.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{profile?.full_name}</span>
                <div className="flex gap-1">
                  {roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">{getRoleLabel(role)}</Badge>
                  ))}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4" />
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
