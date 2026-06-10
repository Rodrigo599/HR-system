<?php

namespace Src\Organization\Services;

use App\Models\User;
use Src\Organization\DTOs\UpdateProfileDTO;
use Src\Organization\Models\Profile;

class ProfileService
{
    public function update(User $user, UpdateProfileDTO $dto): Profile
    {
        $data = array_filter([
            'full_name' => $dto->fullName,
            'avatar_url' => $dto->avatarUrl,
            'sector_id' => $dto->sectorId,
            'manager_id' => $dto->managerId,
            'preferred_language' => $dto->preferredLanguage,
        ], fn ($v) => $v !== null);

        $user->profile->update($data);

        return $user->profile->fresh(['sector']);
    }
}
