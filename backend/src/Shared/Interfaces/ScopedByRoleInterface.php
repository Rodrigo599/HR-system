<?php

namespace Src\Shared\Interfaces;

use App\Models\User;
use Illuminate\Support\Collection;

interface ScopedByRoleInterface
{
    public function forUser(User $user): Collection;
}
