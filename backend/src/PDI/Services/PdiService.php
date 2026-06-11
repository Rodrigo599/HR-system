<?php

namespace Src\PDI\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\PDI\DTOs\CreatePdiDTO;
use Src\PDI\Models\Pdi;
use Src\Organization\Services\HierarchyService;

class PdiService
{
    public function __construct(private readonly HierarchyService $hierarchy) {}

    public function create(User $user, CreatePdiDTO $dto): Pdi
    {
        $pdi = Pdi::create([
            'user_id' => $user->id,
            'title' => $dto->title,
            'description' => $dto->description,
            'start_date' => $dto->startDate,
            'end_date' => $dto->endDate,
        ]);

        $pdi->setRelation('tasks', collect());

        return $pdi;
    }

    public function forUser(User $user): Collection
    {
        return Pdi::with('tasks')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function forTeam(User $manager): Collection
    {
        $teamIds = $this->hierarchy->getTeamUserIds($manager);

        return Pdi::with('tasks', 'user.profile')
            ->whereIn('user_id', $teamIds)
            ->orderByDesc('created_at')
            ->get();
    }
}
