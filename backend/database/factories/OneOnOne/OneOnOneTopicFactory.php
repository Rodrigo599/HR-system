<?php

namespace Database\Factories\OneOnOne;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\OneOnOne\Models\OneOnOne;
use Src\OneOnOne\Models\OneOnOneTopic;

class OneOnOneTopicFactory extends Factory
{
    protected $model = OneOnOneTopic::class;

    public function definition(): array
    {
        return [
            'one_on_one_id' => OneOnOne::factory(),
            'author_user_id' => User::factory(),
            'content' => fake()->sentence(),
            'addressed' => false,
        ];
    }

    public function addressed(): static
    {
        return $this->state(['addressed' => true]);
    }
}
