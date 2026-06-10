<?php

namespace Src\OneOnOne\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OneOnOneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'manager_id' => $this->manager_id,
            'report_id' => $this->report_id,
            'scheduled_at' => $this->scheduled_at,
            'recurrence_rule' => $this->recurrence_rule,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'manager' => $this->whenLoaded('manager', fn () => [
                'id' => $this->manager->id,
                'name' => $this->manager->name,
                'profile' => $this->manager->relationLoaded('profile')
                    ? ['full_name' => $this->manager->profile->full_name, 'avatar_url' => $this->manager->profile->avatar_url]
                    : null,
            ]),
            'report' => $this->whenLoaded('report', fn () => [
                'id' => $this->report->id,
                'name' => $this->report->name,
                'profile' => $this->report->relationLoaded('profile')
                    ? ['full_name' => $this->report->profile->full_name, 'avatar_url' => $this->report->profile->avatar_url]
                    : null,
            ]),
            'topics' => $this->whenLoaded('topics', fn () =>
                $this->topics->map(fn ($t) => [
                    'id' => $t->id,
                    'content' => $t->content,
                    'addressed' => $t->addressed,
                    'author_user_id' => $t->author_user_id,
                    'created_at' => $t->created_at,
                ])
            ),
            'notes_list' => $this->whenLoaded('notes', fn () =>
                $this->notes->map(fn ($n) => [
                    'id' => $n->id,
                    'content' => $n->content,
                    'type' => $n->type,
                    'author_user_id' => $n->author_user_id,
                    'created_at' => $n->created_at,
                ])
            ),
        ];
    }
}
