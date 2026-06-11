<?php

namespace Src\Content\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Organization\Resources\UserResource;

class ContentAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'item_id' => $this->item_id,
            'user_id' => $this->user_id,
            'status' => $this->status->value,
            'seen_at' => $this->seen_at,
            'completed_at' => $this->completed_at,
            'assigned_at' => $this->assigned_at,
            'item' => new ContentItemResource($this->whenLoaded('item')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
