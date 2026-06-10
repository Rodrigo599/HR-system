<?php

namespace Database\Factories\OneOnOne;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Src\OneOnOne\Models\OneOnOne;
use Src\OneOnOne\Models\OneOnOneNote;

class OneOnOneNoteFactory extends Factory
{
    protected $model = OneOnOneNote::class;

    public function definition(): array
    {
        return [
            'one_on_one_id' => OneOnOne::factory(),
            'author_user_id' => User::factory(),
            'content' => fake()->paragraph(),
            'type' => 'general',
        ];
    }

    public function decision(): static
    {
        return $this->state(['type' => 'decision']);
    }

    public function action(): static
    {
        return $this->state(['type' => 'action']);
    }
}
