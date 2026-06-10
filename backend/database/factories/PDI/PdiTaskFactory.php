<?php

namespace Database\Factories\PDI;

use Illuminate\Database\Eloquent\Factories\Factory;
use Src\PDI\Enums\PdiTaskStatus;
use Src\PDI\Models\Pdi;
use Src\PDI\Models\PdiTask;

class PdiTaskFactory extends Factory
{
    protected $model = PdiTask::class;

    public function definition(): array
    {
        return [
            'pdi_id' => Pdi::factory(),
            'title' => fake()->sentence(5),
            'description' => fake()->sentence(),
            'link' => null,
            'completed' => false,
            'due_date' => now()->addDays(30),
            'status' => PdiTaskStatus::Pending->value,
        ];
    }

    public function submitted(): static
    {
        return $this->state(['status' => PdiTaskStatus::Submitted->value]);
    }

    public function approved(): static
    {
        return $this->state(['status' => PdiTaskStatus::Approved->value, 'completed' => true]);
    }

    public function rejected(): static
    {
        return $this->state(['status' => PdiTaskStatus::Rejected->value]);
    }
}
