<?php

namespace Database\Factories\Feedback;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Feedback\Enums\FeedbackType;
use Src\Feedback\Enums\FeedbackVisibility;
use Src\Feedback\Models\PointwiseFeedback;

class PointwiseFeedbackFactory extends Factory
{
    protected $model = PointwiseFeedback::class;

    public function definition(): array
    {
        return [
            'from_user_id' => User::factory(),
            'to_user_id' => User::factory(),
            'type' => FeedbackType::Kudos->value,
            'content' => fake()->paragraph(),
            'visibility' => FeedbackVisibility::WithManager->value,
        ];
    }

    public function private(): static
    {
        return $this->state(['visibility' => FeedbackVisibility::Private->value]);
    }

    public function adjustment(): static
    {
        return $this->state(['type' => FeedbackType::Adjustment->value]);
    }
}
