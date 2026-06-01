import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, FileText, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_MODE } from '@/lib/demoMode';
import { SmartFormRenderer } from '@/components/smartforms/SmartFormRenderer';
import SmartFormBuilder from '@/components/smartforms/SmartFormBuilder';
import {
  useSmartForms,
  useCreateForm,
  useDeleteForm,
  useToggleFormStatus,
  useUpdateForm,
  useSubmitFormResponse,
} from '@/hooks/useSmartForms';
import type { SmartForm } from '@/hooks/useSmartForms';
import { useSectors } from '@/services/adminService';

// ======== Types ========
type ViewMode = 'list' | 'preview' | 'edit';
type FormStatus = SmartForm['status'];
type FormCategory = SmartForm['category'];

const STATUS_LABELS: Record<FormStatus, string> = {
  active: 'Ativo',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

const STATUS_VARIANTS: Record<FormStatus, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  draft: 'secondary',
  archived: 'outline',
};

const STATUS_CLASS: Record<FormStatus, string> = {
  active: 'bg-green-600 text-white hover:bg-green-700',
  draft: '',
  archived: '',
};

const CATEGORY_LABELS: Record<FormCategory, string> = {
  evaluation: 'Avaliação',
  onboarding: 'Onboarding',
  survey: 'Pesquisa',
  feedback: 'Feedback',
  custom: 'Personalizado',
};

// Categories a gestor (without admin) is allowed to manage. Admin sees everything.
const GESTOR_CATEGORIES: FormCategory[] = ['feedback', 'survey'];

