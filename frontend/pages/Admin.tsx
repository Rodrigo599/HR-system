import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutationHandler } from '@/hooks/useMutation';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useSectors, useCreateSector, useUpdateSector, useDeleteSector } from '@/hooks/api/useSectors';
import { useKpis, useCreateKpi, useUpdateKpi, useDeleteKpi } from '@/hooks/api/useKpis';
import { useUsers } from '@/hooks/api/useUsers';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import type { Sector, Kpi } from '@/types/api';

export default function Admin() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { run } = useMutationHandler();

  const sectorsQuery = useSectors();
  const kpisQuery = useKpis();
  const usersQuery = useUsers();

  const sectors = sectorsQuery.data ?? [];
  const kpis = kpisQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const createSectorMutation = useCreateSector();
  const deleteSectorMutation = useDeleteSector();
  const createKpiMutation = useCreateKpi();
  const deleteKpiMutation = useDeleteKpi();

  const [sectorDialogOpen, setSectorDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [sectorName, setSectorName] = useState('');
  const [sectorDesc, setSectorDesc] = useState('');
  const updateSectorMutation = useUpdateSector(editingSector?.id ?? '');

  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<Kpi | null>(null);
  const [kpiName, setKpiName] = useState('');
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');
  const [kpiSectors, setKpiSectors] = useState<string[]>([]);
  const updateKpiMutation = useUpdateKpi(editingKpi?.id ?? '');

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!isAdmin) return <div className="p-6 text-muted-foreground">{t('adminOnly')}</div>;

  const loading = sectorsQuery.isLoading || kpisQuery.isLoading || usersQuery.isLoading;

  const openSectorDialog = (sector?: Sector) => {
    setEditingSector(sector ?? null);
    setSectorName(sector?.name ?? '');
    setSectorDesc(sector?.description ?? '');
    setSectorDialogOpen(true);
  };

  const handleSaveSector = async () => {
    const promise = editingSector
      ? updateSectorMutation.mutateAsync({ name: sectorName, description: sectorDesc })
      : createSectorMutation.mutateAsync({ name: sectorName, description: sectorDesc });
    await run(promise, { successMsg: editingSector ? t('sectorUpdated') : t('sectorCreated'), onSuccess: () => setSectorDialogOpen(false) });
  };

  const handleDeleteSector = async (id: string) => {
    await run(deleteSectorMutation.mutateAsync(id), { successMsg: t('sectorDeleted'), onSuccess: () => setConfirmDelete(null) });
  };

  const openKpiDialog = (kpi?: Kpi) => {
    setEditingKpi(kpi ?? null);
    setKpiName(kpi?.name ?? '');
    setKpiTarget(kpi?.target_value?.toString() ?? '');
    setKpiUnit(kpi?.unit ?? '');
    setKpiSectors([]);
    setKpiDialogOpen(true);
  };

  const handleSaveKpi = async () => {
    if (!kpiName || !kpiTarget) {
      toast({ title: t('kpiFillNameTarget'), variant: 'destructive' });
      return;
    }
    const payload = { name: kpiName, target_value: Number(kpiTarget), unit: kpiUnit, sector_ids: kpiSectors };
    const promise = editingKpi ? updateKpiMutation.mutateAsync(payload) : createKpiMutation.mutateAsync(payload);
    await run(promise, { successMsg: editingKpi ? t('kpiUpdated') : t('kpiCreated'), onSuccess: () => setKpiDialogOpen(false) });
  };

  const handleDeleteKpi = async (id: string) => {
    await run(deleteKpiMutation.mutateAsync(id), { successMsg: t('kpiDeleted'), onSuccess: () => setConfirmDelete(null) });
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold">{t('admin')}</h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t('users')}</TabsTrigger>
          <TabsTrigger value="sectors">{t('sectors')}</TabsTrigger>
          <TabsTrigger value="kpis">{t('kpis')}</TabsTrigger>
        </TabsList>

        {/* Usuários */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('searchUser')} value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" onClick={() => setUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> {t('newUser')}
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('roles')}</TableHead>
                  <TableHead>{t('sector')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map(r => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.profile?.sector?.name ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Setores */}
        <TabsContent value="sectors" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openSectorDialog()}>
              <Plus className="h-4 w-4 mr-2" /> {t('newSector')}
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.description ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openSectorDialog(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(`sector:${s.id}`)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* KPIs */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openKpiDialog()}>
              <Plus className="h-4 w-4 mr-2" /> {t('newKpi')}
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('kpiTarget')}</TableHead>
                  <TableHead>{t('kpiUnit')}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>{k.target_value}</TableCell>
                    <TableCell>{k.unit}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openKpiDialog(k)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(`kpi:${k.id}`)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setor Dialog */}
      <Dialog open={sectorDialogOpen} onOpenChange={setSectorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSector ? t('editSector') : t('newSector')}</DialogTitle>
            <DialogDescription>{editingSector ? t('editSectorDesc') : t('newSectorDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>{t('name')}</Label><Input value={sectorName} onChange={e => setSectorName(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t('description')}</Label><Input value={sectorDesc} onChange={e => setSectorDesc(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSectorDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveSector} disabled={createSectorMutation.isPending || updateSectorMutation.isPending}>
                {(createSectorMutation.isPending || updateSectorMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI Dialog */}
      <Dialog open={kpiDialogOpen} onOpenChange={setKpiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKpi ? t('editKpi') : t('newKpi')}</DialogTitle>
            <DialogDescription>{editingKpi ? t('editKpiDesc') : t('newKpiDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>{t('name')}</Label><Input value={kpiName} onChange={e => setKpiName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('kpiTarget')}</Label><Input type="number" value={kpiTarget} onChange={e => setKpiTarget(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t('kpiUnit')}</Label><Input value={kpiUnit} onChange={e => setKpiUnit(e.target.value)} placeholder="%, pontos..." /></div>
            </div>
            <div className="space-y-2">
              <Label>{t('sectors')}</Label>
              <Select onValueChange={id => setKpiSectors(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])}>
                <SelectTrigger><SelectValue placeholder={t('addSector')} /></SelectTrigger>
                <SelectContent>
                  {sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {kpiSectors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {kpiSectors.map(id => {
                    const s = sectors.find(s => s.id === id);
                    return <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => setKpiSectors(prev => prev.filter(sid => sid !== id))}>{s?.name} ×</Badge>;
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setKpiDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveKpi} disabled={createKpiMutation.isPending || updateKpiMutation.isPending}>
                {(createKpiMutation.isPending || updateKpiMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteIrreversible')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!confirmDelete) return;
              const [type, id] = confirmDelete.split(':');
              if (type === 'sector') handleDeleteSector(id);
              if (type === 'kpi') handleDeleteKpi(id);
            }}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateUserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSuccess={() => usersQuery.refetch()}
      />
    </div>
  );
}
