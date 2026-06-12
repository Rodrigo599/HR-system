import { useState } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, FileText, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { SmartFormRenderer } from '@/components/smartforms/SmartFormRenderer';
import SmartFormBuilder from '@/components/smartforms/SmartFormBuilder';
import { useSmartForms, useCreateSmartForm, useDeleteSmartForm, useUpdateSmartForm, useSubmitSmartFormResponse } from '@/hooks/api/useSmartForms';
import { SectorSelect } from '@/components/shared/SectorSelect';
import { SectorName } from '@/components/shared/SectorName';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { SmartFormCategory, SmartFormStatus } from '@/lib/enums';
import { SMART_FORM_CATEGORY_LABELS } from '@/lib/enums';
import type { SmartForm } from '@/types/api';

type ViewMode = 'list' | 'preview' | 'edit';

const GESTOR_CATEGORIES: SmartFormCategory[] = ['feedback', 'survey'];
const ALL_SECTORS = '__all__';

// ── Subcomponente: cabeçalho de volta + título ─────────────────────────────
function ViewHeader({ title: name, subtitle, isPending, onBack }: {
  title: string; subtitle: string; isPending?: boolean; onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div>
        <h1 className="text-xl font-bold">{name}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}

// ── Subcomponente: botões de ação (preview, edit, toggle, delete) ───────────
function FormActions({ form, onPreview, onEdit, onToggle, onDelete, isPendingUpdate, isPendingDelete }: {
  form: SmartForm;
  onPreview: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  isPendingUpdate: boolean;
  isPendingDelete: boolean;
}) {
  const { t } = useLanguage();
  return (
    <>
      <Button variant="ghost" size="icon" onClick={onPreview} title={t('formPreview')}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onEdit} title={t('editForm')} disabled={isPendingUpdate}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onToggle} title={form.status === 'active' ? t('deactivateForm') : t('activateForm')} disabled={isPendingUpdate}>
        {form.status === 'active'
          ? <span className="text-xs font-medium text-green-600">ON</span>
          : <span className="text-xs font-medium text-muted-foreground">OFF</span>}
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title={t('delete')} disabled={isPendingDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function SmartForms() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [view, setView] = useState<ViewMode>('list');
  const [selectedForm, setSelectedForm] = useState<SmartForm | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newCategory, setNewCategory] = useState<SmartFormCategory>(isAdmin ? 'custom' : 'feedback');
  const [newSectorId, setNewSectorId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: allForms = [], isLoading } = useSmartForms();
  const forms = isAdmin
    ? allForms
    : allForms.filter(f => GESTOR_CATEGORIES.includes(f.category as SmartFormCategory));

  const createForm = useCreateSmartForm();
  const deleteForm = useDeleteSmartForm();
  const updateForm = useUpdateSmartForm();
  const submitResponse = useSubmitSmartFormResponse(selectedForm?.id ?? '');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createForm.mutate(
      {
        name: newName,
        slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-'),
        category: newCategory,
        sector_id: newSectorId,
        config: { steps: [{ title: { pt: 'Passo 1' }, fields: [] }], submit: { pt: 'Enviar', es: 'Enviar' } },
      },
      {
        onSuccess: () => {
          toast({ title: t('formSaved') });
          setNewName(''); setNewSlug(''); setNewCategory('custom'); setNewSectorId(null); setCreateOpen(false);
        },
        onError: () => toast({ title: t('formSaveError'), variant: 'destructive' }),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteForm.mutate(id, {
      onSuccess: () => { toast({ title: t('formDeleted') }); setDeleteTarget(null); },
      onError: () => { toast({ title: t('formDeleteError'), variant: 'destructive' }); setDeleteTarget(null); },
    });
  };

  const handleToggleStatus = (form: SmartForm) => {
    const nextStatus: SmartFormStatus = form.status === 'active' ? 'draft' : 'active';
    updateForm.mutate(
      { id: form.id, status: nextStatus },
      { onError: () => toast({ title: t('formSaveError'), variant: 'destructive' }) },
    );
  };

  const open = (form: SmartForm, mode: 'preview' | 'edit') => { setSelectedForm(form); setView(mode); };
  const backToList = () => setView('list');

  // ── View: Preview ──
  if (view === 'preview' && selectedForm) {
    return (
      <div className="space-y-4">
        <Breadcrumbs />
        <ViewHeader title={selectedForm.name} subtitle={t('previewSubtitle')} onBack={backToList} />
        <SmartFormRenderer
          config={selectedForm.config}
          onSubmit={(responses) => submitResponse.mutate(responses, {
            onSuccess: () => toast({ title: t('formSubmitted') }),
            onError: () => toast({ title: t('formSaveError'), variant: 'destructive' }),
          })}
        />
      </div>
    );
  }

  // ── View: Edit ──
  if (view === 'edit' && selectedForm) {
    return (
      <div className="space-y-4">
        <Breadcrumbs />
        <ViewHeader title={selectedForm.name} subtitle={t('editSubtitle')} isPending={updateForm.isPending} onBack={backToList} />
        <Card className="p-4">
          <div className="space-y-2">
            <Label>{t('sectorLabel')}</Label>
            <SectorSelect
              value={selectedForm.sector_id ?? ALL_SECTORS}
              onValueChange={(v) => {
                const nextSectorId = v === ALL_SECTORS ? null : v;
                updateForm.mutate(
                  { id: selectedForm.id, sector_id: nextSectorId },
                  { onError: () => toast({ title: t('formSaveError'), variant: 'destructive' }) },
                );
                setSelectedForm(prev => prev ? { ...prev, sector_id: nextSectorId } : prev);
              }}
              allOption={{ value: ALL_SECTORS, label: t('allSectorsOption') }}
            />
            <p className="text-xs text-muted-foreground">{t('sectorHintEdit')}</p>
          </div>
        </Card>
        <SmartFormBuilder
          config={selectedForm.config}
          onChange={(newConfig) => {
            updateForm.mutate(
              { id: selectedForm.id, config: newConfig },
              { onError: () => toast({ title: t('formSaveError'), variant: 'destructive' }) },
            );
            setSelectedForm(prev => prev ? { ...prev, config: newConfig } : prev);
          }}
        />
      </div>
    );
  }

  // ── View: List ──
  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('smartforms')}</h1>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2"><Plus className="h-4 w-4" />{t('createForm')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('createForm')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('formName')} <span className="text-destructive">*</span></Label>
                <Input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                  placeholder={t('formNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('formSlug')}</Label>
                <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="avaliacao-mensal" />
              </div>
              <div className="space-y-2">
                <Label>{t('formCategory')}</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as SmartFormCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Label>{t('sectorLabel')}</Label>
                <SectorSelect
                  value={newSectorId ?? ALL_SECTORS}
                  onValueChange={(v) => setNewSectorId(v === ALL_SECTORS ? null : v)}
                  allOption={{ value: ALL_SECTORS, label: t('allSectorsOption') }}
                />
                <p className="text-xs text-muted-foreground">{t('sectorHintCreate')}</p>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newName.trim() || createForm.isPending}>
                {createForm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Mobile: cards */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
          {forms.length === 0 ? (
            <EmptyState icon={FileText} title={t('noFormsTitle')} description={t('noFormsDesc')} ctaLabel={t('createForm')} onCtaClick={() => setCreateOpen(true)} />
          ) : forms.map(form => (
            <Card key={form.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium truncate max-w-[160px]">{form.name}</span>
                <StatusBadge status={form.status} domain="smart_form" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
                <Badge variant="outline" className="text-xs">{SMART_FORM_CATEGORY_LABELS[form.category as SmartFormCategory] ?? form.category}</Badge>
                <Badge variant="outline" className="text-xs"><SectorName sectorId={form.sector_id} fallback={t('allSectorsOption')} /></Badge>
                <span className="font-mono text-xs truncate">{form.slug}</span>
              </div>
              <div className="flex gap-1">
                <FormActions
                  form={form}
                  onPreview={() => open(form, 'preview')}
                  onEdit={() => open(form, 'edit')}
                  onToggle={() => handleToggleStatus(form)}
                  onDelete={() => setDeleteTarget(form.id)}
                  isPendingUpdate={updateForm.isPending}
                  isPendingDelete={deleteForm.isPending}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop: Table */}
      {!isLoading && (
        <Card className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('slugLabel')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('sectorLabel')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="w-36">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState icon={FileText} title={t('noFormsTitle')} description={t('noFormsDesc')} ctaLabel={t('createForm')} onCtaClick={() => setCreateOpen(true)} />
                  </TableCell>
                </TableRow>
              )}
              {forms.map(form => (
                <TableRow key={form.id} className="h-14">
                  <TableCell className="font-medium max-w-[200px]">
                    <span className="block truncate" title={form.name}>{form.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono max-w-[160px]">
                    <span className="block truncate" title={form.slug}>{form.slug}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{SMART_FORM_CATEGORY_LABELS[form.category as SmartFormCategory] ?? form.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs"><SectorName sectorId={form.sector_id} fallback={t('all')} /></Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={form.status} domain="smart_form" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FormActions
                        form={form}
                        onPreview={() => open(form, 'preview')}
                        onEdit={() => open(form, 'edit')}
                        onToggle={() => handleToggleStatus(form)}
                        onDelete={() => setDeleteTarget(form.id)}
                        isPendingUpdate={updateForm.isPending}
                        isPendingDelete={deleteForm.isPending}
                      />
                    </div>

                    <Dialog open={deleteTarget === form.id} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{t('confirmDelete')}</DialogTitle></DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          {t('deleteFormConfirm', { name: form.name })}
                        </p>
                        <div className="flex gap-3 justify-end pt-2">
                          <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('cancel')}</Button>
                          <Button variant="destructive" onClick={() => handleDelete(form.id)} disabled={deleteForm.isPending}>
                            {deleteForm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('delete')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
