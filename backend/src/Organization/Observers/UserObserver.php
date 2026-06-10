<?php

namespace Src\Organization\Observers;

use App\Models\User;

class UserObserver
{
    public function created(User $user): void
    {
        if ($user->profile()->doesntExist()) {
            $user->profile()->create([
                'email' => $user->email,
                'full_name' => $user->name,
            ]);
        }

        if ($user->roles()->doesntExist()) {
            $user->roles()->create(['role' => 'colaborador']);
        }
    }
}
