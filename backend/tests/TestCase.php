<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Src\Organization\Models\Profile;
use Src\Organization\Models\Sector;
use Src\Organization\Models\UserRole;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function makeUser(string $role = 'colaborador', ?Sector $sector = null, ?Profile $manager = null): User
    {
        $user = User::factory()->create();

        Profile::factory()->create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'sector_id' => $sector?->id,
            'manager_id' => $manager?->id,
        ]);

        UserRole::factory()->create([
            'user_id' => $user->id,
            'role' => $role,
        ]);

        return $user->fresh(['profile', 'roles']);
    }

    protected function asUser(string $role = 'colaborador', ?Sector $sector = null, ?Profile $manager = null)
    {
        return $this->actingAs($this->makeUser($role, $sector, $manager));
    }

    protected function makeSector(string $name = null): Sector
    {
        return Sector::factory()->create($name ? ['name' => $name] : []);
    }
}
