<?php

namespace Src\Feedback\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Feedback\Enums\FeedbackVisibility;

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
            'from_user' => $this->whenLoaded('fromUser', fn () => $isPrivate ? null : [
                'id' => $this->fromUser->id,
                'name' => $this->fromUser->name,
                'profile' => $this->fromUser->relationLoaded('profile')
                    ? ['full_name' => $this->fromUser->profile->full_name, 'avatar_url' => $this->fromUser->profile->avatar_url]
                    : null,
            ]),
            'to_user' => $this->whenLoaded('toUser', fn () => [
                'id' => $this->toUser->id,
                'name' => $this->toUser->name,
                'profile' => $this->toUser->relationLoaded('profile')
                    ? ['full_name' => $this->toUser->profile->full_name, 'avatar_url' => $this->toUser->profile->avatar_url]
                    : null,
            ]),
        ];
    }
}
