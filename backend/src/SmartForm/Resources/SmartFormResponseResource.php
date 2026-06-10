<?php

namespace Src\SmartForm\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SmartFormResponseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'form_id' => $this->form_id,
            'form_slug' => $this->form_slug,
            'user_id' => $this->user_id,
            'assigned_to' => $this->assigned_to,
            'responses' => $this->responses,
            'status' => $this->status,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'profile' => $this->user->relationLoaded('profile')
                    ? ['full_name' => $this->user->profile->full_name]
                    : null,
            ]),
        ];
    }
}
