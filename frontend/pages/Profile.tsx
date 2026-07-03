import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { useMutationHandler } from '@/hooks/useMutation';
import { useDependents, useCreateDependent, useDeleteDependent } from '@/hooks/api/useDependents';
import { useUpdateProfile } from '@/hooks/api/useUsers';
import { Mail, Globe, Shield, Building2, Cake, Plus, Trash2, Loader2, Users } from 'lucide-react';
import type { Dependent } from '@/types/api';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function relationshipLabel(value: string) {
  const map: Record<string, string> = {
    filho: 'Filho(a)',
    conjuge: 'Cônjuge',
    outro: 'Outro',
  };
  return map[value] ?? value;
}

const INITIAL_DEPENDENT_FORM = { name: '', relationship: 'filho', birth_date: '' };

export default function Profile() {
  // O contexto de auth expõe `user`; perfil e papéis vivem dentro dele.
  const { user } = useAuth();
  const profile = user?.profile;
  const roles = user?.roles ?? [];
  const { t, locale } = useLanguage();
  const { run } = useMutationHandler();

  const dependentsQuery = useDependents();
  const createDependentMutation = useCreateDependent();
  const deleteDependentMutation = useDeleteDependent();
  const updateProfileMutation = useUpdateProfile();

  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_DEPENDENT_FORM);
  const [formError, setFormError] = useState('');
  const [dependentToDelete, setDependentToDelete] = useState<Dependent | null>(null);

  useEffect(() => {
    setBirthDate(profile?.birth_date ?? '');
  }, [profile?.birth_date]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t('noData')}</p>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: t('adminRole'),
      gestor: t('gestorRole'),
      colaborador: t('colaboradorRole'),
      analista: t('analistaRole'),
    };
    return labels[role] || role;
  };

  const languageLabel = profile.preferred_language === 'pt' ? t('portuguese') : t('spanish');
  const dependents: Dependent[] = dependentsQuery.data ?? [];

  const handleSaveBirthDate = async () => {
    await run(updateProfileMutation.mutateAsync({ birth_date: birthDate }), {
      successMsg: t('itemUpdated'),
    });
  };

  const handleAddDependent = async () => {
    if (!form.name.trim()) {
      setFormError('Nome é obrigatório');
      return;
    }
    if (!form.birth_date) {
      setFormError('Data de nascimento é obrigatória');
      return;
    }
    setFormError('');
    await run(
      createDependentMutation.mutateAsync({
        name: form.name.trim(),
        relationship: form.relationship,
        birth_date: form.birth_date,
      }),
      {
        successMsg: 'Dependente adicionado com sucesso',
        onSuccess: () => {
          setForm(INITIAL_DEPENDENT_FORM);
          setAddOpen(false);
        },
      },
    );
  };

  const handleConfirmDelete = async () => {
    if (!dependentToDelete) return;
    await run(deleteDependentMutation.mutateAsync(dependentToDelete.id), {
      successMsg: 'Dependente removido com sucesso',
      onSuccess: () => setDependentToDelete(null),
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('profile')}</h1>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{profile.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{profile.email}</span>
          </div>

          {profile.sector && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Setor:</span>
              <span className="font-medium">{profile.sector.name}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{t('preferredLanguage')}:</span>
            <span className="font-medium">{languageLabel}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Cake className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">{t('birthDate')}:</span>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="h-8 w-40 text-sm"
            />
            {birthDate !== (profile.birth_date ?? '') && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 shrink-0"
                onClick={handleSaveBirthDate}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('save')
                )}
              </Button>
            )}
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">Perfis:</span>
            <div className="flex flex-wrap gap-1">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {getRoleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">{t('dependents')}</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar dependente
          </Button>
        </CardHeader>
        <CardContent>
          {dependentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : dependents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum dependente cadastrado"
              description="Adicione filhos, cônjuge ou outros dependentes para acompanhar aniversários e benefícios."
              ctaLabel="Adicionar dependente"
              onCtaClick={() => setAddOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{dep.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {relationshipLabel(dep.relationship)} ·{' '}
                      {new Date(`${dep.birth_date}T00:00:00`).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDependentToDelete(dep)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={(open) => { if (!createDependentMutation.isPending) { setAddOpen(open); if (!open) { setForm(INITIAL_DEPENDENT_FORM); setFormError(''); } } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar dependente</DialogTitle>
            <DialogDescription>
              Cadastre um dependente para acompanhar aniversários e benefícios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do dependente"
                disabled={createDependentMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('relationship')}</Label>
              <Select
                value={form.relationship}
                onValueChange={(value) => setForm((f) => ({ ...f, relationship: value }))}
                disabled={createDependentMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filho">Filho(a)</SelectItem>
                  <SelectItem value="conjuge">Cônjuge</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('birthDate')}</Label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                disabled={createDependentMutation.isPending}
              />
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={createDependentMutation.isPending}
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleAddDependent} disabled={createDependentMutation.isPending}>
                {createDependentMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!dependentToDelete} onOpenChange={(open) => !open && setDependentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover dependente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {dependentToDelete?.name}? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDependentMutation.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteDependentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDependentMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
