<?php

namespace Database\Factories\Organization;

use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Organization\Models\Sector;

class SectorFactory extends Factory
{
    protected $model = Sector::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'description' => fake()->sentence(),
        ];
    }
}
