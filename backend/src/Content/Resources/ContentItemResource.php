<?php

namespace Src\Content\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Content\Resources\ContentAssignmentResource;

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
            'assignments' => ContentAssignmentResource::collection($this->whenLoaded('assignments')),
        ];
    }
}
