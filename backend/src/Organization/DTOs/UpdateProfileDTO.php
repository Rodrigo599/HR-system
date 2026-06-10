<?php

namespace Src\Organization\DTOs;

use Illuminate\Http\Request;

class UpdateProfileDTO
{
    public function __construct(
        public readonly ?string $fullName,
        public readonly ?string $avatarUrl,
        public readonly ?string $sectorId,
        public readonly ?string $managerId,
        public readonly ?string $preferredLanguage,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            fullName: $request->input('full_name'),
            avatarUrl: $request->input('avatar_url'),
            sectorId: $request->input('sector_id'),
            managerId: $request->input('manager_id'),
            preferredLanguage: $request->input('preferred_language'),
        );
    }
}
