<?php

namespace Src\Organization\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'email' => $this->email,
            'full_name' => $this->full_name,
            'avatar_url' => $this->avatar_url,
            'sector_id' => $this->sector_id,
            'manager_id' => $this->manager_id,
            'preferred_language' => $this->preferred_language,
            'active' => $this->active,
            'sector' => $this->whenLoaded('sector', fn () => new SectorResource($this->sector)),
        ];
    }
}
