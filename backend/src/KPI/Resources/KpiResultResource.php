<?php

namespace Src\KPI\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KpiResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kpi_id' => $this->kpi_id,
            'user_id' => $this->user_id,
            'score' => $this->score,
            'month' => $this->month,
            'year' => $this->year,
            'created_at' => $this->created_at,
            'kpi' => $this->whenLoaded('kpi', fn () => new KpiResource($this->kpi)),
        ];
    }
}
