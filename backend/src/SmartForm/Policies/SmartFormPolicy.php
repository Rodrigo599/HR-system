<?php

namespace Src\SmartForm\Policies;

use App\Models\User;
use Src\SmartForm\Models\SmartForm;

class SmartFormPolicy
{
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'gestor']);
    }

    public function update(User $user, SmartForm $form): bool
    {
        return $user->hasAnyRole(['admin', 'gestor']);
    }

    public function delete(User $user, SmartForm $form): bool
    {
        return $user->hasRole('admin');
    }

    public function viewResponses(User $user, SmartForm $form): bool
    {
        return $user->hasAnyRole(['admin', 'gestor']);
    }
}
