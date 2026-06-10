import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
import { useCreateUser } from '@/hooks/api/useUsers';
import type { AppRole } from '@/types/api';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectors: Array<{ id: string; name: string }>;
  gestores: Array<{ id: string; full_name: string }>;
  onSuccess: () => void;
}

interface FormFields {
  email: string;
  fullName: string;
  sectorId: string;
  managerId: string;
  role: AppRole;
  preferredLanguage: 'pt' | 'es';
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

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.email) {
    errors.email = 'Email é obrigatório';
  } else if (!validateEmail(fields.email)) {
    errors.email = 'Formato de email inválido';
  }

  if (!fields.fullName) {
    errors.fullName = 'Nome completo é obrigatório';
  } else if (fields.fullName.trim().length < 3) {
    errors.fullName = 'Nome deve ter pelo menos 3 caracteres';
  }

  if (!fields.sectorId) {
    errors.sectorId = 'Setor é obrigatório';
  }

  if (!fields.password) {
    errors.password = 'Senha é obrigatória';
  } else if (fields.password.length < 8) {
    errors.password = 'Senha deve ter pelo menos 8 caracteres';
  }

  return errors;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  sectors,
  gestores,
  onSuccess,
}: CreateUserDialogProps) {
  const { toast } = useToast();
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

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        roles: [form.role],
        sector_id: form.sectorId || undefined,
        manager_id: form.managerId === '__none__' ? undefined : (form.managerId || undefined),
      });

      toast({ title: `Colaborador ${form.fullName.trim()} criado com sucesso` });
      setForm(INITIAL_FORM);
      setErrors({});
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar colaborador';
      toast({ variant: 'destructive', title: 'Erro ao criar colaborador', description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Colaborador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
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
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Nome do colaborador"
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
            <Label htmlFor="sectorId">Setor</Label>
            <Select
              value={form.sectorId}
              onValueChange={value => handleChange('sectorId', value)}
              disabled={loading}
            >
              <SelectTrigger
                id="sectorId"
                className={errors.sectorId ? 'border-destructive focus:ring-destructive' : ''}
              >
                <SelectValue placeholder="Selecionar setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map(sector => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sectorId && (
              <p className="text-xs text-destructive">{errors.sectorId}</p>
            )}
          </div>

          {/* Gestor direto */}
          <div className="space-y-1">
            <Label htmlFor="managerId">Gestor direto (opcional)</Label>
            <Select
              value={form.managerId}
              onValueChange={value => handleChange('managerId', value)}
              disabled={loading}
            >
              <SelectTrigger id="managerId">
                <SelectValue placeholder="Sem gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem gestor</SelectItem>
                {gestores.map(gestor => (
                  <SelectItem key={gestor.id} value={gestor.id}>
                    {gestor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <Label htmlFor="role">Perfil</Label>
            <Select
              value={form.role}
              onValueChange={value => handleChange('role', value as AppRole)}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colaborador">Colaborador</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Idioma */}
          <div className="space-y-1">
            <Label htmlFor="preferredLanguage">Idioma</Label>
            <Select
              value={form.preferredLanguage}
              onValueChange={value => handleChange('preferredLanguage', value as 'pt' | 'es')}
              disabled={loading}
            >
              <SelectTrigger id="preferredLanguage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Senha temporária */}
          <div className="space-y-1">
            <Label htmlFor="password">Senha temporária</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
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
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar colaborador'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
