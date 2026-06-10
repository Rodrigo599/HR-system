<?php

namespace Src\KPI\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\KPI\DTOs\UpsertKpiResultDTO;
use Src\KPI\Models\KpiResult;
use Src\Organization\Services\HierarchyService;

class KpiResultService
{
    public function __construct(private readonly HierarchyService $hierarchy) {}

    public function upsert(UpsertKpiResultDTO $dto): KpiResult
    {
        return KpiResult::updateOrCreate(
            [
                'kpi_id' => $dto->kpiId,
                'user_id' => $dto->userId,
                'month' => $dto->month,
                'year' => $dto->year,
            ],
            ['score' => $dto->score],
        );
    }

    public function forUser(User $user, int $month, int $year): Collection
    {
        return KpiResult::with('kpi.sectors')
            ->where('user_id', $user->id)
            ->where('month', $month)
            ->where('year', $year)
            ->get();
    }

    public function forTeam(User $manager, int $month, int $year): Collection
    {
        $teamIds = $this->hierarchy->getTeamUserIds($manager);

        return KpiResult::with('kpi.sectors', 'user.profile')
            ->whereIn('user_id', $teamIds)
            ->where('month', $month)
            ->where('year', $year)
            ->get();
    }
}
