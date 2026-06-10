<?php

namespace Database\Factories\PDI;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\PDI\Models\Pdi;

class PdiFactory extends Factory
{
    protected $model = Pdi::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
        ];
    }
}
