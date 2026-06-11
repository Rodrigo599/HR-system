<?php

namespace Src\KPI\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\KPI\Models\Kpi;
use Src\Organization\Services\HierarchyService;
use Src\Shared\Interfaces\ViewAwareServiceInterface;

class KpiService implements ViewAwareServiceInterface
{
    public function __construct(private readonly HierarchyService $hierarchy) {}

    public function forUser(User $user): Collection
    {
        $sectorId = $user->profile?->sector_id;

        return Kpi::with('sectors')
            ->where(fn ($q) => $q
                ->whereDoesntHave('sectors')
                ->orWhereHas('sectors', fn ($s) => $s->where('sectors.id', $sectorId))
            )
            ->get();
    }

    public function forTeam(User $user): Collection
    {
        if ($user->hasRole('admin')) {
            return Kpi::with('sectors')->get();
        }

        $sectorIds = $this->hierarchy->getTeamSectorIds($user);

        return Kpi::with('sectors')
            ->where(fn ($q) => $q
                ->whereDoesntHave('sectors')
                ->orWhereHas('sectors', fn ($s) => $s->whereIn('sectors.id', $sectorIds))
            )
            ->get();
    }

    public function create(array $data, array $sectorIds = []): Kpi
    {
        $kpi = Kpi::create($data);

        if ($sectorIds) {
            $kpi->sectors()->sync($sectorIds);
        }

        return $kpi->load('sectors');
    }

    public function update(Kpi $kpi, array $data, array $sectorIds = []): Kpi
    {
        $kpi->update($data);
        $kpi->sectors()->sync($sectorIds);

        return $kpi->fresh('sectors');
    }
}
