<?php

namespace Src\Evaluation\Policies;

use App\Models\User;
use Src\Evaluation\Models\Evaluation;
use Src\Organization\Models\Profile;
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
            || $evaluation->created_by === $user->id
            || $this->isLineManagerOf($user, $evaluation->assigned_to);
    }

    public function submitSelf(User $user, Evaluation $evaluation): bool
    {
        return $evaluation->assigned_to === $user->id
            && $evaluation->status === EvaluationStatus::PendingSelf;
    }

    /**
     * A avaliação do gestor pode ser preenchida por:
     * - quem criou a avaliação (gestor que criou pro próprio liderado), ou
     * - o gestor direto do avaliado (caso o RH/admin tenha criado), ou
     * - um admin.
     * Tanto RH quanto gestor podem criar; o gestor do avaliado sempre preenche.
     */
    public function submitManager(User $user, Evaluation $evaluation): bool
    {
        if ($evaluation->status !== EvaluationStatus::PendingManager) {
            return false;
        }

        return $user->hasRole('admin')
            || $evaluation->created_by === $user->id
            || $this->isLineManagerOf($user, $evaluation->assigned_to);
    }

    /**
     * $user é o gestor direto do colaborador dono do user_id informado?
     * (profile do avaliado -> manager_id -> profile do gestor -> user_id).
     */
    private function isLineManagerOf(User $user, string $employeeUserId): bool
    {
        if (! $user->hasRole('gestor')) {
            return false;
        }

        $managerProfileId = $user->profile?->id;

        if ($managerProfileId === null) {
            return false;
        }

        return Profile::where('user_id', $employeeUserId)
            ->where('manager_id', $managerProfileId)
            ->exists();
    }
}
