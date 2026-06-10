<?php

namespace Src\SmartForm\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SmartFormResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'config' => $this->config,
            'status' => $this->status->value,
            'category' => $this->category->value,
            'sector_id' => $this->sector_id,
            'created_at' => $this->created_at,
        ];
    }
}
