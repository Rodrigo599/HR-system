<?php

namespace Database\Factories\Organization;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Organization\Enums\AppRole;
use Src\Organization\Models\UserRole;

class UserRoleFactory extends Factory
{
    protected $model = UserRole::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'role' => AppRole::Colaborador->value,
        ];
    }

    public function admin(): static
    {
        return $this->state(['role' => AppRole::Admin->value]);
    }

    public function gestor(): static
    {
        return $this->state(['role' => AppRole::Gestor->value]);
    }
}
