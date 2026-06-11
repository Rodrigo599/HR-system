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
            'target_value' => (float) $this->target_value,
            'unit' => $this->unit,
            /** @var string[] */
            'sector_ids' => $this->whenLoaded('sectors', fn (): array => $this->sectors->pluck('id')->all()),
            'sectors' => SectorResource::collection($this->whenLoaded('sectors')),
        ];
    }
}
