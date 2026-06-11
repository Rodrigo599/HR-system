<?php

namespace Src\OneOnOne\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Organization\Resources\UserResource;

class OneOnOneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'manager_id' => $this->manager_id,
            'report_id' => $this->report_id,
            'scheduled_at' => $this->scheduled_at,
            'recurrence_rule' => $this->recurrence_rule,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'manager' => new UserResource($this->whenLoaded('manager')),
            'report' => new UserResource($this->whenLoaded('report')),
            'topics' => $this->whenLoaded('topics', fn () => OneOnOneTopicResource::collection($this->topics)),
            'notes_list' => $this->whenLoaded('notes', fn () => OneOnOneNoteResource::collection($this->notes)),
        ];
    }
}
