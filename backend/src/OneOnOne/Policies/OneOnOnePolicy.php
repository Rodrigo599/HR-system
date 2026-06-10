<?php

namespace Src\OneOnOne\Policies;

use App\Models\User;
use Src\OneOnOne\Models\OneOnOne;

class OneOnOnePolicy
{
    public function view(User $user, OneOnOne $oneOnOne): bool
    {
        return $user->hasRole('admin')
            || $oneOnOne->manager_id === $user->id
            || $oneOnOne->report_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'gestor']);
    }

    public function update(User $user, OneOnOne $oneOnOne): bool
    {
        return $user->hasRole('admin')
            || $oneOnOne->manager_id === $user->id;
    }

    public function interact(User $user, OneOnOne $oneOnOne): bool
    {
        return $oneOnOne->manager_id === $user->id
            || $oneOnOne->report_id === $user->id;
    }
}
