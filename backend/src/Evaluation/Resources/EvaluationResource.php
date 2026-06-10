<?php

namespace Src\Evaluation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'assignee' => $this->whenLoaded('assignee', fn () => [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
                'profile' => $this->assignee->relationLoaded('profile')
                    ? ['full_name' => $this->assignee->profile->full_name, 'avatar_url' => $this->assignee->profile->avatar_url]
                    : null,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'responses' => $this->whenLoaded('responses', fn () =>
                $this->responses->map(fn ($r) => [
                    'id' => $r->id,
                    'self_score' => $r->self_score,
                    'manager_score' => $r->manager_score,
                    'final_score' => $r->final_score,
                ])
            ),
        ];
    }
}
