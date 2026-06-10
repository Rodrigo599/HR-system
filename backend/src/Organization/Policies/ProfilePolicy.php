<?php

namespace Src\Organization\Policies;

use App\Models\User;
use Src\Organization\Models\Profile;

class ProfilePolicy
{
    public function update(User $auth, Profile $profile): bool
    {
        return $auth->id === $profile->user_id || $auth->hasRole('admin');
    }
}
