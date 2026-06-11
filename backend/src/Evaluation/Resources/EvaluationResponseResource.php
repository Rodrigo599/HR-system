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
            'self_score' => $this->self_score,
            'manager_score' => $this->manager_score,
            'final_score' => $this->final_score,
        ];
    }
}
