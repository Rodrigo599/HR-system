<?php

namespace Src\Content\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'created_by' => $this->created_by,
            'type' => $this->type->value,
            'title' => $this->title,
            'description' => $this->description,
            'link_url' => $this->link_url,
            'file_url' => $this->file_url,
            'due_date' => $this->due_date,
            'created_at' => $this->created_at,
            'assignments' => $this->whenLoaded('assignments', fn () =>
                $this->assignments->map(fn ($a) => [
                    'id' => $a->id,
                    'user_id' => $a->user_id,
                    'status' => $a->status->value,
                    'seen_at' => $a->seen_at,
                    'completed_at' => $a->completed_at,
                    'user' => $a->relationLoaded('user') ? [
                        'id' => $a->user->id,
                        'name' => $a->user->name,
                        'profile' => $a->user->relationLoaded('profile')
                            ? ['full_name' => $a->user->profile->full_name]
                            : null,
                    ] : null,
                ])
            ),
        ];
    }
}
