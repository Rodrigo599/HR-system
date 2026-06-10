<?php

namespace Src\Auth\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'profile' => $this->whenLoaded('profile', fn () => [
                'id' => $this->profile->id,
                'full_name' => $this->profile->full_name,
                'avatar_url' => $this->profile->avatar_url,
                'sector_id' => $this->profile->sector_id,
                'manager_id' => $this->profile->manager_id,
                'preferred_language' => $this->profile->preferred_language,
                'active' => $this->profile->active,
            ]),
            'roles' => $this->whenLoaded('roles', fn () =>
                $this->roles->pluck('role')->map->value->values()
            ),
        ];
    }
}
