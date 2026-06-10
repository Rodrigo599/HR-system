<?php

namespace Database\Factories\Organization;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Organization\Models\Profile;

class ProfileFactory extends Factory
{
    protected $model = Profile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'email' => fake()->unique()->safeEmail(),
            'full_name' => fake()->name(),
            'avatar_url' => null,
            'sector_id' => null,
            'manager_id' => null,
            'preferred_language' => 'pt',
            'active' => true,
        ];
    }
}
