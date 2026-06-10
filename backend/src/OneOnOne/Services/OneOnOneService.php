<?php

namespace Src\OneOnOne\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\OneOnOne\Models\OneOnOne;
use Src\OneOnOne\Models\OneOnOneNote;
use Src\OneOnOne\Models\OneOnOneTopic;

class OneOnOneService
{
    public function create(User $manager, array $data): OneOnOne
    {
        return OneOnOne::create([
            'manager_id' => $manager->id,
            'report_id' => $data['report_id'],
            'scheduled_at' => $data['scheduled_at'],
            'recurrence_rule' => $data['recurrence_rule'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function update(OneOnOne $oneOnOne, array $data): OneOnOne
    {
        $oneOnOne->update(array_filter([
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'recurrence_rule' => $data['recurrence_rule'] ?? null,
            'status' => $data['status'] ?? null,
            'notes' => $data['notes'] ?? null,
        ], fn ($v) => $v !== null));

        return $oneOnOne->fresh();
    }

    public function forUser(User $user): Collection
    {
        return OneOnOne::with('manager.profile', 'report.profile', 'topics', 'notes')
            ->where(fn ($q) => $q
                ->where('manager_id', $user->id)
                ->orWhere('report_id', $user->id)
            )
            ->orderByDesc('scheduled_at')
            ->get();
    }

    public function addTopic(OneOnOne $oneOnOne, User $author, string $content): OneOnOneTopic
    {
        return $oneOnOne->topics()->create([
            'author_user_id' => $author->id,
            'content' => $content,
            'addressed' => false,
        ]);
    }

    public function updateTopic(OneOnOneTopic $topic, array $data): OneOnOneTopic
    {
        $topic->update(array_filter([
            'content' => $data['content'] ?? null,
            'addressed' => $data['addressed'] ?? null,
        ], fn ($v) => $v !== null));

        return $topic->fresh();
    }

    public function addNote(OneOnOne $oneOnOne, User $author, array $data): OneOnOneNote
    {
        return $oneOnOne->notes()->create([
            'author_user_id' => $author->id,
            'content' => $data['content'],
            'type' => $data['type'] ?? 'observation',
        ]);
    }
}
