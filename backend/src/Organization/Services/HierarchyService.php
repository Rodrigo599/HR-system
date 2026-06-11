<?php

namespace Src\Organization\Services;

use App\Models\User;
use Src\Organization\Models\Profile;

class HierarchyService
{
    public function getDirectReports(User $manager): \Illuminate\Support\Collection
    {
        return Profile::where('manager_id', $manager->profile->id)
            ->with('user', 'sector')
            ->get();
    }

    public function getTeamUserIds(User $manager): array
    {
        return Profile::where('manager_id', $manager->profile->id)
            ->pluck('user_id')
            ->all();
    }

    public function getTeamSectorIds(User $manager): array
    {
        return Profile::where('manager_id', $manager->profile->id)
            ->whereNotNull('sector_id')
            ->pluck('sector_id')
            ->unique()
            ->values()
            ->all();
    }

    public function isManagerOf(User $manager, User $report): bool
    {
        return Profile::where('user_id', $report->id)
            ->where('manager_id', $manager->profile->id)
            ->exists();
    }
}
