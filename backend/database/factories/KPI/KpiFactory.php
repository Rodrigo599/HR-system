<?php

namespace Database\Factories\KPI;

use Illuminate\Database\Eloquent\Factories\Factory;
use Src\KPI\Enums\KpiUnit;
use Src\KPI\Models\Kpi;

class KpiFactory extends Factory
{
    protected $model = Kpi::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'target_value' => fake()->randomFloat(2, 10, 100),
            'unit' => KpiUnit::Percentual->value,
        ];
    }
}
