<?php

namespace Src\Organization\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $auth): bool
    {
        return $auth->hasRole('admin');
    }

    public function create(User $auth): bool
    {
        return $auth->hasRole('admin');
    }

    public function update(User $auth, User $target): bool
    {
        return $auth->hasRole('admin');
    }

    public function delete(User $auth, User $target): bool
    {
        return $auth->hasRole('admin') && $auth->id !== $target->id;
    }
}
