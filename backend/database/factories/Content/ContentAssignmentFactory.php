<?php

namespace Database\Factories\Content;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Content\Enums\ContentStatus;
use Src\Content\Models\ContentAssignment;
use Src\Content\Models\ContentItem;

class ContentAssignmentFactory extends Factory
{
    protected $model = ContentAssignment::class;

    public function definition(): array
    {
        return [
            'item_id' => ContentItem::factory(),
            'user_id' => User::factory(),
            'status' => ContentStatus::NotSeen->value,
            'seen_at' => null,
            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state([
            'status' => ContentStatus::Completed->value,
            'seen_at' => now()->subDays(2),
            'completed_at' => now()->subDay(),
        ]);
    }

    public function inProgress(): static
    {
        return $this->state([
            'status' => ContentStatus::InProgress->value,
            'seen_at' => now()->subDay(),
        ]);
    }
}
