<?php

namespace Src\PDI\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PdiTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pdi_id' => $this->pdi_id,
            'title' => $this->title,
            'description' => $this->description,
            'link' => $this->link,
            'completed' => $this->completed,
            'due_date' => $this->due_date,
            'status' => $this->status->value,
            'reviewer_id' => $this->reviewer_id,
            'review_comment' => $this->review_comment,
            'reviewed_at' => $this->reviewed_at,
            'created_at' => $this->created_at,
        ];
    }
}
