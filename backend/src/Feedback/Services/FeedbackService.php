<?php

namespace Src\Feedback\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\Feedback\Enums\FeedbackVisibility;
use Src\Feedback\Models\PointwiseFeedback;
use Src\Organization\Services\HierarchyService;

class FeedbackService
{
    public function __construct(private readonly HierarchyService $hierarchy) {}

    public function create(User $from, array $data): PointwiseFeedback
    {
        return PointwiseFeedback::create([
            'from_user_id' => $from->id,
            'to_user_id' => $data['to_user_id'],
            'type' => $data['type'],
            'content' => $data['content'],
            'visibility' => $data['visibility'] ?? FeedbackVisibility::WithManager->value,
        ]);
    }

    public function received(User $user): Collection
    {
        return PointwiseFeedback::with('fromUser.profile')
            ->where('to_user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function sent(User $user): Collection
    {
        return PointwiseFeedback::with('toUser.profile')
            ->where('from_user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function forTeam(User $manager): Collection
    {
        $teamIds = $this->hierarchy->getTeamUserIds($manager);

        return PointwiseFeedback::with('fromUser.profile', 'toUser.profile')
            ->where(fn ($q) => $q
                ->whereIn('to_user_id', $teamIds)
                ->orWhereIn('from_user_id', $teamIds)
            )
            ->where('visibility', FeedbackVisibility::WithManager->value)
            ->orderByDesc('created_at')
            ->get();
    }
}
