<?php

namespace Src\Content\Policies;

use App\Models\User;
use Src\Content\Models\ContentAssignment;
use Src\Content\Models\ContentItem;

class ContentPolicy
{
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'gestor']);
    }

    public function assign(User $user, ContentItem $item): bool
    {
        return $item->created_by === $user->id
            || $user->hasRole('admin');
    }

    public function updateProgress(User $user, ContentAssignment $assignment): bool
    {
        return $assignment->user_id === $user->id;
    }

    public function viewProgress(User $user, ContentItem $item): bool
    {
        return $item->created_by === $user->id
            || $user->hasRole('admin');
    }
}
