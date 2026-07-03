<?php

namespace Src\Organization\Policies;

use App\Models\User;
use Src\Organization\Models\Dependent;
use Src\Organization\Services\HierarchyService;

class DependentPolicy
{
    public function __construct(private readonly HierarchyService $hierarchy) {}

    public function view(User $user, Dependent $dependent): bool
    {
        return $this->manages($user, $dependent);
    }

    public function update(User $user, Dependent $dependent): bool
    {
        return $this->manages($user, $dependent);
    }

    public function delete(User $user, Dependent $dependent): bool
    {
        return $this->manages($user, $dependent);
    }

    /**
     * Pode gerenciar o dependente quem é: admin, o próprio dono do perfil,
     * ou o gestor direto do dono (escopo de time do PRD).
     */
    private function manages(User $user, Dependent $dependent): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $ownerUserId = $dependent->profile->user_id;

        if ($ownerUserId === $user->id) {
            return true;
        }

        $owner = User::find($ownerUserId);

        return $owner !== null
            && $user->hasRole('gestor')
            && $this->hierarchy->isManagerOf($user, $owner);
    }
}
