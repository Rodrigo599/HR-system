<?php

namespace Database\Factories\Content;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Content\Enums\ContentType;
use Src\Content\Models\ContentItem;

class ContentItemFactory extends Factory
{
    protected $model = ContentItem::class;

    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'type' => ContentType::Training->value,
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'link_url' => fake()->url(),
            'file_url' => null,
            'due_date' => now()->addDays(30),
        ];
    }

    public function reading(): static
    {
        return $this->state(['type' => ContentType::Reading->value]);
    }

    public function process(): static
    {
        return $this->state(['type' => ContentType::Process->value]);
    }
}
