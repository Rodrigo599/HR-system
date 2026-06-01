import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Settings, Search, MoreHorizontal, UserX, UserCheck, KeyRound, FileText, ExternalLink, ClipboardList } from 'lucide-react';
import { Sector, Profile, AppRole, Dependent, Pdi } from '@/types/database';
import type { AdminKpi } from '@/services/adminService';
import { DEMO_MODE } from '@/lib/demoMode';
import {
  useSectors, useAdminKpis, useAllPdis,
  useSaveSector, useDeleteSector,
  useSaveKpi, useDeleteKpi,
  useSaveAdminPdi, useDeleteAdminPdi,
} from '@/services/adminService';
import { useProfiles } from '@/services/profileService';
import { useDependents } from '@/services/dependentService';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { HierarchyView } from '@/components/admin/HierarchyView';
import { deactivateUser, reactivateUser } from '@/services/userManagementService';
import { useQuery } from '@tanstack/react-query';

export default function Admin() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Data queries
  const sectorsQuery = useSectors();
  const kpisQuery = useAdminKpis();
  const profilesQuery = useProfiles();
  const dependentsQuery = useDependents();
  const pdisQuery = useAllPdis();

  const sectors = sectorsQuery.data ?? [];
  const kpis: AdminKpi[] = kpisQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const dependents = dependentsQuery.data ?? [];
  const allPdis = pdisQuery.data ?? [];

  const loading = sectorsQuery.isLoading || kpisQuery.isLoading || profilesQuery.isLoading || dependentsQuery.isLoading;

  // Mutations
  const saveSectorMut = useSaveSector();
  const deleteSectorMut = useDeleteSector();
  const saveKpiMut = useSaveKpi();
  const deleteKpiMut = useDeleteKpi();
  const savePdiMut = useSaveAdminPdi();
  const deletePdiMut = useDeleteAdminPdi();

  // --- Sector dialogs ---
  const [sectorDialogOpen, setSectorDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [sectorName, setSectorName] = useState('');
  const [sectorDesc, setSectorDesc] = useState('');

  // --- KPI dialogs ---
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<AdminKpi | null>(null);
  const [kpiName, setKpiName] = useState('');
  const [kpiDesc, setKpiDesc] = useState('');
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');
  const [kpiSectorIds, setKpiSectorIds] = useState<string[]>([]);

  // --- User (profile) dialogs ---
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileSectorId, setProfileSectorId] = useState<string>('');
  const [profileManagerId, setProfileManagerId] = useState<string>('');
  const [profileRole, setProfileRole] = useState<AppRole>('colaborador');
  const [profileFullName, setProfileFullName] = useState('');

  // --- Create user dialog ---
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // --- User filters ---
  const [userSearch, setUserSearch] = useState('');
  const [userSectorFilter, setUserSectorFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('active');
  const [usersViewMode, setUsersViewMode] = useState<'list' | 'hierarchy'>('list');

  // --- Deactivate confirm ---
  const [deactivateTarget, setDeactivateTarget] = useState<Profile | null>(null);

  // Fetch roles for all users (admin only)
  const rolesQuery = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      if (DEMO_MODE) return [];
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
  const allUserRoles = rolesQuery.data ?? [];

  const getUserRoles = (userId: string): AppRole[] =>
    allUserRoles.filter(r => r.user_id === userId).map(r => r.role);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    let result = profiles;

    // Status filter
    if (userStatusFilter === 'active') {
      result = result.filter(p => (p as any).active !== false);
    } else if (userStatusFilter === 'inactive') {
      result = result.filter(p => (p as any).active === false);
    }

    // Sector filter
    if (userSectorFilter !== 'all') {
      result = result.filter(p => p.sector_id === userSectorFilter);
    }

    // Role filter
    if (userRoleFilter !== 'all') {
      result = result.filter(p => getUserRoles(p.user_id).includes(userRoleFilter as AppRole));
    }

    // Search
    if (userSearch.length >= 2) {
      const q = userSearch.toLowerCase();
      result = result.filter(p =>
        p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [profiles, userSearch, userSectorFilter, userRoleFilter, userStatusFilter, allUserRoles]);

  const gestores = profiles.filter(p => getUserRoles(p.user_id).includes('gestor'));

  // --- PDI dialogs ---
  const [pdiDialogOpen, setPdiDialogOpen] = useState(false);
  const [editingPdi, setEditingPdi] = useState<Pdi | null>(null);
  const [pdiUserId, setPdiUserId] = useState<string>('');
  const [pdiTitle, setPdiTitle] = useState('');
  const [pdiDesc, setPdiDesc] = useState('');
  const [pdiStart, setPdiStart] = useState('');
  const [pdiEnd, setPdiEnd] = useState('');
  const [pdiDeleteTarget, setPdiDeleteTarget] = useState<Pdi | null>(null);
  const [pdiUserFilter, setPdiUserFilter] = useState('all');

  // --- Dependent dialogs ---
  const [dependentDialogOpen, setDependentDialogOpen] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);
  const [depProfileId, setDepProfileId] = useState<string>('');
  const [depName, setDepName] = useState('');
  const [depBirthDate, setDepBirthDate] = useState('');
  const [depRelationship, setDepRelationship] = useState('');
  const [depConsent, setDepConsent] = useState(false);

  const showDemoToast = () => {
    toast({ title: t('demoModeMessage') });
  };

  // ============ SECTORS ============

  const openCreateSector = () => {
    setEditingSector(null);
    setSectorName('');
    setSectorDesc('');
    setSectorDialogOpen(true);
  };

  const openEditSector = (sector: Sector) => {
    setEditingSector(sector);
    setSectorName(sector.name);
    setSectorDesc(sector.description || '');
    setSectorDialogOpen(true);
  };

  const saveSector = async () => {
    if (!sectorName.trim()) return;
    if (DEMO_MODE) { showDemoToast(); setSectorDialogOpen(false); return; }
    try {
      await saveSectorMut.mutateAsync({
        id: editingSector?.id,
        name: sectorName,
        description: sectorDesc || null,
      });
      toast({ title: t('success'), description: editingSector ? t('itemUpdated') : t('itemCreated') });
      setSectorDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  const deleteSector = async (id: string) => {
    if (DEMO_MODE) { showDemoToast(); return; }
    try {
      await deleteSectorMut.mutateAsync(id);
      toast({ title: t('success'), description: t('itemDeleted') });
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  // ============ KPIS ============

  const openCreateKpi = () => {
    setEditingKpi(null);
    setKpiName('');
    setKpiDesc('');
    setKpiTarget('');
    setKpiUnit('');
    setKpiSectorIds([]);
    setKpiDialogOpen(true);
  };

  const openEditKpi = (kpi: AdminKpi) => {
    setEditingKpi(kpi);
    setKpiName(kpi.name);
    setKpiDesc(kpi.description || '');
    setKpiTarget(String(kpi.target_value));
    setKpiUnit(kpi.unit || '');
    setKpiSectorIds(kpi.sector_ids ?? []);
    setKpiDialogOpen(true);
  };

  const toggleKpiSector = (sectorId: string) => {
    setKpiSectorIds(prev =>
      prev.includes(sectorId) ? prev.filter(id => id !== sectorId) : [...prev, sectorId]
    );
  };

  const saveKpi = async () => {
    if (!kpiName.trim() || !kpiTarget) return;
    if (DEMO_MODE) { showDemoToast(); setKpiDialogOpen(false); return; }
    try {
      await saveKpiMut.mutateAsync({
        id: editingKpi?.id,
        name: kpiName,
        description: kpiDesc || null,
        target_value: parseFloat(kpiTarget),
        unit: kpiUnit || null,
        sector_ids: kpiSectorIds,
      });
      toast({ title: t('success'), description: editingKpi ? t('itemUpdated') : t('itemCreated') });
      setKpiDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  const deleteKpi = async (id: string) => {
    if (DEMO_MODE) { showDemoToast(); return; }
    try {
      await deleteKpiMut.mutateAsync(id);
      toast({ title: t('success'), description: t('itemDeleted') });
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  // ============ USERS (profiles) ============

  const openEditUser = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileFullName(profile.full_name);
    setProfileSectorId(profile.sector_id || '');
    setProfileManagerId(profile.manager_id || '');
    const roles = getUserRoles(profile.user_id);
    setProfileRole(roles[0] || 'colaborador');
    setUserDialogOpen(true);
  };

  const saveUser = async () => {
    if (!editingProfile) return;
    if (DEMO_MODE) { showDemoToast(); setUserDialogOpen(false); return; }
    const { error } = await supabase.from('profiles').update({
      full_name: profileFullName,
      sector_id: profileSectorId || null,
      manager_id: profileManagerId || null,
    }).eq('id', editingProfile.id);
    if (error) { toast({ title: t('error'), description: error.message, variant: 'destructive' }); return; }
    await supabase.from('user_roles').upsert({ user_id: editingProfile.user_id, role: profileRole });
    toast({ title: t('success'), description: t('itemUpdated') });
    setUserDialogOpen(false);
    profilesQuery.refetch();
    rolesQuery.refetch();
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    if (DEMO_MODE) { showDemoToast(); setDeactivateTarget(null); return; }
    try {
      await deactivateUser(deactivateTarget.user_id);
      toast({ title: t('success'), description: `${deactivateTarget.full_name} desativado` });
      profilesQuery.refetch();
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
    setDeactivateTarget(null);
  };

  const handleReactivate = async (profile: Profile) => {
    if (DEMO_MODE) { showDemoToast(); return; }
    try {
      await reactivateUser(profile.user_id);
      toast({ title: t('success'), description: `${profile.full_name} reativado` });
      profilesQuery.refetch();
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  const getSectorName = (sectorId: string | null) => {
    if (!sectorId) return '-';
    return sectors.find(s => s.id === sectorId)?.name || '-';
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return '-';
    return profiles.find(p => p.id === managerId)?.full_name || '-';
  };

  // ============ DEPENDENTS ============

  const openCreateDependent = () => {
    setEditingDependent(null);
    setDepProfileId('');
    setDepName('');
    setDepBirthDate('');
    setDepRelationship('');
    setDepConsent(false);
    setDependentDialogOpen(true);
  };

  const openEditDependent = (dep: Dependent) => {
    setEditingDependent(dep);
    setDepProfileId(dep.profile_id);
    setDepName(dep.name);
    setDepBirthDate(dep.birth_date);
    setDepRelationship(dep.relationship);
    setDepConsent(dep.consent);
    setDependentDialogOpen(true);
  };

  const saveDependent = async () => {
    if (!depName.trim() || !depBirthDate || !depRelationship.trim()) return;
    if (DEMO_MODE) { showDemoToast(); setDependentDialogOpen(false); return; }
    const payload = {
      profile_id: depProfileId || null,
      name: depName,
      birth_date: depBirthDate,
      relationship: depRelationship,
      consent: depConsent,
    };
    if (editingDependent) {
      const { error } = await supabase.from('dependents').update(payload).eq('id', editingDependent.id);
      if (error) { toast({ title: t('error'), description: error.message, variant: 'destructive' }); return; }
      toast({ title: t('success'), description: t('itemUpdated') });
    } else {
      const { error } = await supabase.from('dependents').insert(payload);
      if (error) { toast({ title: t('error'), description: error.message, variant: 'destructive' }); return; }
      toast({ title: t('success'), description: t('itemCreated') });
    }
    setDependentDialogOpen(false);
    dependentsQuery.refetch();
  };

  const deleteDependent = async (id: string) => {
    if (DEMO_MODE) { showDemoToast(); return; }
    const { error } = await supabase.from('dependents').delete().eq('id', id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('itemDeleted') });
      dependentsQuery.refetch();
    }
  };

  const getProfileName = (profileId: string) => {
    return profiles.find(p => p.id === profileId)?.full_name || profileId;
  };

  // ============ PDIs ADMIN ============

  const getProfileByUserId = (userId: string) =>
    profiles.find(p => p.user_id === userId);

  const openCreatePdi = () => {
    setEditingPdi(null);
    setPdiUserId('');
    setPdiTitle('');
    setPdiDesc('');
    setPdiStart('');
    setPdiEnd('');
    setPdiDialogOpen(true);
  };

  const openEditPdi = (pdi: Pdi) => {
    setEditingPdi(pdi);
    setPdiUserId(pdi.user_id);
    setPdiTitle(pdi.title);
    setPdiDesc(pdi.description || '');
    setPdiStart(pdi.start_date || '');
    setPdiEnd(pdi.end_date || '');
    setPdiDialogOpen(true);
  };

  const saveAdminPdi = async () => {
    if (!pdiTitle.trim() || !pdiUserId) return;
    if (DEMO_MODE) { showDemoToast(); setPdiDialogOpen(false); return; }
    try {
      await savePdiMut.mutateAsync({
        id: editingPdi?.id,
        user_id: pdiUserId,
        title: pdiTitle,
        description: pdiDesc || null,
        start_date: pdiStart || null,
        end_date: pdiEnd || null,
      });
      toast({ title: t('success'), description: editingPdi ? t('itemUpdated') : t('itemCreated') });
      setPdiDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  const confirmDeletePdi = async () => {
    if (!pdiDeleteTarget) return;
    if (DEMO_MODE) { showDemoToast(); setPdiDeleteTarget(null); return; }
    try {
      await deletePdiMut.mutateAsync(pdiDeleteTarget.id);
      toast({ title: t('success'), description: t('itemDeleted') });
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
    setPdiDeleteTarget(null);
  };

  const filteredPdis = pdiUserFilter === 'all'
    ? allPdis
    : allPdis.filter(p => p.user_id === pdiUserFilter);

  // ============ RENDER ============

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('admin')}</h1>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => navigate('/smartforms')}
        >
          <FileText className="h-4 w-4" />
          Gerenciar Formulários
          <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </div>

      <Tabs defaultValue="sectors">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sectors">{t('sectors')}</TabsTrigger>
          <TabsTrigger value="kpis">{t('kpis')}</TabsTrigger>
          <TabsTrigger value="pdis" className="flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> PDIs
          </TabsTrigger>
          <TabsTrigger value="users">{t('users')}</TabsTrigger>
          <TabsTrigger value="dependents">{t('dependents')}</TabsTrigger>
        </TabsList>

        {/* ====== SECTORS TAB ====== */}
        <TabsContent value="sectors" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={sectorDialogOpen} onOpenChange={setSectorDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={openCreateSector}>
                  <Plus className="h-4 w-4" /> {t('addNew')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSector ? t('editSector') : t('manageSectors')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('name')}</Label>
                    <Input value={sectorName} onChange={e => setSectorName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('description')}</Label>
                    <Input value={sectorDesc} onChange={e => setSectorDesc(e.target.value)} />
                  </div>
                  <Button onClick={saveSector} className="w-full">{t('save')}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead className="w-24">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors.map(sector => (
                  <TableRow key={sector.id}>
                    <TableCell className="font-medium">{sector.name}</TableCell>
                    <TableCell>{sector.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditSector(sector)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSector(sector.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {sectors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">{t('noData')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ====== KPIS TAB ====== */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={kpiDialogOpen} onOpenChange={setKpiDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={openCreateKpi}>
                  <Plus className="h-4 w-4" /> {t('addNew')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingKpi ? t('editKpi') : t('createKpi')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('name')}</Label>
                    <Input value={kpiName} onChange={e => setKpiName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('description')}</Label>
                    <Input value={kpiDesc} onChange={e => setKpiDesc(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('targetValue')}</Label>
                    <Input type="number" value={kpiTarget} onChange={e => setKpiTarget(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('unit')}</Label>
                    <Input value={kpiUnit} onChange={e => setKpiUnit(e.target.value)} placeholder="%, pts, USD..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Setores visíveis</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-36 overflow-y-auto">
                      {sectors.map(s => (
                        <div key={s.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`ks-${s.id}`}
                            checked={kpiSectorIds.includes(s.id)}
                            onCheckedChange={() => toggleKpiSector(s.id)}
                          />
                          <label htmlFor={`ks-${s.id}`} className="text-sm cursor-pointer">{s.name}</label>
                        </div>
                      ))}
                      {sectors.length === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhum setor cadastrado</p>
                      )}
                    </div>
                    {kpiSectorIds.length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhum selecionado = universal (todos os setores)</p>
                    )}
                  </div>
                  <Button onClick={saveKpi} className="w-full">{t('save')}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('target')}</TableHead>
                  <TableHead>{t('unit')}</TableHead>
                  <TableHead>{t('sector')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead className="w-24">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map(kpi => (
                  <TableRow key={kpi.id}>
                    <TableCell className="font-medium">{kpi.name}</TableCell>
                    <TableCell>{kpi.target_value}</TableCell>
                    <TableCell>{kpi.unit || '-'}</TableCell>
                    <TableCell>
                      {kpi.sector_ids.length === 0
                        ? <Badge variant="outline" className="text-xs">Universal</Badge>
                        : kpi.sector_ids.map(id => (
                            <Badge key={id} variant="secondary" className="text-xs mr-1">{getSectorName(id)}</Badge>
                          ))
                      }
                    </TableCell>
                    <TableCell>{kpi.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditKpi(kpi)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteKpi(kpi.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {kpis.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">{t('noData')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ====== PDIs TAB ====== */}
        <TabsContent value="pdis" className="space-y-4">
          {/* Delete confirm */}
          <AlertDialog open={!!pdiDeleteTarget} onOpenChange={open => { if (!open) setPdiDeleteTarget(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir PDI?</AlertDialogTitle>
                <AlertDialogDescription>
                  O PDI "{pdiDeleteTarget?.title}" e todas as suas tarefas serão removidos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeletePdi} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Create/Edit dialog */}
          <Dialog open={pdiDialogOpen} onOpenChange={setPdiDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPdi ? 'Editar PDI' : 'Novo PDI'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!editingPdi && (
                  <div className="space-y-2">
                    <Label>Colaborador</Label>
                    <Select value={pdiUserId || 'none'} onValueChange={v => setPdiUserId(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {editingPdi && (
                  <p className="text-sm text-muted-foreground">
                    Colaborador: <span className="font-medium">{getProfileByUserId(editingPdi.user_id)?.full_name ?? editingPdi.user_id}</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={pdiTitle} onChange={e => setPdiTitle(e.target.value)} placeholder="Ex: Liderança em projetos, Inglês avançado..." />
                </div>
                <div className="space-y-2">
                  <Label>{t('description')}</Label>
                  <Input value={pdiDesc} onChange={e => setPdiDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input type="date" value={pdiStart} onChange={e => setPdiStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Input type="date" value={pdiEnd} onChange={e => setPdiEnd(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPdiDialogOpen(false)}>{t('cancel')}</Button>
                  <Button onClick={saveAdminPdi} className="flex-1">{t('save')}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Filters + Add */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Select value={pdiUserFilter} onValueChange={setPdiUserFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filtrar por colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os colaboradores</SelectItem>
                {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="flex items-center gap-2" onClick={openCreatePdi}>
              <Plus className="h-4 w-4" /> {t('addNew')}
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>{t('sector')}</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="w-24">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPdis.map(pdi => {
                  const profile = getProfileByUserId(pdi.user_id);
                  return (
                    <TableRow key={pdi.id}>
                      <TableCell className="font-medium">{pdi.title}</TableCell>
                      <TableCell>{profile?.full_name ?? '-'}</TableCell>
                      <TableCell>{getSectorName(profile?.sector_id ?? null)}</TableCell>
                      <TableCell>{pdi.start_date ?? '-'}</TableCell>
                      <TableCell>{pdi.end_date ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditPdi(pdi)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setPdiDeleteTarget(pdi)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPdis.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">{t('noData')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ====== USERS TAB ====== */}
        <TabsContent value="users" className="space-y-4">
          {/* Create User Dialog */}
          <CreateUserDialog
            open={createUserOpen}
            onOpenChange={setCreateUserOpen}
            sectors={sectors}
            gestores={gestores.map(g => ({ id: g.id, full_name: g.full_name }))}
            onSuccess={() => { profilesQuery.refetch(); rolesQuery.refetch(); }}
          />

          {/* Edit User Dialog — Bug #10 fix: key forces remount so fields always reflect current user */}
          <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
            <DialogContent key={editingProfile?.id ?? 'edit-user'}>
              <DialogHeader>
                <DialogTitle>Editar usuario</DialogTitle>
              </DialogHeader>
              {editingProfile && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{editingProfile.email}</p>
                  <div className="space-y-2">
                    <Label>{t('fullName')}</Label>
                    <Input value={profileFullName} onChange={e => setProfileFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('sector')}</Label>
                    <Select value={profileSectorId || 'none'} onValueChange={v => setProfileSectorId(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder={t('selectSector')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('noSector')}</SelectItem>
                        {sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('manager')}</Label>
                    <Select value={profileManagerId || 'none'} onValueChange={v => setProfileManagerId(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder={t('selectManager')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('noManager')}</SelectItem>
                        {profiles.filter(p => p.id !== editingProfile.id).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('role')}</Label>
                    <Select value={profileRole} onValueChange={v => setProfileRole(v as AppRole)}>
                      <SelectTrigger><SelectValue placeholder={t('selectRole')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t('adminRole')}</SelectItem>
                        <SelectItem value="gestor">{t('gestorRole')}</SelectItem>
                        <SelectItem value="colaborador">{t('colaboradorRole')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Bug #12 fix: add Cancel button to edit user modal */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setUserDialogOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={saveUser} className="flex-1">{t('save')}</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Deactivate Confirm */}
          <AlertDialog open={!!deactivateTarget} onOpenChange={open => { if (!open) setDeactivateTarget(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desativar {deactivateTarget?.full_name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  O usuário não conseguirá mais fazer login. Os dados históricos serão preservados. Esta ação pode ser revertida.
                  {profiles.filter(p => p.manager_id === deactivateTarget?.id).length > 0 && (
                    <span className="block mt-2 text-destructive font-medium">
                      Este usuário tem {profiles.filter(p => p.manager_id === deactivateTarget?.id).length} colaboradores vinculados. Eles ficarão sem gestor.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Desativar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={userSectorFilter} onValueChange={setUserSectorFilter}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder={t('sector')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder={t('role')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="admin">{t('adminRole')}</SelectItem>
                  <SelectItem value="gestor">{t('gestorRole')}</SelectItem>
                  <SelectItem value="colaborador">{t('colaboradorRole')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder={t('status')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="flex border rounded-md">
                <Button variant={usersViewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setUsersViewMode('list')}>Lista</Button>
                <Button variant={usersViewMode === 'hierarchy' ? 'default' : 'ghost'} size="sm" onClick={() => setUsersViewMode('hierarchy')}>Hierarquia</Button>
              </div>
              <Button className="gap-2" onClick={() => setCreateUserOpen(true)}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Users View */}
          {usersViewMode === 'hierarchy' ? (
            <HierarchyView
              profiles={filteredProfiles.map(p => ({
                profile: p,
                roles: getUserRoles(p.user_id),
                teamSize: profiles.filter(pp => pp.manager_id === p.id).length,
              }))}
              onEditUser={openEditUser}
            />
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="md:hidden space-y-3">
                {filteredProfiles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{t('noData')}</p>
                ) : (
                  filteredProfiles.map(p => {
                    const isInactive = (p as any).active === false;
                    const roles = getUserRoles(p.user_id);
                    return (
                      <Card key={p.id} className={`p-4 ${isInactive ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{p.full_name}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </div>
                          <Badge variant={isInactive ? 'destructive' : 'default'} className="text-xs flex-shrink-0">
                            {isInactive ? 'Inativo' : 'Ativo'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {roles.map(r => (
                            <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                          ))}
                          {getSectorName(p.sector_id) !== '-' && (
                            <Badge variant="outline" className="text-xs">{getSectorName(p.sector_id)}</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditUser(p)}>
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          {isInactive ? (
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleReactivate(p)}>
                              <UserCheck className="h-3 w-3 mr-1" /> Reativar
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeactivateTarget(p)}>
                              <UserX className="h-3 w-3 mr-1" /> Desativar
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Desktop: tabela */}
              <Card className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('fullName')}</TableHead>
                      <TableHead>{t('email')}</TableHead>
                      <TableHead>{t('sector')}</TableHead>
                      <TableHead>{t('manager')}</TableHead>
                      <TableHead>{t('role')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="w-16">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map(p => {
                      const isInactive = (p as any).active === false;
                      const roles = getUserRoles(p.user_id);
                      return (
                        <TableRow key={p.id} className={isInactive ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">{p.full_name}</TableCell>
                          <TableCell>{p.email}</TableCell>
                          <TableCell>{getSectorName(p.sector_id)}</TableCell>
                          <TableCell>{getManagerName(p.manager_id)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {roles.map(r => (
                                <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isInactive ? 'destructive' : 'default'} className="text-xs">
                              {isInactive ? 'Inativo' : 'Ativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditUser(p)}>
                                  <Pencil className="h-4 w-4 mr-2" /> Editar perfil
                                </DropdownMenuItem>
                                {isInactive ? (
                                  <DropdownMenuItem onClick={() => handleReactivate(p)}>
                                    <UserCheck className="h-4 w-4 mr-2" /> Reativar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setDeactivateTarget(p)} className="text-destructive">
                                    <UserX className="h-4 w-4 mr-2" /> Desativar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredProfiles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">{t('noData')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ====== DEPENDENTS TAB ====== */}
        <TabsContent value="dependents" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dependentDialogOpen} onOpenChange={setDependentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={openCreateDependent}>
                  <Plus className="h-4 w-4" /> {t('addNew')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDependent ? t('manageDependents') : t('manageDependents')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('collaborator')}</Label>
                    <Select value={depProfileId || 'none'} onValueChange={v => setDepProfileId(v === 'none' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectProfile')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        {profiles.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('name')}</Label>
                    <Input value={depName} onChange={e => setDepName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('birthDate')}</Label>
                    <Input type="date" value={depBirthDate} onChange={e => setDepBirthDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('relationship')}</Label>
                    <Input value={depRelationship} onChange={e => setDepRelationship(e.target.value)} placeholder="filho, filha, cônjuge..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dep-consent"
                      checked={depConsent}
                      onCheckedChange={checked => setDepConsent(checked === true)}
                    />
                    <Label htmlFor="dep-consent">{t('consent')}</Label>
                  </div>
                  {/* Bug #12 fix: add Cancel button to add dependent modal */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setDependentDialogOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={saveDependent} className="flex-1">{t('save')}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('birthDate')}</TableHead>
                  <TableHead>{t('relationship')}</TableHead>
                  <TableHead>{t('consent')}</TableHead>
                  <TableHead>{t('collaborator')}</TableHead>
                  <TableHead className="w-24">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependents.map(dep => (
                  <TableRow key={dep.id}>
                    <TableCell className="font-medium">{dep.name}</TableCell>
                    <TableCell>{dep.birth_date}</TableCell>
                    <TableCell>{dep.relationship}</TableCell>
                    <TableCell>{dep.consent ? t('consentGiven') : t('consentNotGiven')}</TableCell>
                    <TableCell>{getProfileName(dep.profile_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDependent(dep)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDependent(dep.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {dependents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">{t('noData')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
