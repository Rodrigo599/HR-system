<?php

namespace Src\Organization\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DependentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'profile_id' => $this->profile_id,
            'name' => $this->name,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'relationship' => $this->relationship,
            'consent' => (bool) $this->consent,
        ];
    }
}
