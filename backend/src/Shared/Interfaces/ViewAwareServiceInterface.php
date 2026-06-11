<?php

namespace Src\Shared\Interfaces;

use App\Models\User;
use Illuminate\Support\Collection;

interface ViewAwareServiceInterface
{
    public function forUser(User $user): Collection;

    public function forTeam(User $user): Collection;
}
