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
        public readonly ?string $birthDate,
    ) {}

    public static function fromRequest(Request $request): self
    {
        // Setor e gestor são estrutura organizacional: só admin pode alterá-los
        // (PRD 3.1 "Editar perfil de outro (setor, gestor): admin U"). Um colaborador
        // NÃO pode se reatribuir a outro gestor/setor pela própria tela de perfil.
        $isAdmin = $request->user()->hasRole('admin');

        return new self(
            fullName: $request->input('full_name'),
            avatarUrl: $request->input('avatar_url'),
            sectorId: $isAdmin ? $request->input('sector_id') : null,
            managerId: $isAdmin ? $request->input('manager_id') : null,
            preferredLanguage: $request->input('preferred_language'),
            birthDate: $request->input('birth_date'),
        );
    }
}
