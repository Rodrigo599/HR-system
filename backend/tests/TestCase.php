<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Src\Organization\Models\Profile;
use Src\Organization\Models\Sector;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function makeUser(string $role = 'colaborador', ?Sector $sector = null, ?Profile $manager = null): User
    {
        $user = User::factory()->create();

        // O UserObserver já cria o Profile e o UserRole com defaults.
        // Aqui apenas atualizamos os campos específicos do teste.
        $user->profile()->update([
            'sector_id' => $sector?->id,
            'manager_id' => $manager?->id,
        ]);

        if ($role !== 'colaborador') {
            $user->roles()->update(['role' => $role]);
        }

        return $user->fresh(['profile', 'roles']);
    }

    protected function asUser(string $role = 'colaborador', ?Sector $sector = null, ?Profile $manager = null)
    {
        return $this->actingAs($this->makeUser($role, $sector, $manager));
    }

    protected function makeSector(?string $name = null): Sector
    {
        return Sector::factory()->create($name ? ['name' => $name] : []);
    }
}
