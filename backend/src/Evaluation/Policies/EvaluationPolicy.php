<?php

namespace Src\Evaluation\Policies;

use App\Models\User;
use Src\Evaluation\Models\Evaluation;
use Src\Evaluation\Enums\EvaluationStatus;

class EvaluationPolicy
{
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'gestor']);
    }

    public function view(User $user, Evaluation $evaluation): bool
    {
        return $user->hasRole('admin')
            || $evaluation->assigned_to === $user->id
            || $evaluation->created_by === $user->id;
    }

    public function submitSelf(User $user, Evaluation $evaluation): bool
    {
        return $evaluation->assigned_to === $user->id
            && $evaluation->status === EvaluationStatus::PendingSelf;
    }

    public function submitManager(User $user, Evaluation $evaluation): bool
    {
        return $evaluation->created_by === $user->id
            && $evaluation->status === EvaluationStatus::PendingManager;
    }
}
