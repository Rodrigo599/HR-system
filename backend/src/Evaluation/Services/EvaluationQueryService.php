<?php

namespace Src\Evaluation\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\Evaluation\Models\Evaluation;
use Src\Organization\Services\HierarchyService;
use Src\Shared\Interfaces\ViewAwareServiceInterface;

class EvaluationQueryService implements ViewAwareServiceInterface
{
    public function __construct(private readonly HierarchyService $hierarchy) {}

    public function forUser(User $user, ?int $year = null): Collection
    {
        return Evaluation::with('assignee.profile', 'creator.profile', 'smartForm')
            ->where(fn ($q) => $q
                ->where('assigned_to', $user->id)
                ->orWhere('created_by', $user->id)
            )
            ->when($year, fn ($q) => $q->where('year', $year))
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();
    }

    public function forTeam(User $manager, ?int $year = null): Collection
    {
        $teamIds = $this->hierarchy->getTeamUserIds($manager);

        return Evaluation::with('assignee.profile', 'creator.profile', 'smartForm')
            ->whereIn('assigned_to', $teamIds)
            ->when($year, fn ($q) => $q->where('year', $year))
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();
    }

    public function forAdmin(?int $year = null): Collection
    {
        return Evaluation::with('assignee.profile', 'creator.profile', 'smartForm')
            ->when($year, fn ($q) => $q->where('year', $year))
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();
    }
}
