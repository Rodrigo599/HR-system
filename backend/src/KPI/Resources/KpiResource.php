<?php

namespace Src\KPI\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Organization\Resources\SectorResource;

class KpiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'target_value' => $this->target_value,
            'unit' => $this->unit,
            'sector_ids' => $this->whenLoaded('sectors', fn () => $this->sectors->pluck('id')),
            'sectors' => SectorResource::collection($this->whenLoaded('sectors')),
        ];
    }
}
