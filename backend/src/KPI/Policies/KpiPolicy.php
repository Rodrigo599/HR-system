<?php

namespace Src\KPI\Policies;

use App\Models\User;
use Src\KPI\Models\Kpi;

class KpiPolicy
{
    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Kpi $kpi): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Kpi $kpi): bool
    {
        return $user->hasRole('admin');
    }
}
