<?php

namespace Src\PDI\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PdiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'description' => $this->description,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'created_at' => $this->created_at,
            'tasks' => $this->whenLoaded('tasks', fn () =>
                PdiTaskResource::collection($this->tasks)
            ),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'profile' => $this->user->relationLoaded('profile')
                    ? ['full_name' => $this->user->profile->full_name, 'avatar_url' => $this->user->profile->avatar_url]
                    : null,
            ]),
        ];
    }
}