// ======== Component ========
export default function SmartForms() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  // --- Hooks Supabase ---
  const { forms: allForms, isLoading } = useSmartForms();
  // A gestor only sees feedback/survey forms. An admin sees all forms.
  const forms = isAdmin ? allForms : allForms.filter(f => GESTOR_CATEGORIES.includes(f.category));
  const createForm = useCreateForm();
  const deleteForm = useDeleteForm();
  const toggleStatus = useToggleFormStatus();
  const updateForm = useUpdateForm();
  const submitResponse = useSubmitFormResponse();
  const sectorsQuery = useSectors();
  const sectors = sectorsQuery.data ?? [];

  // Sentinel pra "todos os setores" no Select (Radix nao aceita value="").
  const ALL_SECTORS = '__all__';

  // --- UI state ---
  const [view, setView] = useState<ViewMode>('list');
  const [selectedForm, setSelectedForm] = useState<SmartForm | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  // Default category: admin can pick anything (custom default), gestor is forced to feedback.
  const [newCategory, setNewCategory] = useState<FormCategory>(isAdmin ? 'custom' : 'feedback');
  // Setor opcional — null = formulario universal (vale pra todos os setores).
  const [newSectorId, setNewSectorId] = useState<string | null>(null);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ====== Handlers ======

  const handleCreate = () => {
    if (!newName.trim()) return;

    createForm.mutate(
      {
        name: newName,
        slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-'),
        category: newCategory,
        sector_id: newSectorId,
        config: {
          steps: [{ title: { pt: 'Passo 1' }, fields: [] }],
          submit: { pt: 'Enviar', es: 'Enviar' },
        },
      },
      {
        onSuccess: () => {
          toast({ title: DEMO_MODE ? t('formDemoSaved') : t('formSaved') });
          setNewName('');
          setNewSlug('');
          setNewCategory('custom');
          setNewSectorId(null);
          setCreateOpen(false);
        },
        onError: () => {
          toast({ title: t('formSaveError'), variant: 'destructive' });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteForm.mutate(id, {
      onSuccess: () => {
        toast({ title: t('formDeleted') });
        setDeleteTarget(null);
      },
      onError: () => {
        toast({ title: t('formDeleteError'), variant: 'destructive' });
        setDeleteTarget(null);
      },
    });
  };

  const handleToggleStatus = (form: SmartForm) => {
    toggleStatus.mutate(
      { id: form.id, currentStatus: form.status },
      {
        onSuccess: () => {
          if (DEMO_MODE) {
            toast({ title: t('demoModeMessage') });
          }
        },
        onError: () => {
          toast({ title: t('formSaveError'), variant: 'destructive' });
        },
      }
    );
  };

  const openPreview = (form: SmartForm) => {
    setSelectedForm(form);
    setView('preview');
  };

  const openEdit = (form: SmartForm) => {
    setSelectedForm(form);
    setView('edit');
  };

  const handlePreviewSubmit = (responses: Record<string, unknown>) => {
    if (!selectedForm) return;
    submitResponse.mutate(
      { formId: selectedForm.id, data: responses },
      {
        onSuccess: () => toast({ title: t('formSubmitted') }),
        onError: () => toast({ title: t('formSaveError'), variant: 'destructive' }),
      }
    );
  };

  // ====== Render: Preview ======
  if (view === 'preview' && selectedForm) {
    return (
      <div className="space-y-4">
        <Breadcrumbs />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{selectedForm.name}</h1>
            <p className="text-sm text-muted-foreground">Pré-visualizar formulário</p>
          </div>
        </div>
        <SmartFormRenderer
          config={selectedForm.config}
          onSubmit={handlePreviewSubmit}
        />
      </div>
    );
  }

  // ====== Render: Edit ======
  if (view === 'edit' && selectedForm) {
    return (
      <div className="space-y-4">
        <Breadcrumbs />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{selectedForm.name}</h1>
            <p className="text-sm text-muted-foreground">Editar formulário</p>
          </div>
          {updateForm.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Metadados editaveis (setor) — admin pode realocar form a outro setor */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={selectedForm.sector_id ?? ALL_SECTORS}
                onValueChange={(v) => {
                  const nextSectorId = v === ALL_SECTORS ? null : v;
                  updateForm.mutate(
                    { id: selectedForm.id, sector_id: nextSectorId },
                    {
                      onError: () => toast({ title: t('formSaveError'), variant: 'destructive' }),
                    },
                  );
                  setSelectedForm((prev) => (prev ? { ...prev, sector_id: nextSectorId } : prev));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SECTORS}>Todos os setores</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Setor especifico = só aparece pra avaliacoes desse setor. "Todos os setores" = formulario universal.
              </p>
            </div>
          </div>
        </Card>

        <SmartFormBuilder
          config={selectedForm.config}
          onChange={(newConfig) => {
            updateForm.mutate(
              { id: selectedForm.id, config: newConfig },
              {
                onError: () => {
                  toast({ title: t('formSaveError'), variant: 'destructive' });
                },
              }
            );
            // Atualiza selectedForm localmente para manter o builder em sincronia
            setSelectedForm((prev) => prev ? { ...prev, config: newConfig } : prev);
          }}
        />
      </div>
    );
  }

  // ====== Render: List ======
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('smartforms')}</h1>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('createForm')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createForm')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {t('formName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  placeholder="Ex: Avaliação Mensal"
                />
                <p className="text-xs text-muted-foreground">* Campo obrigatorio</p>
              </div>
              <div className="space-y-2">
                <Label>{t('formSlug')}</Label>
                <Input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="avaliacao-mensal"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('formCategory')}</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as FormCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && <SelectItem value="evaluation">{t('evaluation')}</SelectItem>}
                    {isAdmin && <SelectItem value="onboarding">{t('onboarding')}</SelectItem>}
                    <SelectItem value="survey">{t('survey')}</SelectItem>
                    <SelectItem value="feedback">{t('feedback')}</SelectItem>
                    {isAdmin && <SelectItem value="custom">{t('custom')}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select
                  value={newSectorId ?? ALL_SECTORS}
                  onValueChange={(v) => setNewSectorId(v === ALL_SECTORS ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os setores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SECTORS}>Todos os setores</SelectItem>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Quando um setor é escolhido, este formulario só aparece pra avaliacoes de colaboradores desse setor.
                </p>
              </div>
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={!newName.trim() || createForm.isPending}
              >
                {createForm.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('save')
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Mobile: cards */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
          {forms.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum formulário criado"
              description="Monte seu primeiro formulário com o construtor visual"
              ctaLabel="Criar formulário"
              onCtaClick={() => setCreateOpen(true)}
            />
          ) : (
            forms.map((form) => (
              <Card key={form.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium truncate max-w-[160px]">{form.name}</span>
                  <Badge variant={STATUS_VARIANTS[form.status]} className={STATUS_CLASS[form.status]}>{STATUS_LABELS[form.status]}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[form.category]}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {form.sector_id
                      ? sectors.find((s) => s.id === form.sector_id)?.name ?? '—'
                      : 'Todos os setores'}
                  </Badge>
                  <span className="font-mono text-xs truncate">{form.slug}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openPreview(form)} title={t('formPreview')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(form)} title="Editar formulário" disabled={updateForm.isPending}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleStatus(form)}
                    title={form.status === 'active' ? 'Desativar' : 'Ativar'}
                    disabled={toggleStatus.isPending}
                  >
                    {form.status === 'active' ? (
                      <span className="text-xs font-medium text-green-600">ON</span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">OFF</span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(form.id)}
                    title={t('delete')}
                    disabled={deleteForm.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Desktop: Table */}
      {!isLoading && (
        <Card className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="w-36">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id} className="h-14">
                  <TableCell className="font-medium max-w-[200px]">
                    <span className="block truncate" title={form.name}>{form.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono max-w-[160px]">
                    <span className="block truncate" title={form.slug}>{form.slug}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{CATEGORY_LABELS[form.category]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {form.sector_id
                        ? sectors.find((s) => s.id === form.sector_id)?.name ?? '—'
                        : 'Todos'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[form.status]} className={STATUS_CLASS[form.status]}>
                      {STATUS_LABELS[form.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* Preview */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openPreview(form)}
                        title={t('formPreview')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(form)}
                        title="Editar formulário"
                        disabled={updateForm.isPending}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Toggle status */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(form)}
                        title={form.status === 'active' ? 'Desativar' : 'Ativar'}
                        disabled={toggleStatus.isPending}
                      >
                        {form.status === 'active' ? (
                          <span className="text-xs font-medium text-green-600">ON</span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">OFF</span>
                        )}
                      </Button>

                      {/* Delete */}
                      <Dialog
                        open={deleteTarget === form.id}
                        onOpenChange={(open) => {
                          if (!open) setDeleteTarget(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(form.id)}
                            title={t('delete')}
                            disabled={deleteForm.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('confirmDelete')}</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground">
                            Tem certeza que deseja excluir <strong>{form.name}</strong>?
                          </p>
                          <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                              {t('cancel')}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(form.id)}
                              disabled={deleteForm.isPending}
                            >
                              {deleteForm.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                t('delete')
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {forms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={FileText}
                      title="Nenhum formulário criado"
                      description="Monte seu primeiro formulário com o construtor visual"
                      ctaLabel="Criar formulário"
                      onCtaClick={() => setCreateOpen(true)}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
