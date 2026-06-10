<?php

namespace Database\Factories\Evaluation;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Evaluation\Enums\EvaluationFlowType;
use Src\Evaluation\Enums\EvaluationStatus;
use Src\Evaluation\Enums\EvaluationType;
use Src\Evaluation\Models\Evaluation;

class EvaluationFactory extends Factory
{
    protected $model = Evaluation::class;

    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'assigned_to' => User::factory(),
            'status' => EvaluationStatus::PendingSelf->value,
            'type' => EvaluationType::Performance->value,
            'flow_type' => EvaluationFlowType::Sequential->value,
            'month' => fake()->numberBetween(1, 12),
            'year' => 2026,
            'smart_form_id' => null,
        ];
    }

    public function pendingManager(): static
    {
        return $this->state(['status' => EvaluationStatus::PendingManager->value]);
    }

    public function completed(): static
    {
        return $this->state(['status' => EvaluationStatus::Completed->value]);
    }

    public function blind(): static
    {
        return $this->state(['flow_type' => EvaluationFlowType::Blind->value]);
    }
}
