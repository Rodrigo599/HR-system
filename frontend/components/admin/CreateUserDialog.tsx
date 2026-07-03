import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateUser } from '@/hooks/api/useUsers';
import { UserSelect } from '@/components/shared/UserSelect';
import { SectorSelect } from '@/components/shared/SectorSelect';
import type { AppRole } from '@/types/api';
import type { Language } from '@/i18n/translations';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormFields {
  email: string;
  fullName: string;
  sectorId: string;
  managerId: string;
  role: AppRole;
  preferredLanguage: Language;
  password: string;
}

interface FormErrors {
  email?: string;
  fullName?: string;
  sectorId?: string;
  password?: string;
}

const INITIAL_FORM: FormFields = {
  email: '',
  fullName: '',
  sectorId: '',
  managerId: '__none__',
  role: 'colaborador',
  preferredLanguage: 'pt',
  password: '',
};


export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const createUserMutation = useCreateUser();
  const [form, setForm] = useState<FormFields>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const loading = createUserMutation.isPending;

  function handleChange(field: keyof FormFields, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  function handleClose(open: boolean) {
    if (!loading) {
      setForm(INITIAL_FORM);
      setErrors({});
      onOpenChange(open);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors: FormErrors = {};
    if (!form.email) {
      validationErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      validationErrors.email = t('emailInvalid');
    }
    if (!form.fullName) {
      validationErrors.fullName = t('nameRequired');
    } else if (form.fullName.trim().length < 3) {
      validationErrors.fullName = t('fullNameMin');
    }
    if (!form.sectorId) {
      validationErrors.sectorId = t('sectorRequired');
    }
    if (!form.password) {
      validationErrors.password = t('passwordRequired');
    } else if (form.password.length < 8) {
      validationErrors.password = t('passwordMin8');
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        sector_id: form.sectorId || undefined,
        manager_id: form.managerId === '__none__' ? undefined : (form.managerId || undefined),
      });

      toast({ title: t('collaboratorCreatedMsg', { name: form.fullName.trim() }) });
      setForm(INITIAL_FORM);
      setErrors({});
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errorCreateCollaborator');
      toast({ variant: 'destructive', title: t('errorCreateCollaborator'), description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newCollaborator')}</DialogTitle>
          <DialogDescription>{t('newCollaboratorDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Nome completo */}
          <div className="space-y-1">
            <Label htmlFor="fullName">{t('fullName')}</Label>
            <Input
              id="fullName"
              type="text"
              placeholder={t('fullNamePlaceholder')}
              value={form.fullName}
              onChange={e => handleChange('fullName', e.target.value)}
              className={errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={loading}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Setor */}
          <div className="space-y-1">
            <Label htmlFor="sectorId">{t('sector')}</Label>
            <SectorSelect
              id="sectorId"
              value={form.sectorId}
              onValueChange={value => handleChange('sectorId', value)}
              placeholder={t('selectSector')}
              disabled={loading}
              className={errors.sectorId ? 'border-destructive focus:ring-destructive' : ''}
            />
            {errors.sectorId && (
              <p className="text-xs text-destructive">{errors.sectorId}</p>
            )}
          </div>

          {/* Gestor direto */}
          <div className="space-y-1">
            <Label htmlFor="managerId">{t('managerOptional')}</Label>
            <UserSelect
              id="managerId"
              value={form.managerId}
              onValueChange={value => handleChange('managerId', value)}
              roles={['gestor', 'admin']}
              noneOption={{ value: '__none__', label: t('noManager2') }}
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div className="space-y-1">
            <Label htmlFor="role">{t('role')}</Label>
            <Select
              value={form.role}
              onValueChange={value => handleChange('role', value as AppRole)}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colaborador">{t('colaboradorRole')}</SelectItem>
                <SelectItem value="gestor">{t('gestorRole')}</SelectItem>
                <SelectItem value="admin">{t('adminRoleLabel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Idioma */}
          <div className="space-y-1">
            <Label htmlFor="preferredLanguage">{t('language')}</Label>
            <Select
              value={form.preferredLanguage}
              onValueChange={value => handleChange('preferredLanguage', value as Language)}
              disabled={loading}
            >
              <SelectTrigger id="preferredLanguage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">{t('portuguese')}</SelectItem>
                <SelectItem value="es">{t('spanish')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Senha temporária */}
          <div className="space-y-1">
            <Label htmlFor="password">{t('temporaryPassword')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('createCollaboratorBtn')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
