<?php

namespace Src\Feedback\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Feedback\Enums\FeedbackVisibility;
use Src\Organization\Resources\UserResource;

class FeedbackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isPrivate = $this->visibility === FeedbackVisibility::Private
            && $request->user()->id !== $this->from_user_id
            && $request->user()->id !== $this->to_user_id;

        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'content' => $this->content,
            'visibility' => $this->visibility->value,
            'created_at' => $this->created_at,
            'to_user_id' => $this->to_user_id,
            'from_user_id' => $isPrivate ? null : $this->from_user_id,
            'from_user' => $this->whenLoaded('fromUser', fn () => $isPrivate ? null : new UserResource($this->fromUser)),
            'to_user' => $this->whenLoaded('toUser', fn () => new UserResource($this->toUser)),
        ];
    }
}
