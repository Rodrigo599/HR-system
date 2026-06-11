<?php

namespace Src\PDI\Policies;

use App\Models\User;
use Src\PDI\Models\Pdi;
use Src\PDI\Models\PdiTask;
use Src\PDI\Enums\PdiTaskStatus;

class PdiPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, Pdi $pdi): bool
    {
        return $user->hasRole('admin')
            || $pdi->user_id === $user->id
            || $user->profile?->id === optional($pdi->user->profile)->manager_id;
    }

    public function submitTask(User $user, PdiTask $task): bool
    {
        return $task->pdi->user_id === $user->id;
    }

    public function reviewTask(User $user, PdiTask $task): bool
    {
        $managerProfileId = $user->profile?->id;
        $ownerManagerId = $task->pdi->user->profile?->manager_id;

        return ($managerProfileId && $managerProfileId === $ownerManagerId)
            || $user->hasRole('admin');
    }
}
