<?php

namespace Src\Organization\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'profile' => $this->whenLoaded('profile', fn () => new ProfileResource($this->profile)),
            /** @var string[] */
            'roles' => $this->whenLoaded('roles', fn (): array =>
                $this->roles->pluck('role')->map->value->values()->all()
            ),
        ];
    }
}
