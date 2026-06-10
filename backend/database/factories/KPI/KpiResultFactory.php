<?php

namespace Database\Factories\KPI;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\KPI\Models\Kpi;
use Src\KPI\Models\KpiResult;

class KpiResultFactory extends Factory
{
    protected $model = KpiResult::class;

    public function definition(): array
    {
        return [
            'kpi_id' => Kpi::factory(),
            'user_id' => User::factory(),
            'score' => fake()->randomFloat(2, 0, 100),
            'month' => now()->month,
            'year' => now()->year,
        ];
    }
}
