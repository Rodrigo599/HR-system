<?php

namespace Src\Evaluation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluationResponseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'self_score' => $this->self_score !== null ? (float) $this->self_score : null,
            'manager_score' => $this->manager_score !== null ? (float) $this->manager_score : null,
            'final_score' => $this->final_score !== null ? (float) $this->final_score : null,
        ];
    }
}
