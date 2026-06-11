<?php

namespace Src\Auth\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Organization\Resources\ProfileResource;

class AuthUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'profile' => new ProfileResource($this->whenLoaded('profile')),
            'roles' => $this->whenLoaded('roles', fn () =>
                $this->roles->pluck('role')->map->value->values()
            ),
        ];
    }
}
