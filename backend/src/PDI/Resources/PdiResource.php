<?php

namespace Src\PDI\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Organization\Resources\UserResource;

class PdiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'description' => $this->description,
            'end_date' => $this->end_date?->toDateString(),
            'created_at' => $this->created_at,
            'tasks' => PdiTaskResource::collection($this->whenLoaded('tasks')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
