<?php

namespace Src\Content\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\Content\Enums\ContentStatus;
use Src\Content\Models\ContentAssignment;
use Src\Content\Models\ContentItem;
use Src\Organization\Services\HierarchyService;

class ContentService
{
    public function __construct(private readonly HierarchyService $hierarchy) {}

    public function create(User $creator, array $data): ContentItem
    {
        return ContentItem::create([...$data, 'created_by' => $creator->id]);
    }

    public function assign(ContentItem $item, array $userIds): void
    {
        foreach ($userIds as $userId) {
            ContentAssignment::firstOrCreate(
                ['item_id' => $item->id, 'user_id' => $userId],
                ['status' => ContentStatus::NotSeen],
            );
        }
    }

    public function forUser(User $user): Collection
    {
        return ContentAssignment::with('item')
            ->where('user_id', $user->id)
            ->orderByDesc('assigned_at')
            ->get();
    }

    public function forTeam(User $manager): Collection
    {
        $teamIds = $this->hierarchy->getTeamUserIds($manager);

        return ContentItem::with(['assignments' => fn ($q) => $q->whereIn('user_id', $teamIds)->with('user.profile')])
            ->where('created_by', $manager->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function updateProgress(ContentAssignment $assignment, ContentStatus $status): ContentAssignment
    {
        $data = ['status' => $status];

        if ($status === ContentStatus::Seen && ! $assignment->seen_at) {
            $data['seen_at'] = now();
        }

        if ($status === ContentStatus::Completed && ! $assignment->completed_at) {
            $data['completed_at'] = now();
        }

        $assignment->update($data);

        return $assignment->fresh();
    }

    public function itemProgress(ContentItem $item): array
    {
        $assignments = $item->assignments;
        $total = $assignments->count();

        if ($total === 0) {
            return ['total' => 0, 'completed' => 0, 'completion_rate' => 0];
        }

        $completed = $assignments->where('status', ContentStatus::Completed)->count();

        return [
            'total' => $total,
            'seen' => $assignments->whereIn('status', [ContentStatus::Seen, ContentStatus::InProgress, ContentStatus::Completed])->count(),
            'in_progress' => $assignments->where('status', ContentStatus::InProgress)->count(),
            'completed' => $completed,
            'completion_rate' => round($completed / $total * 100, 1),
        ];
    }
}
