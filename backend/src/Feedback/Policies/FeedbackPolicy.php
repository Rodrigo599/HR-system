<?php

namespace Src\Feedback\Policies;

use App\Models\User;
use Src\Feedback\Models\PointwiseFeedback;

class FeedbackPolicy
{
    public function delete(User $user, PointwiseFeedback $feedback): bool
    {
        return $feedback->from_user_id === $user->id
            || $user->hasRole('admin');
    }
}
