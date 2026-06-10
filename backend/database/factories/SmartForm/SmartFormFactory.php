<?php

namespace Database\Factories\SmartForm;

use Illuminate\Database\Eloquent\Factories\Factory;
use Src\SmartForm\Enums\SmartFormCategory;
use Src\SmartForm\Enums\SmartFormStatus;
use Src\SmartForm\Models\SmartForm;

class SmartFormFactory extends Factory
{
    protected $model = SmartForm::class;

    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'slug' => fake()->unique()->slug(3),
            'config' => ['steps' => [['title' => 'Passo 1', 'fields' => []]]],
            'status' => SmartFormStatus::Active->value,
            'category' => SmartFormCategory::Evaluation->value,
            'sector_id' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => SmartFormStatus::Draft->value]);
    }

    public function survey(): static
    {
        return $this->state(['category' => SmartFormCategory::Survey->value]);
    }
}
