<?php

namespace Database\Factories\OneOnOne;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\OneOnOne\Enums\RecurrenceRule;
use Src\OneOnOne\Models\OneOnOne;

class OneOnOneFactory extends Factory
{
    protected $model = OneOnOne::class;

    public function definition(): array
    {
        return [
            'manager_id' => User::factory(),
            'report_id' => User::factory(),
            'scheduled_at' => now()->addDays(7),
            'recurrence_rule' => null, // nullable: sem recorrência por padrão
            'status' => 'scheduled',
            'notes' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(['status' => 'completed']);
    }

    public function weekly(): static
    {
        return $this->state(['recurrence_rule' => RecurrenceRule::Weekly]);
    }

    public function biweekly(): static
    {
        return $this->state(['recurrence_rule' => RecurrenceRule::Biweekly]);
    }

    public function monthly(): static
    {
        return $this->state(['recurrence_rule' => RecurrenceRule::Monthly]);
    }
}
