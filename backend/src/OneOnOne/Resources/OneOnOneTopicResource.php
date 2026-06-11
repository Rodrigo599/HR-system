<?php

namespace Src\OneOnOne\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OneOnOneTopicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'addressed' => (bool) $this->addressed,
            'author_user_id' => $this->author_user_id,
            'created_at' => $this->created_at,
        ];
    }
}
