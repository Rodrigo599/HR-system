<?php

namespace Src\Evaluation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Organization\Resources\UserResource;

class EvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'type' => $this->type->value,
            'flow_type' => $this->flow_type->value,
            'month' => $this->month,
            'year' => $this->year,
            'smart_form_id' => $this->smart_form_id,
            'created_at' => $this->created_at,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'responses' => EvaluationResponseResource::collection($this->whenLoaded('responses')),
        ];
    }
}
